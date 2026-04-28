

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aitool"))


from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from backend.routes.auth_routes import router as auth_router
from backend.routes.patient_routes import router as patient_router
from backend.routes.doctor_routes import router as doctor_router
from backend.routes.nurse_routes import router as nurse_router
from backend.routes.admin_routes import router as admin_router

app = FastAPI(title="Hospital AI Management System", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(doctor_router)
app.include_router(nurse_router)
app.include_router(admin_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    
    from mcp_server import seed_sample_data
    seed_sample_data()
