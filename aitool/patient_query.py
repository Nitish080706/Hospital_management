

import sqlite3
import json






DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute()

    conn.commit()
    conn.close()






def seed_data():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("DELETE FROM patients")

    rows = [
        (
            101,
            "Nitish",
            20,
            "Male",
            "9600214224",
            "B+",
            "Dust Allergy",
            "Viral Fever",
            "Paracetamol, Cetirizine",
            "Dr Ravi",
            "2026-04-30"
        ),
        (
            102,
            "Priya",
            28,
            "Female",
            "9876543210",
            "O+",
            "Penicillin",
            "Skin Infection",
            "Antibiotic Cream",
            "Dr Meena",
            "2026-05-02"
        )
    ]

    cur.executemany(, rows)

    conn.commit()
    conn.close()






def patient_query(patient_id):
    

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute(, (patient_id,))

    row = cur.fetchone()

    conn.close()

    if not row:
        return {
            "status": "NOT_FOUND",
            "message": "Patient record not found"
        }

    return {
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
            "next_visit": row[10]
        },
        "scope": "single_patient_only"
    }






if __name__ == "__main__":
    init_db()
    seed_data()

    result = patient_query(101)

    print(json.dumps(result, indent=4))