

import os
import json
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import decode_token

router = APIRouter(prefix="/api/patient", tags=["patient"])


def _get_patient_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("type") != "patient":
        raise HTTPException(status_code=403, detail="Not a patient")
    return payload["sub"]


@router.get("/dashboard")
def dashboard(authorization: str = Header(None)):
    patient_id = _get_patient_id(authorization)
    conn = get_db()
    cur = conn.cursor()


    cur.execute("SELECT * FROM patients WHERE patient_id=?", (patient_id,))
    patient = cur.fetchone()
    patient_data = dict(patient) if patient else None


    cur.execute(
        "SELECT * FROM appointments WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
        (patient_id,),
    )
    appt = cur.fetchone()
    appointment_data = dict(appt) if appt else None


    cur.execute(
        "SELECT * FROM test_orders WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    lab_orders = [dict(r) for r in cur.fetchall()]


    cur.execute("SELECT * FROM insurance WHERE patient_id=?", (patient_id,))
    ins = cur.fetchone()
    insurance_data = dict(ins) if ins else None


    cur.execute(
        "SELECT * FROM claims WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    claims = [dict(r) for r in cur.fetchall()]


    cur.execute(
        "SELECT * FROM consultations WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    followups = [dict(r) for r in cur.fetchall()]


    cur.execute(
        "SELECT * FROM consultation_history WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,),
    )
    history_rows = cur.fetchall()
    history = []
    for h in history_rows:
        d = dict(h)
        try:
            d["processed_data"] = json.loads(d["processed_data"]) if d["processed_data"] else None
        except (json.JSONDecodeError, TypeError):
            pass
        history.append(d)


    cur.execute("SELECT name, specialty, available_time FROM doctors ORDER BY name")
    doctors = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "patient": patient_data,
        "appointment": appointment_data,
        "lab_orders": lab_orders,
        "insurance": insurance_data,
        "claims": claims,
        "followups": followups,
        "consultation_history": history,
        "doctors": doctors,
    }


class ChatRequest(BaseModel):
    question: str


@router.post("/chatbot")
def chatbot(req: ChatRequest, authorization: str = Header(None)):
    patient_id = _get_patient_id(authorization)
    from datetime import datetime
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))
    from mcp_server import AIAuditLogger, validate_input_guardrails


    input_flags = validate_input_guardrails(req.question)
    if any("prompt injection" in f.lower() or "cross-patient" in f.lower() for f in input_flags):
        AIAuditLogger.log("patient_agent", patient_id, {"question": req.question}, "", {}, input_flags, "REJECTED_INPUT")
        return {"answer": "I'm sorry, I cannot process that request."}

    conn = get_db()
    cur = conn.cursor()


    cur.execute(
        "SELECT role, content FROM patient_sessions WHERE patient_id=? ORDER BY id DESC LIMIT 5",
        (patient_id,)
    )
    rows = cur.fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_my_appointments",
                "description": "Get current appointment and follow-up details for the patient.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "check_my_insurance_status",
                "description": "Check insurance provider, policy number, and remaining coverage.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "ask_about_my_prescription",
                "description": "Get details about current medicines and diagnosis.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_test_results",
                "description": "Get recent lab test orders and tracking IDs.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_emergency_protocols",
                "description": "Search for medical guidelines and emergency protocols (e.g., CPR, Anaphylaxis) relevant to a symptom or situation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The medical situation or symptom to search for."}
                    },
                    "required": ["query"]
                }
            }
        }
    ]

    system_prompt = (
        "You are a helpful, secure medical assistant for the patient. "
        "You ONLY have access to data for this specific patient via the provided tools. "
        "Do NOT answer questions about other patients. Keep answers concise."
    )

    messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": req.question}]

    from groq import Groq
    key = os.environ.get("GROQ_API_KEY")
    client = Groq(api_key=key)

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.3
    )
    
    response_message = res.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        messages.append(response_message)
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            tool_res = "{}"
            

            if function_name == "get_my_appointments":
                cur.execute("SELECT * FROM appointments WHERE patient_id=? ORDER BY created_at DESC LIMIT 1", (patient_id,))
                a = cur.fetchone()
                tool_res = json.dumps(dict(a)) if a else "No appointments."
            elif function_name == "check_my_insurance_status":
                cur.execute("SELECT * FROM insurance WHERE patient_id=?", (patient_id,))
                ins = cur.fetchone()
                tool_res = json.dumps(dict(ins)) if ins else "No insurance record."
            elif function_name == "ask_about_my_prescription":
                cur.execute("SELECT diagnosis, medicines FROM patients WHERE patient_id=?", (patient_id,))
                p = cur.fetchone()
                tool_res = json.dumps(dict(p)) if p else "No data."
            elif function_name == "get_test_results":
                cur.execute("SELECT tracking_id, tests, status FROM test_orders WHERE patient_id=? ORDER BY created_at DESC LIMIT 3", (patient_id,))
                t = cur.fetchall()
                tool_res = json.dumps([dict(x) for x in t]) if t else "No tests."
            elif function_name == "search_emergency_protocols":
                from rag_service import rag_service
                if rag_service:
                    query = json.loads(tool_call.function.arguments).get("query", "")
                    res_rag = rag_service.emergency_query(patient_id, query)
                    tool_res = json.dumps(res_rag)
                else:
                    tool_res = "RAG service unavailable."
            
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": tool_res
            })
            

        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3
        )
        response_message = res.choices[0].message

    final_answer = response_message.content.strip()


    cur.execute("INSERT INTO patient_sessions (patient_id, role, content, timestamp) VALUES (?,?,?,?)",
                (patient_id, "user", req.question, datetime.now().isoformat()))
    cur.execute("INSERT INTO patient_sessions (patient_id, role, content, timestamp) VALUES (?,?,?,?)",
                (patient_id, "assistant", final_answer, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    AIAuditLogger.log("patient_agent", patient_id, {"question": req.question}, final_answer, {}, input_flags, "SUCCESS")

    return {"answer": final_answer}
