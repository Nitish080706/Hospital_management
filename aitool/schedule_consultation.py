"""
schedule_consultation.py

Simple AI Tool:
Schedules next consultation based on doctor's advice.

Examples:
- Follow up after 5 days
- Review after 1 week
- Visit after 1 month
- Come tomorrow

Uses patient_id as primary key

Use only Python
"""

import sqlite3
import json
import re
from datetime import datetime, timedelta


# =====================================
# DATABASE
# =====================================

DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS consultations (
        patient_id INTEGER PRIMARY KEY,
        advice TEXT,
        next_appointment TEXT,
        status TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# =====================================
# DATE LOGIC
# =====================================

def get_next_date(advice):
    text = advice.lower()

    if "tomorrow" in text:
        return datetime.now() + timedelta(days=1)

    match = re.search(r'(\d+)\s*day', text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)))

    match = re.search(r'(\d+)\s*week', text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)) * 7)

    match = re.search(r'(\d+)\s*month', text)
    if match:
        return datetime.now() + timedelta(days=int(match.group(1)) * 30)

    return datetime.now() + timedelta(days=7)   # default


# =====================================
# MAIN TOOL
# =====================================

def schedule_consultation(patient_id, advice):
    """
    Schedule next consultation from doctor advice
    """

    next_date = get_next_date(advice).strftime("%Y-%m-%d")

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    INSERT OR REPLACE INTO consultations
    (patient_id, advice, next_appointment, status, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        patient_id,
        advice,
        next_date,
        "SCHEDULED",
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    return {
        "status": "SCHEDULED",
        "patient_id": patient_id,
        "doctor_advice": advice,
        "next_appointment": next_date,
        "message": f"Consultation scheduled for patient {patient_id}"
    }


# =====================================
# RUN
# =====================================

if __name__ == "__main__":
    init_db()

    result = schedule_consultation(
        patient_id=101,
        advice="Follow up after 5 days"
    )

    print(json.dumps(result, indent=4))