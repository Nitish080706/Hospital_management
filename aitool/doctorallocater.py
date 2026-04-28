

import os
import sqlite3
import json
from datetime import datetime
from groq import Groq






DB_NAME = "hospital.db"






def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute()

    cur.execute()

    conn.commit()
    conn.close()






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






def get_client():
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise Exception("Set GROQ_API_KEY")
    return Groq(api_key=key)


def classify_issue(issue):
    client = get_client()

    prompt = f

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    raw = res.choices[0].message.content.strip()

    start = raw.find("{")
    end = raw.rfind("}") + 1

    return json.loads(raw[start:end])






def allocate_doctor(patient_name, patient_issue):
    

    conn = sqlite3.connect(DB_NAME)
    conn.isolation_level = "EXCLUSIVE"
    cur = conn.cursor()

    try:
        ai = classify_issue(patient_issue)

        specialty = ai["specialty"]
        confidence = ai["confidence"]
        urgent = ai["urgent"]
        top2 = ai["top2"]


        if confidence < 0.60:
            specialty = top2[0]


        if urgent:
            cur.execute(, (specialty,))
        else:
            cur.execute(, (specialty,))

        doctor = cur.fetchone()




        if doctor:
            doc_id = doctor[0]

            cur.execute(, (doc_id,))

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




        cur.execute(, (specialty,))

        next_doc = cur.fetchone()

        cur.execute(, (
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