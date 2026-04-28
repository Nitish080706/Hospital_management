"""
order_test.py

Simple AI Tool:
Creates lab / imaging test request
when tests are recommended.

Generates:
- Tracking ID
- Requested tests
- Status
- Notification message

Use only Python
"""

import sqlite3
import uuid
import json
from datetime import datetime


# =====================================
# DATABASE
# =====================================

DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS test_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_id TEXT,
        patient_name TEXT,
        tests TEXT,
        status TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# =====================================
# MAIN TOOL
# =====================================

def order_test(patient_name, tests_recommended):
    """
    Creates lab/imaging test request
    """

    if not tests_recommended:
        return {
            "status": "NO_ACTION",
            "message": "No tests recommended."
        }

    tracking_id = "TEST-" + str(uuid.uuid4())[:8].upper()

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO test_orders
    (tracking_id, patient_name, tests, status, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        tracking_id,
        patient_name,
        json.dumps(tests_recommended),
        "REQUESTED",
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    return {
        "status": "REQUEST_CREATED",
        "tracking_id": tracking_id,
        "patient": patient_name,
        "tests": tests_recommended,
        "message": f"Notification sent: {patient_name}, your test request has been created."
    }


# =====================================
# RUN
# =====================================

if __name__ == "__main__":
    init_db()

    result = order_test(
        patient_name="Nitish",
        tests_recommended=["CBC", "Chest X-Ray"]
    )

    print(json.dumps(result, indent=4))