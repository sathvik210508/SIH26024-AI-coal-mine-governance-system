# SIH26024 — AI-Based Smart Governance & Compliance Monitoring for Coal Mines

> **An Enterprise-Grade, Full-Stack Autonomous Governance, Statutory Compliance & Predictive Safety Operations Platform for Indian Coal Mines.**

---

## 🎯 Executive Overview

The **SIH26024 Smart Governance Platform** addresses statutory safety enforcement, predictive hazard prevention, and operational transparency across Indian coal mining operations under the regulatory framework of the **Directorate General of Mines Safety (DGMS)** and the **Ministry of Coal**.

This is a production-grade, full-stack application featuring:
- **Real SQLite Database** with realistic operational seed data (3 organizations, 6 mines, 24 zones, 60 workers, 25 heavy machinery assets, 50+ incidents, 35+ statutory violations, 100+ OCR document vaults, and chained audit logs).
- **Four Distinct Role Portals** with strict RBAC enforcement (Field Supervisor, Mine Manager, Corporate Executive, Government Regulator).
- **SHA-256 Cryptographic Audit Hash-Chain** providing tamper-evident Merkle event chains from the Genesis block.
- **Explainable Multi-Factor AI Risk Engine** calculating dynamic risk scores (0–100) and automated statutory inspection recommendations.
- **Document Vault & OCR Parser** for automatic extraction of certificate IDs, expiration dates, and fitness statuses.
- **Interactive Geospatial GIS Architecture** with real-time Leaflet mapping of mining boundaries, high-risk zones, active machinery telemetry, and environmental gas sensors.
- **Real-Time Automated Escalation & Notification Engine** with Server-Sent Events (SSE).
- **Real Report Generation Engine** producing downloadable statutory compliance PDFs (via ReportLab) and Excel analytics spreadsheets (via openpyxl).

---

## 🔐 Demo Accounts & Instant Role Switcher

The application features instant one-click demo role switching directly in the top command header:

| Role Code | Portal Route | Demo Email | Password | Primary Authority & Constraints |
|:---|:---|:---|:---|:---|
| **FIELD_SUPERVISOR** | `/field/*` | `supervisor@bharatcoal.in` | `Field@2026` | Mobile-first execution, checklist completion, hazard observations, attendance logging, evidence upload. *Cannot create/schedule inspections or independently close actions.* |
| **MINE_MANAGER** | `/mine/*` | `manager@bharatcoal.in` | `Manager@2026` | Mine command center, heavy machinery telemetry, worker roster, inspection creation & assignment, violation management, evidence verification & closure, GIS command, AI risk intelligence. |
| **CORPORATE_EXECUTIVE** | `/corporate/*` | `executive@bharatcoal.in` | `Corporate@2026` | Multi-mine portfolio governance, **6-Mine Comparison Matrix**, corporate directive issuance, systemic recurring hazard pattern detection, safety campaigns ("Zero Electrical Hazard Drive"). |
| **GOVERNMENT_REGULATOR** | `/government/*` | `regulator@gov.in` | `Gov@2026` | **DGMS Statutory Authority**, jurisdiction surveillance, statutory inspections ordering, accident investigations, regulatory directives (`REG-2026-XXXX`), national spatial risk map, cryptographic hash verification. |

---

## 🏗️ Architecture & Technology Stack

```
                        ┌──────────────────────────────────────────────┐
                        │   SIH26024 Mining Command Center Frontend    │
                        │   Vite + React 19 + TypeScript + Tailwind v4 │
                        └──────────────────────┬───────────────────────┘
                                               │ HTTP / REST / SSE
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │        FastAPI Python 3.14 Backend           │
                        │      JWT Auth + RBAC + OpenAPI Swagger       │
                        └───────┬──────────────┬──────────────┬────────┘
                                │              │              │
            ┌───────────────────┴──┐     ┌─────┴────────┐   ┌─┴───────────────────┐
            │  AI & Audit Engines  │     │ GIS & Vault  │   │  Reporting Service  │
            ├──────────────────────┤     ├──────────────┤   ├─────────────────────┤
            │ • SHA-256 Hash Chain │     │ • Leaflet GIS│   │ • ReportLab PDF     │
            │ • Explainable Risk   │     │ • OCR Engine │   │ • openpyxl Excel    │
            │ • Pattern Detection  │     │ • Local Disk │   │ • SSE Notifications │
            └───────────────────┬──┘     └─────┬────────┘   └─┬───────────────────┘
                                │              │              │
                                └──────────────┼──────────────┘
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │     SQLAlchemy ORM + SQLite Database         │
                        │      (sih26024.db — 18 Relational Models)    │
                        └──────────────────────────────────────────────┘
```

---

## ⚡ Quickstart Guide

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Re-seed fresh demo data if needed
python -m app.seeds.seed_data

# Run FastAPI backend server
python -m uvicorn app.main:app --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000` with interactive API docs at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173` with automatic API proxy to `http://127.0.0.1:8000`.*

---

## 🛡️ Core Engines & Technical Workflows

### 1. Cryptographic Audit Hash-Chain (`SHA-256`)
- Every statutory action, violation issuance, checklist execution, evidence upload, and verification creates an immutable block linked to the previous block hash:
  $$\text{Block Hash} = \text{SHA256}(\text{Block ID} \parallel \text{Prev Hash} \parallel \text{Timestamp} \parallel \text{Entity} \parallel \text{Action} \parallel \text{User ID} \parallel \text{Metadata})$$
- Users can click the **HASH CHAIN VALID** button in the header at any time to verify the mathematical integrity of all blocks sequentially from Genesis.

### 2. Deterministic & Explainable AI Risk Engine
- Rather than a black-box model, the AI engine uses an explainable multi-factor formula evaluating:
  - **Open Violation Severity Index** (Critical violations weighted at 15.0 pts, High at 8.0 pts)
  - **Overdue Corrective Action Rate** (actions past deadline penalty)
  - **Unresolved Hazard Observations**
  - **Environmental Telemetry Threshold Breaches** (Methane $CH_4$, Carbon Monoxide $CO$)
  - **Worker Attendance & Training Deficits**
- Automatically flags high-risk mines, detects systemic cross-mine recurring hazard patterns, and suggests targeted statutory inspection checklists.

### 3. Compliance Enforcement Rule: `COMPLETED ≠ CLOSED`
- Field Supervisors upload photo/document evidence for corrective actions, transitioning status from `IN_PROGRESS` $\rightarrow$ `AWAITING_VERIFICATION`.
- Actions **cannot be closed by Field Supervisors**.
- Authorized Mine Managers or Government Regulators review the evidence and must formally accept or return for correction. Only upon accepted verification does the status transition to `CLOSED` and record an immutable audit block.

### 4. Interactive GIS Telemetry & Spatial Command
- Real Leaflet GIS mapping featuring:
  - Statutory mine lease boundaries
  - Operational zones color-coded by risk tier (Low / Medium / High)
  - Active heavy machinery markers with status & speed telemetry
  - Real-time environmental sensor nodes with breach alerts
  - Incident locations with severity indicators

### 5. Official PDF & Excel Reporting
- Generates downloadable statutory compliance reports:
  - **PDF Export**: Formatted ReportLab document with corporate header, KPI summary table, active violations registry, and DGMS certification footer.
  - **Excel Export**: Multi-tab workbook with separate sheets for Metrics, Violations, Corrective Actions, and Machinery.

---

## 🧪 Automated Test Suite

Run the full automated test suite containing 10 comprehensive end-to-end test scenarios:
```bash
cd backend
python -m pytest tests/ -v
```

### Verified Test Cases:
1. `test_health_check`: Verifies API uptime, database connectivity, and timestamp.
2. `test_login_demo_accounts`: Tests JWT token generation for all 4 demo personas.
3. `test_login_invalid_credentials`: Verifies 401 Unauthorized rejection on bad passwords.
4. `test_field_cannot_create_inspection`: Asserts strict RBAC role isolation (403 Forbidden for field supervisor).
5. `test_full_compliance_lifecycle`: End-to-end execution from checklist non-compliance $\rightarrow$ violation $\rightarrow$ action $\rightarrow$ evidence upload $\rightarrow$ manager verification & closure.
6. `test_cryptographic_audit_hash_chain`: Mathematical SHA-256 chain verification from Genesis block.
7. `test_ai_risk_and_copilot`: Evaluates explainable multi-factor risk scoring and AI copilot context-aware queries.
8. `test_corporate_endpoints`: Portfolio dashboard, 6-mine comparison benchmarks, and corporate directive issuance.
9. `test_government_endpoints`: DGMS regulatory notices, national risk map coordinates, and statutory orders.
10. `test_report_generation`: Validates live PDF and Excel document generation.

---

## 📂 Project Structure

```
SIHNEW222/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT creation, bcrypt verification, role guards
│   │   ├── models/         # 18 SQLAlchemy relational database models
│   │   ├── routers/        # FastAPI API endpoints (auth, field, mine, corporate, gov, ai, audit, reports)
│   │   ├── seeds/          # Realistic seed database generator
│   │   ├── services/       # Audit hash-chain, AI risk, OCR, notifications, reports, GIS
│   │   ├── config.py       # Pydantic environment configuration
│   │   ├── database.py     # SQLAlchemy engine, session maker, Base
│   │   └── main.py         # App factory, CORS, static uploads, SSE
│   ├── tests/              # 10 comprehensive automated integration tests
│   ├── uploads/            # Statutory evidence & document vault storage
│   ├── requirements.txt    # Python package dependencies
│   ├── sih26024.db         # Pre-seeded SQLite database
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # UI design system, Header, Sidebar, AI Copilot, Audit Modal, GIS Map
│   │   ├── context/        # AuthContext, NotificationContext
│   │   ├── pages/          # 4 Portal implementations (auth, field, mine, corporate, government)
│   │   ├── services/       # Axios API client, Offline LocalStorage sync
│   │   ├── types/          # Full TypeScript interface definitions
│   │   ├── App.tsx         # Master layout & role-based routing
│   │   ├── index.css       # Command center theme & Tailwind v4 styling
│   │   └── main.tsx        # React root entrypoint
│   ├── package.json        # Dependencies & scripts
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite config with @tailwindcss/vite & API proxies
└── README.md
```

---

## 🏆 Regulatory Compliance Standards Followed
- **Coal Mines Regulations (CMR) 2017**
- **The Mines Act, 1952 (Sections 22, 22A, 23)**
- **DGMS Circulars & Standard Operating Procedures (SOPs)**
- **Ministry of Coal Smart Governance Directives**
