

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





def _safe_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if not match:
        raise ValueError("No JSON object found in model output")

    return json.loads(match.group())





@mcp.tool()
def process_consultation(text: str) -> dict:
    

    schema = 

    system = f

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