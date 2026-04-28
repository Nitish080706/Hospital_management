"""
Doctor routes:
  GET  /api/doctor/assigned-patients
  GET  /api/doctor/patient-history/{patient_id}
  GET  /api/doctor/profile
  PUT  /api/doctor/profile
  POST /api/doctor/process-consultation
  POST /api/doctor/order-test
  POST /api/doctor/check-insurance
  POST /api/doctor/schedule-followup
  POST /api/doctor/complete-consultation
"""

import os
import json
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.auth import decode_token

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


def _get_doctor(authorization: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("type") != "doctor":
        raise HTTPException(status_code=403, detail="Not a doctor")
    return payload


@router.get("/assigned-patients")
def assigned_patients(authorization: str = Header(None)):
    doc = _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    # Find doctor record by user_id
    cur.execute("SELECT id, name FROM doctors WHERE user_id=?", (doc["sub"],))
    doc_row = cur.fetchone()
    if not doc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    doctor_id = doc_row["id"]

    # Get all appointments for this doctor
    cur.execute(
        "SELECT a.*, p.name as patient_name, p.age, p.gender "
        "FROM appointments a "
        "LEFT JOIN patients p ON a.patient_id = p.patient_id "
        "WHERE a.doctor_id=? "
        "ORDER BY CASE a.status "
        "  WHEN 'IN_CONSULTATION' THEN 1 "
        "  WHEN 'WAITING' THEN 2 "
        "  WHEN 'COMPLETED' THEN 3 END, "
        "a.created_at DESC",
        (doctor_id,),
    )
    patients = [dict(r) for r in cur.fetchall()]
    conn.close()

    return {"doctor_name": doc_row["name"], "patients": patients}


@router.get("/patient-history/{patient_id}")
def patient_history(patient_id: str, authorization: str = Header(None)):
    _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    # Patient info
    cur.execute("SELECT * FROM patients WHERE patient_id=?", (patient_id,))
    patient = cur.fetchone()
    patient_data = dict(patient) if patient else None

    # Consultation history
    cur.execute(
        "SELECT * FROM consultation_history WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    history = []
    for h in cur.fetchall():
        d = dict(h)
        try:
            d["processed_data"] = json.loads(d["processed_data"]) if d["processed_data"] else None
        except (json.JSONDecodeError, TypeError):
            pass
        history.append(d)

    # Past test orders
    cur.execute(
        "SELECT * FROM test_orders WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    tests = [dict(r) for r in cur.fetchall()]

    # Past follow-ups
    cur.execute(
        "SELECT * FROM consultations WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    followups = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "patient": patient_data,
        "consultation_history": history,
        "test_orders": tests,
        "followups": followups,
    }


@router.get("/profile")
def get_doctor_profile(authorization: str = Header(None)):
    doc = _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id, user_id, name, specialty, available_time FROM doctors WHERE user_id=?", (doc["sub"],))
    profile = cur.fetchone()
    conn.close()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return dict(profile)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    available_time: Optional[str] = None


@router.put("/profile")
def update_doctor_profile(req: UpdateProfileRequest, authorization: str = Header(None)):
    doc = _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    # Get current doctor
    cur.execute("SELECT id FROM doctors WHERE user_id=?", (doc["sub"],))
    d = cur.fetchone()
    if not d:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")

    doctor_id = d["id"]
    updates = []
    params = []

    if req.name is not None:
        updates.append("name=?")
        params.append(req.name)
        # also update the users table to keep names in sync
        cur.execute("UPDATE users SET name=? WHERE user_id=?", (req.name, doc["sub"]))
        
    if req.specialty is not None:
        updates.append("specialty=?")
        params.append(req.specialty)
        
    if req.available_time is not None:
        updates.append("available_time=?")
        params.append(req.available_time)

    if updates:
        params.append(doctor_id)
        cur.execute(f"UPDATE doctors SET {', '.join(updates)} WHERE id=?", params)
        conn.commit()

    conn.close()
    return {"status": "UPDATED"}


class ProcessConsultationRequest(BaseModel):
    patient_id: str
    raw_notes: str


@router.post("/process-consultation")
def process_consultation_route(req: ProcessConsultationRequest, authorization: str = Header(None)):
    doc = _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    # Get doctor name
    cur.execute("SELECT name FROM doctors WHERE user_id=?", (doc["sub"],))
    doc_row = cur.fetchone()
    doctor_name = doc_row["name"] if doc_row else doc["name"]

    # Call the MCP tool directly
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import process_consultation

    result = process_consultation(req.raw_notes)

    # Save to consultation history
    cur.execute(
        "INSERT INTO consultation_history(patient_id,doctor_name,raw_notes,processed_data,created_at) "
        "VALUES(?,?,?,?,?)",
        (
            req.patient_id,
            doctor_name,
            req.raw_notes,
            json.dumps(result),
            __import__("datetime").datetime.now().isoformat(),
        ),
    )

    # Update patient diagnosis and medicines from processed result
    consultation = result.get("consultation", {})
    prescription = result.get("prescription", [])
    diagnosis_list = consultation.get("diagnosis", [])
    if diagnosis_list:
        diagnosis_str = ", ".join(diagnosis_list) if isinstance(diagnosis_list, list) else str(diagnosis_list)
        medicines_str = ", ".join([p.get("medicine_name", "") for p in prescription if p.get("medicine_name")])
        cur.execute(
            "UPDATE patients SET diagnosis=?, medicines=?, doctor=? WHERE patient_id=?",
            (diagnosis_str, medicines_str, doctor_name, req.patient_id),
        )

    # Update appointment status
    cur.execute("SELECT id FROM doctors WHERE user_id=?", (doc["sub"],))
    d = cur.fetchone()
    if d:
        cur.execute(
            "UPDATE appointments SET status='IN_CONSULTATION' "
            "WHERE patient_id=? AND doctor_id=? AND status='WAITING'",
            (req.patient_id, d["id"]),
        )

    conn.commit()
    conn.close()

    return {"status": "PROCESSED", "result": result}


class OrderTestRequest(BaseModel):
    patient_id: str
    patient_name: str
    tests: list[str]


@router.post("/order-test")
def order_test_route(req: OrderTestRequest, authorization: str = Header(None)):
    _get_doctor(authorization)

    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import order_test

    result = order_test(req.patient_id, req.patient_name, req.tests)
    return result


class CheckInsuranceRequest(BaseModel):
    patient_id: str
    requested_amount: int


@router.post("/check-insurance")
def check_insurance_route(req: CheckInsuranceRequest, authorization: str = Header(None)):
    _get_doctor(authorization)

    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import check_insurance

    result = check_insurance(req.patient_id, req.requested_amount)
    return result


class ScheduleFollowupRequest(BaseModel):
    patient_id: str
    advice: str


@router.post("/schedule-followup")
def schedule_followup_route(req: ScheduleFollowupRequest, authorization: str = Header(None)):
    _get_doctor(authorization)

    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import schedule_consultation

    result = schedule_consultation(req.patient_id, req.advice)

    # Update patient next_visit
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE patients SET next_visit=? WHERE patient_id=?",
        (result.get("next_appointment"), req.patient_id),
    )
    conn.commit()
    conn.close()

    return result


class CompleteRequest(BaseModel):
    patient_id: str


@router.post("/complete-consultation")
def complete_consultation(req: CompleteRequest, authorization: str = Header(None)):
    doc = _get_doctor(authorization)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM doctors WHERE user_id=?", (doc["sub"],))
    d = cur.fetchone()
    if d:
        cur.execute(
            "UPDATE appointments SET status='COMPLETED' "
            "WHERE patient_id=? AND doctor_id=? AND status IN ('WAITING','IN_CONSULTATION')",
            (req.patient_id, d["id"]),
        )
        # Free up the doctor
        cur.execute("UPDATE doctors SET is_booked=0 WHERE id=?", (d["id"],))

    conn.commit()
    conn.close()

    return {"status": "COMPLETED", "patient_id": req.patient_id}
