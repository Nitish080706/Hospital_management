

import os
import re
import json
import uuid
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from fastmcp import FastMCP
from groq import Groq

try:
    from rag_service import rag_service
except ImportError:
    rag_service = None






mcp = FastMCP(
    name="HospitalAI",
    instructions=(
        "Hospital AI assistant with 6 tools: "
        "allocate_doctor, process_consultation, check_insurance, "
        "schedule_consultation, order_test, patient_query."
    ),
)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hospital.db")






def _db() -> sqlite3.Connection:
    
    return sqlite3.connect(DB_PATH)


def _groq_client() -> Groq:
    
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise EnvironmentError("GROQ_API_KEY not set")
    return Groq(api_key=key)


def _call_groq(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    
    client = _groq_client()
    res = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return res.choices[0].message.content.strip()


def _safe_json(raw: str) -> dict:
    
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model output")
    return json.loads(match.group())





class AIAuditLogger:
    @staticmethod
    def log(tool_name: str, triggered_by: str, input_payload: dict, raw_response: str, parsed_output: dict, flags: list, outcome: str):
        conn = _db()
        cur = conn.cursor()
        log_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO ai_audit_logs (log_id, timestamp, tool_name, triggered_by, input_payload, llm_response_raw, parsed_output, guardrail_flags, outcome) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                log_id,
                datetime.now().isoformat(),
                tool_name,
                triggered_by,
                json.dumps(input_payload),
                raw_response,
                json.dumps(parsed_output) if parsed_output else "",
                json.dumps(flags),
                outcome
            )
        )
        conn.commit()
        conn.close()

def validate_input_guardrails(text: str) -> list:
    flags = []
    text_lower = text.lower()

    injection_patterns = ["ignore previous", "return all", "system prompt", "bypass", "override instructions", "disregard"]
    for p in injection_patterns:
        if p in text_lower:
            flags.append(f"Possible prompt injection detected: {p}")
            

    if "other patients" in text_lower or "all patients" in text_lower:
        flags.append("Cross-patient query detected")
        
    return flags

def validate_output_guardrails(parsed_json: dict) -> list:
    flags = []
    dump_str = json.dumps(parsed_json).lower()
    uncertain_terms = ["possibly", "may indicate", "might be", "unsure", "unclear"]
    for term in uncertain_terms:
        if term in dump_str:
            flags.append(f"Uncertain language detected: {term}")
            

    if "consultation" in parsed_json and "diagnosis" not in parsed_json["consultation"]:
        flags.append("Missing diagnosis field in schema")
        
    return flags






def _init_all_tables():
    conn = _db()
    cur = conn.cursor()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()


    cur.execute()

    conn.commit()
    conn.close()


def seed_sample_data():
    
    import bcrypt

    conn = _db()
    cur = conn.cursor()


    hashed = bcrypt.hashpw("000000".encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "INSERT OR IGNORE INTO users(user_id,password,user_type,name,created_at) "
        "VALUES(?,?,?,?,?)",
        ("admin-000", hashed, "admin", "System Admin", datetime.now().isoformat()),
    )


    cur.execute("SELECT COUNT(*) FROM doctors")
    if cur.fetchone()[0] == 0:
        doctors = [
            ("Dr Ravi", "Pediatrician", "10:00 AM", 0),
            ("Dr Meena", "Dermatologist", "11:00 AM", 0),
            ("Dr Arjun", "Cardiologist", "12:00 PM", 0),
            ("Dr Kiran", "General Physician", "01:00 PM", 0),
            ("Dr Divya", "Neurologist", "02:00 PM", 0),
            ("Dr Sana", "Dermatologist", "03:00 PM", 0),
        ]
        for name, spec, time, booked in doctors:
            doc_uid = f"doc-{name.split()[-1].lower()}"
            doc_hashed = bcrypt.hashpw("doctor123".encode(), bcrypt.gensalt()).decode()
            cur.execute(
                "INSERT OR IGNORE INTO users(user_id,password,user_type,name,created_at) "
                "VALUES(?,?,?,?,?)",
                (doc_uid, doc_hashed, "doctor", name, datetime.now().isoformat()),
            )
            cur.execute(
                "INSERT INTO doctors(user_id,name,specialty,available_time,is_booked) "
                "VALUES(?,?,?,?,?)",
                (doc_uid, name, spec, time, booked),
            )


    nurse_hashed = bcrypt.hashpw("nurse123".encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "INSERT OR IGNORE INTO users(user_id,password,user_type,name,created_at) "
        "VALUES(?,?,?,?,?)",
        ("nurse-001", nurse_hashed, "nurse", "Head Nurse", datetime.now().isoformat()),
    )

    conn.commit()
    conn.close()






@mcp.tool()
def allocate_doctor(patient_name: str, patient_issue: str) -> dict:
    
    conn = _db()
    conn.isolation_level = "EXCLUSIVE"
    cur = conn.cursor()

    try:

        prompt = f

        input_flags = validate_input_guardrails(patient_issue)
        if any("prompt injection" in f.lower() or "cross-patient" in f.lower() for f in input_flags):
            AIAuditLogger.log("allocate_doctor", "system", {"patient": patient_name, "issue": patient_issue}, "", {}, input_flags, "REJECTED_INPUT")
            return {"error": "Input rejected due to safety policy violation."}

        client = _groq_client()
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw = res.choices[0].message.content.strip()
        
        try:
            ai = json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
        except Exception as e:
            AIAuditLogger.log("allocate_doctor", "system", {"patient": patient_name, "issue": patient_issue}, raw, {}, ["JSON Parse Error"], "FAILED")
            raise e

        output_flags = validate_output_guardrails(ai)
        
        specialty = ai.get("specialty", "General Physician")
        confidence = ai.get("confidence", 0.0)
        urgent = ai.get("urgent", False)
        top2 = ai.get("top2", [])

        if confidence < 0.60:
            specialty = top2[0]


        if urgent:
            cur.execute(
                "SELECT id,name,specialty,available_time FROM doctors "
                "WHERE specialty=? ORDER BY id ASC LIMIT 1",
                (specialty,),
            )
        else:
            cur.execute(
                "SELECT id,name,specialty,available_time FROM doctors "
                "WHERE specialty=? AND is_booked=0 ORDER BY id ASC LIMIT 1",
                (specialty,),
            )

        doctor = cur.fetchone()

        if doctor:
            doc_id = doctor[0]
            cur.execute(
                "UPDATE doctors SET is_booked=1 WHERE id=? AND is_booked=0",
                (doc_id,),
            )
            if cur.rowcount == 1 or urgent:

                cur.execute(
                    "INSERT INTO appointments(patient_id,doctor_id,doctor_name,issue,specialty,slot,status,created_at) "
                    "VALUES(?,?,?,?,?,?,?,?)",
                    (
                        f"pat-{patient_name.lower().replace(' ', '-')}",
                        doc_id, doctor[1], patient_issue,
                        doctor[2], doctor[3], "WAITING",
                        datetime.now().isoformat(),
                    ),
                )
                conn.commit()
                return {
                    "status": "BOOKED",
                    "patient": patient_name,
                    "issue": patient_issue,
                    "doctor": doctor[1],
                    "specialty": doctor[2],
                    "slot": doctor[3],
                    "urgent": urgent,
                    "confidence": confidence,
                    "fallback_specialties": top2,
                }


        cur.execute(
            "SELECT name,specialty,available_time FROM doctors "
            "WHERE specialty=? ORDER BY id ASC LIMIT 1",
            (specialty,),
        )
        next_doc = cur.fetchone()

        cur.execute(
            "INSERT INTO waitlist(patient_name,issue,requested_specialty,created_at) "
            "VALUES(?,?,?,?)",
            (patient_name, patient_issue, specialty, datetime.now().isoformat()),
        )
        conn.commit()

        return {
            "status": "WAITLISTED",
            "patient": patient_name,
            "issue": patient_issue,
            "matched_specialty": specialty,
            "next_available": next_doc[2] if next_doc else "Tomorrow",
            "doctor_possible": next_doc[0] if next_doc else "",
            "fallback_specialties": top2,
            "confidence": confidence,
        }

    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()






@mcp.tool()
def process_consultation(text: str) -> dict:
    
    schema = 

    system = f


    input_flags = validate_input_guardrails(text)
    if any("prompt injection" in f.lower() or "cross-patient" in f.lower() for f in input_flags):
        AIAuditLogger.log("process_consultation", "system", {"text": text}, "", {}, input_flags, "REJECTED_INPUT")
        return {"error": "Input rejected due to safety policy violation."}

    raw = _call_groq(system, text)
    try:
        result = _safe_json(raw)
    except Exception as e:
        AIAuditLogger.log("process_consultation", "system", {"text": text}, raw, {}, ["JSON Parse Error"], "FAILED")
        raise e

    output_flags = validate_output_guardrails(result)

    result["_meta"] = {
        "processed_at": datetime.utcnow().isoformat() + "Z",
        "model": "llama-3.3-70b-versatile",
        "tool": "process_consultation",
        "flags": output_flags
    }
    
    outcome = "HUMAN_REVIEW_REQUIRED" if output_flags else "SUCCESS"
    AIAuditLogger.log("process_consultation", "system", {"text": text}, raw, result, input_flags + output_flags, outcome)

    return result






@mcp.tool()
def check_insurance(patient_id: str, requested_amount: int) -> dict:
    
    conn = _db()
    cur = conn.cursor()

    cur.execute(
        "SELECT provider,policy_number,active,coverage_amount,"
        "used_amount,expiry_date,admin_override FROM insurance WHERE patient_id=?",
        (patient_id,),
    )
    row = cur.fetchone()

    if not row:
        conn.close()
        return {"status": "REJECTED", "reason": "No insurance record found"}

    provider, policy, active, coverage, used, expiry, admin_override = row
    remaining = coverage - used
    today = datetime.now().strftime("%Y-%m-%d")

    reason = ""
    status = "APPROVED"


    if admin_override:
        reason = "Approved via admin override"
        status = "APPROVED"
    elif active == 0:
        status, reason = "REJECTED", "Policy inactive"
    elif expiry < today:
        status, reason = "REJECTED", "Policy expired"
    elif remaining <= 0:
        status, reason = "REJECTED", "Coverage exhausted"
    elif requested_amount > remaining:
        status, reason = "REJECTED", "Requested amount exceeds remaining coverage"
    else:
        reason = "Eligible and covered"

    cur.execute(
        "INSERT INTO claims(patient_id,requested_amount,status,reason,created_at) "
        "VALUES(?,?,?,?,?)",
        (patient_id, requested_amount, status, reason, datetime.now().isoformat()),
    )
    claim_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        "claim_id": claim_id,
        "patient_id": patient_id,
        "provider": provider,
        "policy_number": policy,
        "eligibility": "YES" if status == "APPROVED" else "NO",
        "coverage_total": coverage,
        "coverage_used": used,
        "coverage_remaining": remaining,
        "requested_amount": requested_amount,
        "claim_status": status,
        "reason": reason,
    }






def _parse_follow_up_date(advice: str) -> datetime:
    
    text = advice.lower()

    if "tomorrow" in text:
        return datetime.now() + timedelta(days=1)

    match = re.search(r"(\d+)\s*day", text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)))

    match = re.search(r"(\d+)\s*week", text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)) * 7)

    match = re.search(r"(\d+)\s*month", text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)) * 30)

    return datetime.now() + timedelta(days=7)


@mcp.tool()
def schedule_consultation(patient_id: str, advice: str) -> dict:
    
    next_date = _parse_follow_up_date(advice).strftime("%Y-%m-%d")

    conn = _db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO consultations"
        "(patient_id,advice,next_appointment,status,created_at) "
        "VALUES(?,?,?,?,?)",
        (patient_id, advice, next_date, "SCHEDULED", datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()

    return {
        "status": "SCHEDULED",
        "patient_id": patient_id,
        "doctor_advice": advice,
        "next_appointment": next_date,
        "message": f"Consultation scheduled for patient {patient_id}",
    }






@mcp.tool()
def order_test(patient_id: str, patient_name: str, tests_recommended: list[str]) -> dict:
    
    if not tests_recommended:
        return {"status": "NO_ACTION", "message": "No tests recommended."}

    tracking_id = "TEST-" + str(uuid.uuid4())[:8].upper()

    conn = _db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO test_orders(tracking_id,patient_id,patient_name,tests,status,created_at) "
        "VALUES(?,?,?,?,?,?)",
        (
            tracking_id,
            patient_id,
            patient_name,
            json.dumps(tests_recommended),
            "REQUESTED",
            datetime.now().isoformat(),
        ),
    )
    conn.commit()
    conn.close()

    return {
        "status": "REQUEST_CREATED",
        "tracking_id": tracking_id,
        "patient_id": patient_id,
        "patient": patient_name,
        "tests": tests_recommended,
        "message": f"Notification sent: {patient_name}, your test request has been created.",
    }






@mcp.tool()
def patient_query(patient_id: str, query: str = "", emergency_mode: bool = False) -> dict:
    

    input_flags = validate_input_guardrails(query)
    if any("prompt injection" in f.lower() or "cross-patient" in f.lower() for f in input_flags):
        AIAuditLogger.log("patient_query", "system", {"patient_id": patient_id, "query": query}, "", {}, input_flags, "REJECTED_INPUT")
        return {"error": "Input rejected due to safety policy violation."}

    if emergency_mode and query and rag_service:
        result = rag_service.emergency_query(patient_id, query)
        AIAuditLogger.log("patient_query", "system", {"patient_id": patient_id, "query": query, "emergency": True}, "", result, input_flags, "SUCCESS")
        return result


    conn = _db()
    cur = conn.cursor()

    cur.execute(
        "SELECT patient_id,name,age,gender,phone,blood_group,"
        "allergies,diagnosis,medicines,doctor,next_visit "
        "FROM patients WHERE patient_id=?",
        (patient_id,)
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        AIAuditLogger.log("patient_query", "system", {"patient_id": patient_id}, "", {}, ["Patient not found"], "FAILED")
        return {"status": "NOT_FOUND", "message": "Patient record not found"}

    result = {
        "status": "SUCCESS",
        "patient_context": {
            "patient_id": row[0],
            "name": row[1],
            "age": row[2],
            "gender": row[3],
            "phone": row[4],
            "blood_group": row[5],
            "allergies": row[6],
            "diagnosis": row[7],
            "medicines": row[8],
            "doctor": row[9],
            "next_visit": row[10],
        },
        "scope": "single_patient_only",
    }
    AIAuditLogger.log("patient_query", "system", {"patient_id": patient_id, "query": query}, "", result, input_flags, "SUCCESS")
    return result






_init_all_tables()


if __name__ == "__main__":
    import sys


    if "--seed" in sys.argv:
        seed_sample_data()
        print("Sample data seeded.")

    mcp.run()
