

import sqlite3
import uuid
import json
from datetime import datetime






DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute()

    conn.commit()
    conn.close()






def order_test(patient_name, tests_recommended):
    

    if not tests_recommended:
        return {
            "status": "NO_ACTION",
            "message": "No tests recommended."
        }

    tracking_id = "TEST-" + str(uuid.uuid4())[:8].upper()

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute(, (
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






if __name__ == "__main__":
    init_db()

    result = order_test(
        patient_name="Nitish",
        tests_recommended=["CBC", "Chest X-Ray"]
    )

    print(json.dumps(result, indent=4))