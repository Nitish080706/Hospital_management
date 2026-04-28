"""
SmartDoctorAllocator MCP Tool
Single AI Tool:
- Understand patient issue using Groq
- Match medical specialty
- Check doctor availability from DB
- Atomically book slot
- Prevent double booking
- Urgent cases get priority
- No doctor available -> next slot + waitlist
- Wrong match fallback -> top 2 specialties

Use only Python
"""

import os
import sqlite3
import json
from datetime import datetime
from groq import Groq


# =====================================================
# CONFIG
# =====================================================

DB_NAME = "hospital.db"


# =====================================================
# DB SETUP
# =====================================================

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        specialty TEXT,
        available_time TEXT,
        is_booked INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        issue TEXT,
        requested_specialty TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# =====================================================
# SAMPLE DATA
# =====================================================

def seed_data():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("DELETE FROM doctors")

    doctors = [
        ("Dr Ravi", "Pediatrician", "10:00 AM", 0),
        ("Dr Meena", "Dermatologist", "11:00 AM", 0),
        ("Dr Arjun", "Cardiologist", "12:00 PM", 0),
        ("Dr Kiran", "General Physician", "01:00 PM", 0),
        ("Dr Divya", "Neurologist", "02:00 PM", 0),
        ("Dr Sana", "Dermatologist", "03:00 PM", 0),
    ]

    cur.executemany(
        "INSERT INTO doctors(name,specialty,available_time,is_booked) VALUES(?,?,?,?)",
        doctors
    )

    conn.commit()
    conn.close()


# =====================================================
# GROQ
# =====================================================

def get_client():
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise Exception("Set GROQ_API_KEY")
    return Groq(api_key=key)


def classify_issue(issue):
    client = get_client()

    prompt = f"""
Patient issue: {issue}

Return only JSON:

{{
  "specialty":"best matched specialty",
  "confidence":0.0,
  "urgent":true/false,
  "top2":["spec1","spec2"]
}}

Rules:
Children / baby -> Pediatrician
Skin / acne / rash -> Dermatologist
Chest pain -> Cardiologist urgent true
Headache severe neuro -> Neurologist
General fever cold -> General Physician
"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    raw = res.choices[0].message.content.strip()

    start = raw.find("{")
    end = raw.rfind("}") + 1

    return json.loads(raw[start:end])


# =====================================================
# MAIN TOOL
# =====================================================

def allocate_doctor(patient_name, patient_issue):
    """
    Single AI tool
    """

    conn = sqlite3.connect(DB_NAME)
    conn.isolation_level = "EXCLUSIVE"
    cur = conn.cursor()

    try:
        ai = classify_issue(patient_issue)

        specialty = ai["specialty"]
        confidence = ai["confidence"]
        urgent = ai["urgent"]
        top2 = ai["top2"]

        # LOW CONFIDENCE fallback
        if confidence < 0.60:
            specialty = top2[0]

        # URGENCY PRIORITY
        if urgent:
            cur.execute("""
            SELECT id,name,specialty,available_time
            FROM doctors
            WHERE specialty=?
            ORDER BY id ASC
            LIMIT 1
            """, (specialty,))
        else:
            cur.execute("""
            SELECT id,name,specialty,available_time
            FROM doctors
            WHERE specialty=? AND is_booked=0
            ORDER BY id ASC
            LIMIT 1
            """, (specialty,))

        doctor = cur.fetchone()

        # ==========================================
        # SLOT FOUND -> BOOK ATOMICALLY
        # ==========================================
        if doctor:
            doc_id = doctor[0]

            cur.execute("""
            UPDATE doctors
            SET is_booked=1
            WHERE id=? AND is_booked=0
            """, (doc_id,))

            if cur.rowcount == 1 or urgent:
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
                    "fallback_specialties": top2
                }

        # ==========================================
        # NO SLOT AVAILABLE
        # ==========================================
        cur.execute("""
        SELECT name, specialty, available_time
        FROM doctors
        WHERE specialty=?
        ORDER BY id ASC
        LIMIT 1
        """, (specialty,))

        next_doc = cur.fetchone()

        cur.execute("""
        INSERT INTO waitlist(patient_name,issue,requested_specialty,created_at)
        VALUES(?,?,?,?)
        """, (
            patient_name,
            patient_issue,
            specialty,
            datetime.now().isoformat()
        ))

        conn.commit()

        return {
            "status": "WAITLISTED",
            "patient": patient_name,
            "issue": patient_issue,
            "matched_specialty": specialty,
            "next_available": next_doc[2] if next_doc else "Tomorrow",
            "doctor_possible": next_doc[0] if next_doc else "",
            "fallback_specialties": top2,
            "confidence": confidence
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    seed_data()

    result = allocate_doctor(
        patient_name="Nitish",
        patient_issue="I have skin rash and itching for 5 days"
    )

    print(json.dumps(result, indent=4))