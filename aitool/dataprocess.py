"""
ClinicalMCP - Doctor Prescription + Consultation Processor
Built with FastMCP + Groq API
Converts doctor notes / prescriptions into structured clinical JSON
"""

import os
import json
import re
from datetime import datetime
from fastmcp import FastMCP
from groq import Groq

mcp = FastMCP(
    name="ClinicalMCP",
    instructions="Processes doctor consultation notes and prescriptions into structured clinical JSON.",
)


# ---------------------------------------------------
# Groq Client
# ---------------------------------------------------
def _get_client() -> Groq:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise EnvironmentError(
            "GROQ_API_KEY not found.\nSet it using:\nexport GROQ_API_KEY=gsk_xxxxx"
        )
    return Groq(api_key=key)


def _call_groq(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    client = _get_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.1,
        max_tokens=4096
    )

    return response.choices[0].message.content.strip()


# ---------------------------------------------------
# Safe JSON Cleaner
# ---------------------------------------------------
def _safe_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if not match:
        raise ValueError("No JSON object found in model output")

    return json.loads(match.group())


# ---------------------------------------------------
# Main Tool
# ---------------------------------------------------
@mcp.tool()
def process_consultation(text: str) -> dict:
    """
    Process doctor consultation / prescription text

    Args:
        text : Raw doctor notes / prescription

    Returns:
        Structured Clinical JSON
    """

    schema = """
{
  "patient_info": {
    "patient_id":"",
    "name": "",
    "age": "",
    "gender": ""
  },

  "consultation": {
    "chief_complaint": "",
    "symptoms": [],
    "duration": "",
    "vitals": {
      "bp": "",
      "pulse": "",
      "temperature": ""
    },
    "diagnosis": [],
    "advice": []
  },

  "prescription": [
    {
      "medicine_name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "route": ""
    }
  ],

  "tests_recommended": [],
  "follow_up": "",
  "risk_flags": [],
  "summary": ""
}
"""

    system = f"""
You are an expert medical AI assistant.

Convert doctor consultation notes and prescriptions into structured JSON.

Return ONLY valid JSON.

Rules:

1. Extract patient name, age, gender if available.
2. Extract symptoms and duration.
3. Extract vitals:
   BP, pulse, temperature.
4. Extract diagnosis.
5. Extract medicines:
   medicine_name
   dosage
   frequency
   duration
   route
6. Extract tests recommended.
7. Extract follow-up instructions.
8. Detect risk_flags if present:
   - chest pain
   - breathing difficulty
   - fever > 5 days
   - diabetes uncontrolled
   - BP > 180/120
9. Create short summary.

Use empty string or [] if missing.

Schema:

{schema}
"""

    raw = _call_groq(system, text)

    result = _safe_json(raw)

    result["_meta"] = {
        "processed_at": datetime.utcnow().isoformat() + "Z",
        "model": "llama-3.3-70b-versatile",
        "tool": "ClinicalMCP"
    }

    return result

if __name__ == "__main__":
    mcp.run()