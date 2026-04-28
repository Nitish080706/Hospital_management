

import sqlite3
import json
import re
from datetime import datetime, timedelta






DB_NAME = "hospital.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute()

    conn.commit()
    conn.close()






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

    return datetime.now() + timedelta(days=7)






def schedule_consultation(patient_id, advice):
    

    next_date = get_next_date(advice).strftime("%Y-%m-%d")

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute(, (
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






if __name__ == "__main__":
    init_db()

    result = schedule_consultation(
        patient_id=101,
        advice="Follow up after 5 days"
    )

    print(json.dumps(result, indent=4))