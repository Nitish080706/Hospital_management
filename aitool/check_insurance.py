"""
check_insurance.py

Simple AI Tool:
- Real-time eligibility
- Coverage validation
- Claim status
- Generate rejection reason

Uses patient_id as primary key

Use only Python
"""

import sqlite3
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
    CREATE TABLE IF NOT EXISTS insurance (
        patient_id INTEGER PRIMARY KEY,
        provider TEXT,
        policy_number TEXT,
        active INTEGER,
        coverage_amount INTEGER,
        used_amount INTEGER,
        expiry_date TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        requested_amount INTEGER,
        status TEXT,
        reason TEXT,
        created_at TEXT
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

    cur.execute("DELETE FROM insurance")

    rows = [
        (101, "Star Health", "POL1001", 1, 50000, 10000, "2027-12-31"),
        (102, "ICICI Lombard", "POL1002", 0, 100000, 20000, "2025-01-01"),
        (103, "HDFC Ergo", "POL1003", 1, 30000, 30000, "2027-05-01")
    ]

    cur.executemany("""
    INSERT INTO insurance
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, rows)

    conn.commit()
    conn.close()


# =====================================
# MAIN TOOL
# =====================================

def check_insurance(patient_id, requested_amount):
    """
    Real-time insurance check
    """

    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    cur.execute("""
    SELECT provider, policy_number, active,
           coverage_amount, used_amount, expiry_date
    FROM insurance
    WHERE patient_id=?
    """, (patient_id,))

    row = cur.fetchone()

    if not row:
        conn.close()
        return {
            "status": "REJECTED",
            "reason": "No insurance record found"
        }

    provider, policy, active, coverage, used, expiry = row

    remaining = coverage - used
    today = datetime.now().strftime("%Y-%m-%d")

    reason = ""
    status = "APPROVED"

    # =====================================
    # VALIDATION
    # =====================================

    if active == 0:
        status = "REJECTED"
        reason = "Policy inactive"

    elif expiry < today:
        status = "REJECTED"
        reason = "Policy expired"

    elif remaining <= 0:
        status = "REJECTED"
        reason = "Coverage exhausted"

    elif requested_amount > remaining:
        status = "REJECTED"
        reason = "Requested amount exceeds remaining coverage"

    else:
        reason = "Eligible and covered"

    # =====================================
    # CLAIM ENTRY
    # =====================================

    cur.execute("""
    INSERT INTO claims
    (patient_id, requested_amount, status, reason, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        patient_id,
        requested_amount,
        status,
        reason,
        datetime.now().isoformat()
    ))

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
        "reason": reason
    }


# =====================================
# RUN
# =====================================

if __name__ == "__main__":
    init_db()
    seed_data()

    result = check_insurance(
        patient_id=101,
        requested_amount=15000
    )

    print(json.dumps(result, indent=4))