

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import verify_password, create_token

router = APIRouter(prefix="/api", tags=["auth"])


class LoginRequest(BaseModel):
    user_id: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id, password, user_type, name FROM users WHERE user_id=?", (req.user_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(row["user_id"], row["user_type"], row["name"])

    return {
        "token": token,
        "user_id": row["user_id"],
        "user_type": row["user_type"],
        "name": row["name"],
    }
