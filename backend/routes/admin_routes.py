

from datetime import datetime
import json
from fastapi import APIRouter, Header, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.auth import decode_token, hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _check_admin(authorization: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


@router.get("/insurance/{patient_id}")
def get_insurance(patient_id: str, authorization: str = Header(None)):
    _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM insurance WHERE patient_id=?", (patient_id,))
    ins = cur.fetchone()

    cur.execute(
        "SELECT * FROM claims WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    claims = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "insurance": dict(ins) if ins else None,
        "claims": claims,
    }


class OverrideInsuranceRequest(BaseModel):
    active: Optional[int] = None
    coverage_amount: Optional[int] = None
    used_amount: Optional[int] = None
    expiry_date: Optional[str] = None
    admin_override: Optional[int] = 1
    override_reason: Optional[str] = ""

    provider: Optional[str] = ""
    policy_number: Optional[str] = ""


@router.put("/override-insurance/{patient_id}")
def override_insurance(patient_id: str, req: OverrideInsuranceRequest, authorization: str = Header(None)):
    admin = _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()


    cur.execute("SELECT patient_id FROM insurance WHERE patient_id=?", (patient_id,))
    exists = cur.fetchone()

    if exists:
        updates = []
        params = []
        if req.active is not None:
            updates.append("active=?")
            params.append(req.active)
        if req.coverage_amount is not None:
            updates.append("coverage_amount=?")
            params.append(req.coverage_amount)
        if req.used_amount is not None:
            updates.append("used_amount=?")
            params.append(req.used_amount)
        if req.expiry_date is not None:
            updates.append("expiry_date=?")
            params.append(req.expiry_date)

        updates.append("admin_override=?")
        params.append(req.admin_override or 1)
        updates.append("override_reason=?")
        params.append(req.override_reason or "Admin override")
        updates.append("overridden_by=?")
        params.append(admin["sub"])

        params.append(patient_id)
        cur.execute(f"UPDATE insurance SET {', '.join(updates)} WHERE patient_id=?", params)
    else:

        cur.execute(
            "INSERT INTO insurance(patient_id,provider,policy_number,active,coverage_amount,"
            "used_amount,expiry_date,admin_override,override_reason,overridden_by) "
            "VALUES(?,?,?,?,?,?,?,?,?,?)",
            (
                patient_id,
                req.provider or "Admin Granted",
                req.policy_number or f"POL-ADMIN-{patient_id}",
                req.active if req.active is not None else 1,
                req.coverage_amount or 50000,
                req.used_amount or 0,
                req.expiry_date or "2027-12-31",
                1,
                req.override_reason or "Admin override - new policy",
                admin["sub"],
            ),
        )

    conn.commit()
    conn.close()

    return {"status": "OVERRIDDEN", "patient_id": patient_id}


@router.get("/claims")
def list_claims(authorization: str = Header(None)):
    _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM claims ORDER BY created_at DESC")
    claims = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"claims": claims}


@router.put("/approve-claim/{claim_id}")
def approve_claim(claim_id: int, authorization: str = Header(None)):
    _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE claims SET status='APPROVED', reason='Approved by admin override' WHERE claim_id=?",
        (claim_id,),
    )
    conn.commit()
    conn.close()
    return {"status": "APPROVED", "claim_id": claim_id}


class CreateAccountRequest(BaseModel):
    user_id: str
    password: str
    user_type: str
    name: str

    specialty: Optional[str] = None
    available_time: Optional[str] = None


@router.post("/create-account")
def create_account(req: CreateAccountRequest, authorization: str = Header(None)):
    _check_admin(authorization)

    if req.user_type not in ("doctor", "nurse", "admin"):
        raise HTTPException(status_code=400, detail="Invalid user type. Must be doctor, nurse, or admin.")

    conn = get_db()
    cur = conn.cursor()


    cur.execute("SELECT user_id FROM users WHERE user_id=?", (req.user_id,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User ID already exists")

    hashed = hash_password(req.password)
    cur.execute(
        "INSERT INTO users(user_id,password,user_type,name,created_at) VALUES(?,?,?,?,?)",
        (req.user_id, hashed, req.user_type, req.name, datetime.now().isoformat()),
    )


    if req.user_type == "doctor":
        cur.execute(
            "INSERT INTO doctors(user_id,name,specialty,available_time,is_booked) VALUES(?,?,?,?,0)",
            (req.user_id, req.name, req.specialty or "General Physician", req.available_time or "09:00 AM"),
        )

    conn.commit()
    conn.close()

    return {"status": "CREATED", "user_id": req.user_id, "user_type": req.user_type}


@router.get("/accounts")
def list_accounts(authorization: str = Header(None)):
    _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id, user_type, name, created_at FROM users WHERE user_type != 'patient' ORDER BY user_type, name")
    accounts = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"accounts": accounts}


@router.get("/audit-logs")
def get_audit_logs(authorization: str = Header(None)):
    _check_admin(authorization)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM ai_audit_logs ORDER BY timestamp DESC LIMIT 100")
    logs = []
    for row in cur.fetchall():
        d = dict(row)
        try:
            d["input_payload"] = json.loads(d["input_payload"]) if d["input_payload"] else {}
            d["parsed_output"] = json.loads(d["parsed_output"]) if d["parsed_output"] else {}
            d["guardrail_flags"] = json.loads(d["guardrail_flags"]) if d["guardrail_flags"] else []
        except:
            pass
        logs.append(d)
    conn.close()
    return {"logs": logs}


@router.post("/seed-rag")
def seed_rag(authorization: str = Header(None)):
    _check_admin(authorization)
    try:
        import sys
        import os

        aitool_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool")
        if aitool_path not in sys.path:
            sys.path.insert(0, aitool_path)
            
        from seed_rag_docs import seed_documents
        seed_documents()
        return {"status": "SUCCESS", "message": "RAG documents seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed-rag-custom")
async def seed_rag_custom(docs: list, authorization: str = Header(None)):
    _check_admin(authorization)
    try:
        import sys
        import os

        aitool_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool")
        if aitool_path not in sys.path:
            sys.path.insert(0, aitool_path)
            
        from seed_rag_docs import seed_custom_documents
        seed_custom_documents(docs)
        return {"status": "SUCCESS", "message": f"{len(docs)} custom RAG documents seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/seed-rag-pdf")
async def seed_rag_pdf(file: UploadFile = File(...), authorization: str = Header(None)):
    _check_admin(authorization)
    try:
        import sys
        import os

        aitool_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool")
        if aitool_path not in sys.path:
            sys.path.insert(0, aitool_path)
            
        from seed_rag_docs import seed_pdf_document
        content = await file.read()
        doc_id = seed_pdf_document(content, file.filename)
        return {"status": "SUCCESS", "message": f"PDF '{file.filename}' processed and seeded successfully (ID: {doc_id})"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
