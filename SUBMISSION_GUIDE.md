# RAILOPTIMA — SIH 2026 Submission & Evaluation Guide

### Smart India Hackathon 2026 | Problem Statement ID: SIH26027

---

## 1. Project Overview & SIH Metadata

| Parameter | Specification |
|---|---|
| **Project Name** | RAILOPTIMA |
| **Problem Statement ID** | SIH26027 |
| **Problem Statement Title** | AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways |
| **Track** | Software |
| **Theme** | Smart Automation |
| **Category** | Transportation & Logistics |
| **Sponsoring Ministry** | Ministry of Railways |
| **Target Evaluation Scope** | Delhi–Ghaziabad Corridor ($28.5\text{ km}$, 6 track sections, 750 canonical assets) |
| **Operational Philosophy** | *"AI recommends. The planner decides."* |

---

## 2. Executive Summary for Evaluators

**RAILOPTIMA** is an intelligent decision-support platform designed to assist Indian Railways section controllers and permanent-way engineers in scheduling track maintenance possessions ("blocks").

Historically, track maintenance requirements and train traffic management have operated in departmental silos, resulting in deferred urgent maintenance or severe train delays from ill-timed possessions. RAILOPTIMA bridges this divide:

1. **Ingests Multi-Departmental Data:** Integrates Track (TMS), Signal (SMMS), Traction (TDMS), and Traffic (COA) data.
2. **Predicts Asset Urgency:** Uses a Gradient Boosting classifier ($98.0\%$ accuracy, $99.27\%$ ROC-AUC) trained on non-leaky physical degradation indicators.
3. **Analyzes Traffic Density:** Evaluates section traffic forecasts to classify operational load into LOW, MEDIUM, and HIGH bands.
4. **Optimizes Possession Windows:** Uses a deterministic multi-objective scheduling engine to rank candidate windows, minimizing expected train delays while addressing urgent maintenance backlog.
5. **Provides Explainable Recommendations:** Quantifies delay reduction percentages and provides natural language justifications.
6. **Preserves Human-in-the-Loop Authority:** Requires explicit human planner review, authorization, and audit logging.

---

## 3. Reviewer Quick-Start (3-Minute Setup)

For evaluators who wish to immediately launch the application locally, follow these concise steps:

### Terminal 1: Backend API (FastAPI)
```bash
# Navigate to project root
cd Final_SIH26027

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start backend server
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
*Backend will seed SQLite database from canonical data and load ML models.*

### Terminal 2: Frontend Dashboard (React + Vite)
```bash
# Navigate to frontend directory
cd Final_SIH26027/frontend

# Install dependencies and start development server
npm install
npm run dev
```

### Access Points
- **Web Application:** [`http://localhost:5173`](http://localhost:5173)
- **Interactive Swagger Docs:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **System Health Check:** [`http://localhost:8000/health`](http://localhost:8000/health)

---

## 4. Demo Authentication Credentials

> [!NOTE]
> The credentials below are **LOCAL DEMO CREDENTIALS ONLY**, provisioned in SQLite for hackathon evaluation purposes. In a production deployment, authentication is integrated with Indian Railways Single Sign-On (IR-SSO) / Active Directory.

| Username | Password | Role | Description |
|---|---|---|---|
| `planner` | `planner123` | **Planner** *(Recommended)* | Section controller with full rights to generate, review, approve, and reject block recommendations. |
| `admin` | `admin123` | **Administrator** | System administrator with full operational and user management privileges. |
| `engineer` | `engineer123` | **Engineer** | Field maintenance engineer with read-only inspection access and post-block execution feedback logging. |

---

## 5. End-to-End Evaluation Workflow

Follow this 8-step walkthrough to experience the complete platform capabilities:

1. **Sign In (`/login`):**
   - Log in using `planner` / `planner123`.
2. **Network Overview (`/dashboard`):**
   - Inspect the schematic corridor map spanning 6 stations from Old Delhi (DLI) to Ghaziabad (GZB).
   - Review network KPIs: 750 assets, critical alert count, backlog volume, and average condition health score.
3. **Asset Intelligence (`/assets`):**
   - Search for specific assets (e.g., press `/` and type `TRK` or `SIG`).
   - Filter by `Critical` risk to see high-urgency track and signaling elements.
   - Click on any asset row to view its detailed multi-sensor degradation telemetry (vibration, wear, ultrasonic score, track geometry) and maintenance history.
4. **Traffic Density Forecast (`/traffic`):**
   - Select Section `SEC-001` and Date `2026-08-01`.
   - Observe the 24-hour freight traffic timeline classified into LOW ($\le 3$), MEDIUM ($4–9$), and HIGH ($>9$) density tiers.
5. **Maintenance Backlog (`/backlog`):**
   - Review pending maintenance work orders ranked by urgency and days overdue.
6. **Optimal Block Planner (`/planner`):**
   - Target Section: `SEC-001`
   - Maintenance Type: `PREVENTIVE`
   - Requested Date: `2026-08-01`
   - Duration: `3 hours`
   - Click **Generate Optimal Block**.
7. **Explainability & Candidate Comparison:**
   - Review the recommended possession slot (e.g., `02:00–05:00`).
   - Inspect the natural language justification explaining why this slot minimizes train delay while clearing critical maintenance.
   - Note the **Delay Reduction %** metric comparing the recommended slot to runner-up alternatives.
   - Examine the **Ranked Candidate Windows Table** showing alternative hours.
8. **Human-in-the-Loop Action & Audit (`/blocks`):**
   - Click **Approve Block** to record the authorized decision.
   - Navigate to **Block Decisions** to verify the immutable audit entry (showing planner identity and decision timestamp).
   - Test field execution feedback: Log actual completion times and observe the prediction error calculation.
9. **Analytics Verification (`/analytics`):**
   - Inspect the live model evaluation cards. Confirm that metrics originate from the saved model artifacts rather than static frontend text.

---

## 6. Repository Architecture & Layout

```text
Final_SIH26027/
│
├── README.md                      # Comprehensive project overview & documentation
├── SUBMISSION_GUIDE.md            # Evaluator instructions, setup, and workflow
├── requirements.txt               # Root Python dependencies pointer (-r backend/requirements.txt)
├── .gitignore                     # Git hygiene: excludes node_modules, .venv, *.db, *.log, etc.
│
├── submission/                    # SIH submission reference documents
│   ├── PRESENTATION.md            # Presentation deck structure & evaluator talking points
│   └── DEMO.md                    # 11-step video demonstration script & walkthrough guide
│
├── docs/                          # Detailed technical documentation
│   └── architecture.md            # In-depth system architecture, ML pipelines & optimization formulas
│
├── assets/                        # Submission media
│   └── screenshots/               # Directory for UI captures
│       └── README.md              # Screenshot index and naming conventions
│
├── frontend/                      # React 18 + TypeScript + Vite web application
│   ├── src/
│   │   ├── components/            # Reusable UI components (Header, Sidebar, RailwayMotion)
│   │   ├── pages/                 # Dashboard, Assets, Traffic, Backlog, Planner, Blocks, Analytics
│   │   ├── api.ts                 # Backend API client & type definitions
│   │   └── types.ts               # Core TypeScript data contracts
│   ├── package.json               # Frontend dependencies (React, Lucide, Recharts, Vite)
│   └── vite.config.ts             # Vite build configuration
│
├── backend/                       # FastAPI REST backend & ML services
│   ├── main.py                    # API entry point, route definitions, DB seeder
│   ├── requirements.txt           # Backend Python package requirements
│   ├── database/                  # SQLAlchemy engine and session management
│   ├── models/orm.py              # Relational database models (Asset, BlockRecommendation, Feedback, etc.)
│   ├── optimization/              # Deterministic multi-objective scheduling engine
│   ├── ml/                        # ML training pipelines & serialized models
│   │   ├── saved_models/          # Trained .joblib models and .json metric reports
│   │   ├── train_urgency_model.py # Urgency GBDT training script
│   │   └── train_traffic_model.py # Traffic density classifier training script
│   ├── scripts/                   # Canonical ETL and preprocessing utilities
│   └── data/                      # Backend working data tables
│
└── dataset/                       # Supplied SIH synthetic dataset
    ├── canonical_reference/       # 15 canonical tables (assets, inspections, defects, forecast, etc.)
    ├── data_dictionary.csv        # Complete data dictionary & field specifications
    └── README.md                  # Dataset origin, schema, and generator documentation
```

---

## 7. Machine Learning & Optimization Summary

### Machine Learning Specifications

| Model | Algorithm | Training / Test Split | Key Metric | Purpose |
|---|---|---|---|---|
| **Maintenance Urgency Classifier** | `GradientBoostingClassifier` (Scikit-learn) | 600 train / 150 test | **Accuracy:** 98.0%<br>**ROC-AUC:** 99.27%<br>**F1-Score:** 94.7% | Predicts high-risk assets requiring immediate block possession without target leakage. |
| **Asset Health Regressor** | `GradientBoostingRegressor` (Scikit-learn) | 600 train / 150 test | **$R^2$ Score:** 0.9813<br>**MAE:** 1.0375 | Estimates a continuous condition score ($0–100$) based on degradation wear indicators. |
| **Traffic Density Classifier** | `GradientBoostingClassifier` (Scikit-learn) | 10,483 train / 2,621 test | **Accuracy:** 96.49% | Categorizes hourly corridor operating load into LOW, MEDIUM, and HIGH density bands. |

> [!NOTE]
> - The **traffic classifier** is a supplementary density categorizer, not an exact passenger timetable simulation. Exact freight train counts originate from the supplied canonical goods-train forecast table.
> - The **health score** is an illustrative condition score derived from sensor and maintenance logs, not a statutory Indian Railways safety certificate.

### Deterministic Optimization Specification

- **Candidate Possession Slots:** Evaluates 7 daily operational windows (`00:00`, `02:00`, `05:00`, `10:00`, `13:00`, `16:00`, `21:00`).
- **Disruption Parameter:** $\delta = 3.2\text{ delay minutes per train}$ running during an active block. *(Clearly labeled as a prototype operational assumption).*
- **Composite Objective Function:**
  $$\text{Priority} = 1.6 \times \text{UrgencyScore} + 0.15 \times \min(\text{BacklogDays}, 60) - 1.0 \times \text{DisruptionMinutes}$$

---

## 8. Dataset Summary (Delhi–Ghaziabad Corridor)

The prototype operates on the supplied synthetic dataset, containing:
- **750 Canonical Assets** spanning track, rails, turnouts, signals, point machines, track circuits, OHE wires, masts, and substations.
- **6 Track Sections** across the $28.5\text{ km}$ Delhi–Ghaziabad route.
- **16 Asset Types** across Civil Engineering, S&T, and TRD (Electrical Traction).
- **16,725 Inspection Records** capturing wear, gauge deviation, voltage, and flaw measurements.
- **888 Recorded Faults / Defects** with severity classifications.
- **6,255 Maintenance Tasks** and **6,212 Completed History Records**.
- **5,707 Historical Block Records** and **18 Block Availability Windows**.
- **13,104 Goods Train Hourly Forecast Records**.

---

## 9. Security, Reliability & Limitations

1. **Synthetic Data Notice:** The dataset is strictly synthetic and illustrative. It does not contain confidential Indian Railways telemetry.
2. **Prototype Disruption Calibration:** The disruption model uses an assumption of $3.2\text{ minutes/train}$. Production integration will calibrate this using historic Control Office Application (COA) delay records.
3. **No Autonomous Dispatching:** The platform does not alter railway signaling or dispatch trains autonomously. Every recommendation requires human controller sign-off.
4. **Secret Management:** Secrets are configured via environment variables (`RAILOPTIMA_SECRET`). Demo credentials are strictly intended for local offline evaluation.
