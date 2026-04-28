"""
Nurse routes:
  GET  /api/nurse/search-patient
  POST /api/nurse/register-patient
  GET  /api/nurse/doctor-availability
  PUT  /api/nurse/update-doctor/{doctor_id}
  GET  /api/nurse/doctor-patient-map
  GET  /api/nurse/waitlist
  PUT  /api/nurse/patient/{patient_id}
  POST /api/nurse/assign-doctor
"""

import os
import json
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.auth import decode_token, hash_password

router = APIRouter(prefix="/api/nurse", tags=["nurse"])


def _check_nurse_or_admin(authorization: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("type") not in ("nurse", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return payload


@router.get("/search-patient")
def search_patient(name: str = Query(""), authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM patients WHERE name LIKE ? OR patient_id LIKE ?",
        (f"%{name}%", f"%{name}%"),
    )
    results = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"patients": results}


class RegisterPatientRequest(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: str
    issue: str
    phone: Optional[str] = ""
    blood_group: Optional[str] = ""
    allergies: Optional[str] = ""
    emergency: Optional[bool] = False
    password: Optional[str] = "patient123"  # default password


@router.post("/register-patient")
def register_patient(req: RegisterPatientRequest, authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    # Check if patient_id already exists
    cur.execute("SELECT COUNT(*) as cnt FROM patients WHERE patient_id = ?", (req.patient_id,))
    count = cur.fetchone()["cnt"]
    if count > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")

    patient_id = req.patient_id

    # Create patient record
    cur.execute(
        "INSERT INTO patients(patient_id,name,age,gender,phone,blood_group,allergies,"
        "diagnosis,medicines,doctor,next_visit,emergency) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            patient_id, req.name, req.age, req.gender,
            req.phone, req.blood_group, req.allergies,
            req.issue,  # initial diagnosis = issue
            "", "", "", 1 if req.emergency else 0,
        ),
    )

    # Create user account for patient
    hashed = hash_password(req.password)
    cur.execute(
        "INSERT OR IGNORE INTO users(user_id,password,user_type,name,created_at) VALUES(?,?,?,?,?)",
        (patient_id, hashed, "patient", req.name, datetime.now().isoformat()),
    )

    conn.commit()
    conn.close()

    # Call allocate_doctor MCP tool
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import allocate_doctor

    allocation = allocate_doctor(req.name, req.issue)

    return {
        "patient_id": patient_id,
        "password": req.password,
        "allocation": allocation,
    }


@router.get("/doctor-availability")
def doctor_availability(authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM doctors ORDER BY id")
    doctors = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"doctors": doctors}


class UpdateDoctorRequest(BaseModel):
    available_time: Optional[str] = None
    is_booked: Optional[int] = None


@router.put("/update-doctor/{doctor_id}")
def update_doctor(doctor_id: int, req: UpdateDoctorRequest, authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    updates = []
    params = []
    if req.available_time is not None:
        updates.append("available_time=?")
        params.append(req.available_time)
    if req.is_booked is not None:
        updates.append("is_booked=?")
        params.append(req.is_booked)

    if not updates:
        conn.close()
        return {"status": "NO_CHANGE"}

    params.append(doctor_id)
    cur.execute(f"UPDATE doctors SET {', '.join(updates)} WHERE id=?", params)
    conn.commit()
    conn.close()

    return {"status": "UPDATED", "doctor_id": doctor_id}


@router.get("/doctor-patient-map")
def doctor_patient_map(authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT a.*, p.name as patient_name, p.age, p.gender, d.specialty "
        "FROM appointments a "
        "LEFT JOIN patients p ON a.patient_id = p.patient_id "
        "LEFT JOIN doctors d ON a.doctor_id = d.id "
        "WHERE a.status IN ('WAITING', 'IN_CONSULTATION') "
        "ORDER BY a.created_at DESC"
    )
    mappings = [dict(r) for r in cur.fetchall()]
    conn.close()

    return {"mappings": mappings}


class UpdatePatientRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None


@router.put("/patient/{patient_id}")
def update_patient(patient_id: str, req: UpdatePatientRequest, authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    updates = []
    params = []

    if req.name is not None:
        updates.append("name=?")
        params.append(req.name)
        # Also update users table
        cur.execute("UPDATE users SET name=? WHERE user_id=? AND user_type='patient'", (req.name, patient_id))
    if req.age is not None:
        updates.append("age=?")
        params.append(req.age)
    if req.gender is not None:
        updates.append("gender=?")
        params.append(req.gender)
    if req.phone is not None:
        updates.append("phone=?")
        params.append(req.phone)
    if req.blood_group is not None:
        updates.append("blood_group=?")
        params.append(req.blood_group)
    if req.allergies is not None:
        updates.append("allergies=?")
        params.append(req.allergies)

    if updates:
        params.append(patient_id)
        cur.execute(f"UPDATE patients SET {', '.join(updates)} WHERE patient_id=?", params)
        conn.commit()

    conn.close()
    return {"status": "UPDATED"}


class AssignDoctorRequest(BaseModel):
    patient_id: str
    doctor_id: int


@router.post("/assign-doctor")
def assign_doctor(req: AssignDoctorRequest, authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    # 1. Ensure patient exists
    cur.execute("SELECT name FROM patients WHERE patient_id=?", (req.patient_id,))
    patient = cur.fetchone()
    if not patient:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Ensure doctor exists
    cur.execute("SELECT name, specialty, available_time FROM doctors WHERE id=?", (req.doctor_id,))
    doc = cur.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    # 3. Delete any existing WAITING appointments for this patient
    cur.execute("DELETE FROM appointments WHERE patient_id=? AND status='WAITING'", (req.patient_id,))

    # 4. Remove from waitlist if present
    cur.execute("DELETE FROM waitlist WHERE patient_name=?", (patient["name"],))

    # 5. Mark doctor as booked
    cur.execute("UPDATE doctors SET is_booked=1 WHERE id=?", (req.doctor_id,))

    # 6. Create appointment
    created_at = datetime.now().isoformat()
    cur.execute(
        "INSERT INTO appointments(patient_id,doctor_id,doctor_name,specialty,status,slot,created_at) "
        "VALUES(?,?,?,?,?,?,?)",
        (req.patient_id, req.doctor_id, doc["name"], doc["specialty"], "WAITING", doc["available_time"], created_at)
    )

    conn.commit()
    conn.close()

    return {"status": "ASSIGNED", "doctor": doc["name"], "slot": doc["available_time"]}


@router.get("/waitlist")
def get_waitlist(authorization: str = Header(None)):
    _check_nurse_or_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM waitlist ORDER BY created_at DESC")
    waitlist = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"waitlist": waitlist}
