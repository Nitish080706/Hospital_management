<div align="center">

```
██╗  ██╗███╗   ███╗███████╗
██║  ██║████╗ ████║██╔════╝
███████║██╔████╔██║███████╗
██╔══██║██║╚██╔╝██║╚════██║
██║  ██║██║ ╚═╝ ██║███████║
╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
```

# Hospital Management System

### *Production-Grade · AI-Driven · Clinically Safe*

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![LLaMA](https://img.shields.io/badge/LLaMA_3.3_70B-Groq-FF6B35?style=for-the-badge)](https://groq.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF4F8B?style=for-the-badge)](https://trychroma.com)
[![SQLite](https://img.shields.io/badge/SQLite-Relational_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

<br/>

> An intelligent, AI-augmented hospital platform that automates clinical workflows,  
> enforces patient safety with multi-layered guardrails, and empowers every role —  
> from patients to administrators — through a unified, secure interface.

<br/>

[Quick Start](#quick-start) · [AI Features](#ai-infrastructure) · [Architecture](#architecture) · [API Docs](#api-reference) · [Security](#security--compliance)

<br/>

---

</div>

## Table of Contents

- [What Makes This Different](#what-makes-this-different)
- [AI Infrastructure](#ai-infrastructure)
- [Role-Based Workflows](#role-based-workflows)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Security & Compliance](#security--compliance)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

[Quick Start](#quick-start) · [Workflows](#role-based-workflows) · [Architecture](#architecture) · [Security](#security--compliance)

<br/>

---

## What Makes This Different

Most hospital systems are rigid, form-based, and disconnected. This system is built to be intelligent.

| Feature | Traditional HMS | This System |
|---|---|---|
| Clinical Notes | Manual structured input | AI parses raw doctor notes into structured Rx |
| Emergency Support | Static PDF protocols | Hybrid RAG with real-time patient context |
| Patient Chatbot | FAQ bot | Full ReAct Agent with tool-use and memory |
| Safety | Role-based access | Multi-layer AI guardrails + immutable audit logs |
| Doctor Allocation | Manual assignment | AI-driven specialist matching by symptoms |
| Insurance | Claim forms | AI parsing + admin override dashboard |

<br/>

---

## AI Infrastructure

### Multi-Layer AI Guardrails

Safety is not an afterthought — it is the foundation.

```
User Query
    │
    ▼
┌─────────────────────────────┐
│      INPUT GUARDRAILS        │  ← Blocks prompt injections & cross-patient leakage
└──────────────┬──────────────┘
               │
               ▼
         LLM (LLaMA 3.3)
               │
               ▼
┌─────────────────────────────┐
│      OUTPUT GUARDRAILS       │  ← Schema validation + Uncertain Language flagging
└──────────────┬──────────────┘
               │
               ▼
         Safe Response
```

- **Input Guardrails** — Sanitizes all queries before they reach the model, preventing prompt injection and cross-patient data exposure.
- **Output Guardrails** — Validates AI-generated data against strict JSON schemas and automatically flags uncertain clinical language (e.g., *"possibly," "may indicate"*) in prescriptions for mandatory human review.

<br/>

### Immutable AI Audit Logs

Every AI interaction is permanently logged — no exceptions.

```json
{
  "timestamp": "2025-07-14T10:32:11Z",
  "tool": "parse_clinical_notes",
  "triggered_by": "dr_sharma",
  "input_payload": { "raw_notes": "Patient presents with..." },
  "llm_response_raw": "...",
  "parsed_json": { "diagnosis": "...", "prescription": "..." },
  "guardrail_flags": ["uncertain_language_detected"]
}
```

Admins access a real-time monitoring dashboard to detect anomalies and ensure full compliance transparency.

<br/>

### Hybrid RAG System — Emergency Intelligence

When seconds matter, context matters more.

```
Emergency Query ("patient is having anaphylaxis")
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 SQLite    ChromaDB
(Patient   (Emergency
 History)   Protocols)
    │         │
    └────┬────┘
         │
         ▼
  Fused Context → LLM → Life-Saving Response
```

- **Protocols Stored**: CPR, Anaphylaxis, Sepsis, Stroke, Trauma, and more.
- **Admin Seeding**: Upload `JSON` or `PDF` files directly from the admin dashboard to enrich the knowledge base.
- **Persistent Storage**: Vector data lives in `chroma_data/` and survives server restarts.

<br/>

### ReAct Patient Agent

The patient-facing chatbot is a full Reasoning and Acting agent — it thinks before it responds.

```
Patient: "Do I have any appointments this week and are my blood tests ready?"
              │
              ▼
    ┌─────────────────────┐
    │  REASONING STEP      │  "I need to check appointments AND test results."
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  ACTING STEP         │  → tool: get_my_appointments
    │                      │  → tool: get_test_results
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  FINAL RESPONSE      │  Combined, natural language answer
    └─────────────────────┘
```

**Available Tools:**
- `get_my_appointments` — Fetch upcoming and past appointments
- `get_test_results` — Retrieve lab and diagnostic results
- `check_my_insurance_status` — Query insurance claim status

Conversational memory is powered by the `patient_sessions` table, maintaining full context across multi-turn conversations.

<br/>

---

## Role-Based Workflows

The system serves four distinct roles — each with a dedicated, scoped workflow. Every action that touches AI is guarded, logged, and bounded to the authenticated user's identity.

---

### Patient Workflow

```
  Patient Login (JWT Auth)
          │
          ▼
  ┌───────────────────────────────────────────────────┐
  │                 Patient Dashboard                  │
  │                                                   │
  │  ┌──────────────┐   ┌──────────────┐             │
  │  │ Assigned      │   │ Available    │             │
  │  │ Doctors       │   │ Specialists  │             │
  │  └──────────────┘   └──────────────┘             │
  │  ┌──────────────┐   ┌──────────────┐             │
  │  │ Appointment  │   │ Lab Results  │             │
  │  │ Status       │   │ & Reports    │             │
  │  └──────────────┘   └──────────────┘             │
  └───────────────────────────┬───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   AI Assistant (ReAct) │
                  └───────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    get_my_appointments  get_test_results  check_insurance
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                  Natural Language Response
                  + Conversational Memory
                    (patient_sessions)
```

---

### Doctor Workflow

```
  Doctor Login (JWT Auth)
          │
          ▼
  ┌─────────────────────────────────────────────────┐
  │                  Triage View                     │
  │                                                 │
  │  Patient A  ──  AI Risk Level: HIGH    (!)      │
  │  Patient B  ──  AI Risk Level: MEDIUM           │
  │  Patient C  ──  AI Risk Level: LOW              │
  └──────────────────────┬──────────────────────────┘
                         │  Select Patient
                         ▼
  ┌─────────────────────────────────────────────────┐
  │               Consultation Mode                  │
  │                                                 │
  │  Doctor inputs raw clinical notes:              │
  │  "Patient c/o chest tightness, SOB, HR 110..."  │
  └──────────────────────┬──────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   AI Parsing Engine   │
              │   (LLaMA 3.3 70B)    │
              └──────────┬───────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
   Structured       Diagnosis      Follow-up
   Prescription     Record         Schedule
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              Output Guardrail Check
              (flag uncertain language)
                         │
                         ▼
              Saved to consultations
              + ai_audit_logs
```

---

### Nurse Workflow

```
  Nurse Login (JWT Auth)
          │
          ▼
  ┌─────────────────────────────────────────────────┐
  │             Patient Registration                 │
  │                                                 │
  │  Enter: Name, Age, Symptoms, History            │
  └──────────────────────┬──────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  AI Specialist Match  │
              │                      │
              │  Symptoms → LLM →    │
              │  Best Doctor/Dept    │
              └──────────┬───────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │               Waitlist Management                │
  │                                                 │
  │  Patient added to queue                         │
  │  Assigned to suggested doctor                   │
  │  Status visible on Patient Dashboard            │
  └─────────────────────────────────────────────────┘
```

---

### Admin Workflow

```
  Admin Login (JWT Auth)
          │
          ▼
  ┌───────────────────────────────────────────────────────┐
  │                    Admin Dashboard                     │
  │                                                       │
  │  ┌─────────────────┐   ┌──────────────────────────┐  │
  │  │  User Management │   │   AI Audit Log Monitor   │  │
  │  │                 │   │                          │  │
  │  │  Create / Edit  │   │  Real-time log stream    │  │
  │  │  Deactivate     │   │  Guardrail flag alerts   │  │
  │  │  Role Assign    │   │  Anomaly detection       │  │
  │  └─────────────────┘   └──────────────────────────┘  │
  │                                                       │
  │  ┌─────────────────┐   ┌──────────────────────────┐  │
  │  │ Insurance Claims │   │   RAG Knowledge Base     │  │
  │  │                 │   │                          │  │
  │  │  View claims    │   │  Upload JSON / PDF       │  │
  │  │  Override status│   │  Seed emergency protocols│  │
  │  │  Audit trail    │   │  Manage ChromaDB entries │  │
  │  └─────────────────┘   └──────────────────────────┘  │
  └───────────────────────────────────────────────────────┘
```

<br/>

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                   │
│                   React 19 + Vite + Material-UI v9                    │
│                                                                       │
│   Patient View   │   Doctor View   │   Nurse View   │   Admin View   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  REST / HTTP  (JWT in headers)
┌───────────────────────────────▼──────────────────────────────────────┐
│                             BACKEND                                   │
│                      FastAPI (Python) + Uvicorn                       │
│                                                                       │
│  ┌──────────────┐  ┌────────────────────┐  ┌──────────────────────┐ │
│  │  Auth Layer  │  │   fastmcp (MCP)    │  │    AI Guardrails     │ │
│  │  JWT+Bcrypt  │  │   Tool Registry    │  │   Input / Output     │ │
│  └──────────────┘  └────────────────────┘  └──────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    ReAct Agent Layer                            │  │
│  │   Reason → Select Tool → Execute → Observe → Final Answer      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   Immutable Audit Logger                        │  │
│  │         Every AI interaction → ai_audit_logs (permanent)       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────┬───────────────────┬──────────┘
             │                          │                   │
┌────────────▼───────┐    ┌─────────────▼────────┐  ┌──────▼──────────┐
│     SQLite3         │    │      Groq API         │  │    ChromaDB     │
│   Relational DB     │    │   LLaMA 3.3 70B       │  │  Vector Store  │
│                     │    │   (Versatile)         │  │  RAG Engine    │
│  users              │    └──────────────────────┘  │                │
│  patients           │                               │  Emergency     │
│  doctors            │                               │  Protocols     │
│  appointments       │                               │  Embeddings    │
│  consultations      │                               │                │
│  ai_audit_logs      │                               │  Seeded via    │
│  patient_sessions   │                               │  JSON / PDF    │
└─────────────────────┘                               └────────────────┘
```

### Request Lifecycle

```
  Client Request
       │
       ▼
  JWT Validation  ──── FAIL ──→  401 Unauthorized
       │
      PASS
       │
       ▼
  Input Guardrail  ── FLAGGED ──→  Request Blocked / Sanitized
       │
      CLEAN
       │
       ▼
  Route Handler (FastAPI)
       │
       ├── Standard query ──→  SQLite  ──→  JSON Response
       │
       └── AI query ──→  ReAct Agent
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
                 SQLite              ChromaDB
              (patient data)      (RAG protocols)
                    │                    │
                    └─────────┬──────────┘
                              │
                              ▼
                         Groq LLM
                              │
                              ▼
                    Output Guardrail
                              │
                    ┌─────────┴──────────┐
                    │                    │
               CLEAN response     FLAGGED response
                    │                    │
                    ▼                    ▼
              Sent to client    Flagged for human review
                    │
                    ▼
              Audit Log Written (always)
```

### Data Model

```
users ──────────────┬──── patients ──── appointments ──── consultations
                    │                        │
                    └──── doctors  ──────────┘
                                             │
                                        ai_audit_logs
                                        patient_sessions
```

### Tech Stack

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material-UI v9 |
| Backend | FastAPI, Uvicorn, Python 3.11+ |
| AI / LLM | Groq API — `llama-3.3-70b-versatile` |
| MCP Tooling | `fastmcp` (Model Context Protocol) |
| Relational DB | SQLite3 |
| Vector Store | ChromaDB |
| PDF Processing | `pypdf` |
| Auth | JWT + Bcrypt |

<br/>

---

## Quick Start

### Prerequisites

- Python `3.11+`
- Node.js `18+`
- A [Groq API Key](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/hospital-management-system.git
cd hospital-management-system
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Add your GROQ_API_KEY and JWT_SECRET to .env

# Initialize the database
python init_db.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

<br/>

---

## Project Structure

```
hospital-management-system/
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── auth.py                  # JWT authentication
│   ├── models.py                # SQLite data models
│   ├── guardrails.py            # Input/output safety layer
│   ├── rag/
│   │   ├── chroma_client.py     # ChromaDB vector store
│   │   └── seed_protocols.py    # Emergency protocol loader
│   ├── agents/
│   │   └── patient_agent.py     # ReAct agent logic
│   ├── tools/                   # MCP tool definitions
│   │   ├── appointment_tools.py
│   │   ├── lab_tools.py
│   │   └── insurance_tools.py
│   ├── audit/
│   │   └── logger.py            # Immutable audit logging
│   ├── chroma_data/             # Persistent vector storage
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Role-based page views
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   └── api/                 # Axios API clients
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

<br/>

---

## Security & Compliance

| Control | Implementation |
|---|---|
| Authentication | Stateless JWT tokens with expiry |
| Password Security | Bcrypt hashing (cost factor 12) |
| Scope Isolation | All AI tools are bounded to the authenticated user's ID — zero cross-patient access |
| Prompt Injection Defense | Input guardrails sanitize every query before LLM processing |
| Clinical Safety | Uncertain language in prescriptions is auto-flagged for mandatory human review |
| Audit Trail | Every AI action is permanently logged — immutable and timestamped |
| Admin Oversight | Real-time monitoring dashboard for anomaly detection and compliance reporting |

<br/>

---

## API Reference

Interactive documentation is auto-generated by FastAPI.

- **Swagger UI** → [`/docs`](http://localhost:8000/docs) — Try every endpoint directly in the browser.
- **ReDoc** → [`/redoc`](http://localhost:8000/redoc) — Clean, readable reference documentation.

Key endpoint groups:

```
/auth          → Login, register, token refresh
/patients      → Patient profiles and dashboard data
/doctors       → Doctor profiles and triage
/appointments  → Booking and scheduling
/consultations → Clinical notes and AI parsing
/agent         → Patient ReAct chatbot
/admin         → Audit logs, user manage