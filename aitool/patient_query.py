"""
patient_query.py

Simple AI Tool:
Patient chatbot context provider
STRICTLY scoped to one patient only

- Uses patient_id as primary key
- Returns only that patient's details
- No cross-patient access
- Good for chatbot / assistant context

Use only Python
"""

import sqlite3
import json


# =====================================
# DATABASE
# =====================================

DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER,
        gender TEXT,
        phone TEXT,
        blood_group TEXT,
        allergies TEXT,
        diagnosis TEXT,
        medicines TEXT,
        doctor TEXT,
        next_visit TEXT
    )
    """)

    conn.commit()
    conn.close()


# =====================================
# SAMPLE DATA
# =====================================

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

    cur.executemany("""
    INSERT INTO patients
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)

    conn.commit()
    conn.close()


# =====================================
# MAIN TOOL
# =====================================

def patient_query(patient_id):
    """
    Strict single-patient context fetch
    """

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    SELECT patient_id, name, age, gender, phone,
           blood_group, allergies, diagnosis,
           medicines, doctor, next_visit
    FROM patients
    WHERE patient_id=?
    """, (patient_id,))

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


# =====================================
# RUN
# =====================================

if __name__ == "__main__":
    init_db()
    seed_data()

    result = patient_query(101)

    print(json.dumps(result, indent=4))