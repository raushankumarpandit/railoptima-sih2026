# RAILOPTIMA

### AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

> **Smart India Hackathon 2026 — Problem Statement ID: SIH26027**  
> *Sponsoring Ministry: Ministry of Railways | Track: Software | Theme: Smart Automation*

---

## 1. Project Title

**RAILOPTIMA:** Intelligent Decision-Support Platform for Predictive Railway Maintenance Block Planning and Disruption Minimization.

---

## 2. Professional Project Description

RAILOPTIMA is an automated, data-backed decision-support system designed to solve the critical trade-off between infrastructure maintenance and commercial train traffic operations on Indian Railways. By synthesizing multi-departmental asset condition records, historical maintenance logs, pending task backlogs, and train traffic forecasts, RAILOPTIMA identifies high-risk assets and recommends optimal maintenance possession ("block") windows that maximize asset reliability while minimizing passenger and freight disruption.

The prototype is scoped to the **Delhi–Ghaziabad corridor** ($28.5\text{ km}$, 6 bi-directional track sections) and operates on the canonical SIH dataset. Built upon the core philosophy **"AI recommends. The planner decides."**, the platform equips section controllers and permanent-way engineers with transparent, explainable recommendations while keeping final authorization authority entirely in human hands.

---

## 3. SIH Project Information

| Field | Details |
|---|---|
| **Project Name** | RAILOPTIMA |
| **Problem Statement ID** | SIH26027 |
| **Problem Statement** | AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways |
| **Track** | Software |
| **Theme** | Smart Automation |
| **Category** | Transportation & Logistics |
| **Sponsoring Ministry** | Ministry of Railways |
| **Target Corridor (Prototype)** | Delhi–Ghaziabad Corridor (DLI–GZB) |
| **Operational Philosophy** | *"AI recommends. The planner decides."* |

---

## 4. Problem Statement

Railway track maintenance requires physical possession ("blocks"), temporarily closing designated track sections to commercial rail traffic. On high-density routes such as Indian Railways' Golden Quadrilateral and major suburban trunk corridors, scheduling these possessions presents two competing challenges:

1. **Safety & Asset Availability:** Deferring urgent maintenance due to traffic congestion leads to accelerated asset degradation, unplanned emergency speed restrictions, and higher failure risks.
2. **Operational Continuity & Punctuality:** Arbitrarily granting maintenance blocks during high-density operational intervals triggers cascading train delays, crew expiration issues, and substantial commercial losses.

Currently, maintenance planning across Engineering (Civil/Track), S&T (Signaling & Telecom), and TRD (Traction Distribution/Electrical) operates largely through manual, siloed coordination with Control Office Application (COA) dispatchers. There is a lack of unified, explainable decision-support tools that simultaneously evaluate multi-sensor asset degradation and dynamic corridor traffic density to pinpoint optimal, low-disruption possession windows.

---

## 5. Proposed Solution

RAILOPTIMA unifies asset intelligence and traffic scheduling into a single, closed-loop decision-support platform:

```text
Supplied Dataset
      │
      ▼
  Data Layer (FastAPI + SQLite Store)
      │
      ▼
Asset / Maintenance / Traffic Intelligence
      │
      ▼
  ML Models (Urgency GBDT, Health Regressor, Traffic Density Classifier)
      │
      ▼
Scheduling / Optimization Engine (Deterministic Candidate Window Ranking)
      │
      ▼
Recommended Block Window (Optimal Slot + Delay Reduction %)
      │
      ▼
Explanation Layer (Natural Language Rationale + Feature Importance)
      │
      ▼
Planner Review (Visual Dashboard)
      │
      ▼
Approve / Reject (Human-in-the-Loop Decision)
      │
      ▼
Decision / Feedback / Audit (Execution Logging & Continuous Model Calibration)
```

The system:
1. **Aggregates Canonical Data:** Ingests asset records, inspection logs, fault reports, maintenance tasks, and traffic forecasts.
2. **Predicts Maintenance Urgency:** Uses a Gradient Boosting classifier ($98.0\%$ accuracy) trained on non-leaky physical indicators to determine asset failure risk.
3. **Classifies Corridor Traffic Density:** Analyzes section-level freight forecasts into LOW, MEDIUM, and HIGH density bands.
4. **Optimizes Possession Windows:** Uses a deterministic multi-objective scheduling algorithm to rank candidate block hours, maximizing urgency relief while penalizing traffic disruption.
5. **Explains Every Recommendation:** Quantifies expected delay reduction against alternative windows and provides natural language justifications.
6. **Empowers Human Planners:** Retains full human-in-the-loop governance—planners can approve, reject, or adjust blocks, with decisions permanently logged in an immutable audit ledger.
7. **Captures Operational Feedback:** Field engineers record actual block durations and delay variances to continuously calibrate the system.

---

## 6. Key Features

- **Network Topology & Overview:** Interactive schematic map of the 6-station Delhi–Ghaziabad corridor with section-level health and risk telemetry.
- **Asset Intelligence Engine:** Real-time searchable asset register across 16 asset types with risk categorizations (`Critical`, `Attention`, `Healthy`), multi-sensor telemetry (vibration, rail wear, ultrasonic flaws, gauge deviation), and service histories.
- **Traffic Density Forecasting:** 24-hour section operational profile visualizing hourly train counts and density classifications to highlight natural low-traffic possession intervals.
- **Maintenance Backlog Prioritization:** Consolidated view of pending preventive, corrective, and inspection work orders ranked by urgency and days overdue.
- **Optimal Block Planner:** Interactive decision interface allowing planners to specify section, task type, date, and duration (1–12 hours) and receive ranked candidate windows.
- **Explainable Recommendations:** Transparent multi-window comparison showing why a specific slot was selected, its expected disruption in minutes, and its delay reduction percentage over runner-up slots.
- **Human-in-the-Loop Governance:** Formal approval/rejection actions with recorded planner credentials and decision timestamps.
- **Block Decisions & Execution Audit:** Historical ledger of approved, rejected, and completed blocks, equipped with post-maintenance variance tracking.
- **Live Model Analytics:** Dynamic performance dashboard loaded directly from saved model artifacts (`urgency_metrics.json` and `traffic_metrics.json`).

---

## 7. Technology Stack

### Frontend
- **Framework:** React 18 (TypeScript)
- **Tooling & Bundling:** Vite
- **Visualizations & Charts:** Recharts
- **Iconography:** Lucide React
- **Styling:** Custom Modular CSS with high-contrast railway operations theme

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Application Server:** Uvicorn (ASGI)
- **Database & ORM:** SQLite with SQLAlchemy 2.0
- **Data Manipulation:** Pandas, NumPy
- **Serialization & Models:** Pydantic v2, Joblib
- **Authentication:** JWT (HMAC-SHA256) via `python-jose`

### Machine Learning & Optimization
- **ML Framework:** Scikit-learn (1.8.0)
- **Urgency Classification:** `GradientBoostingClassifier` (160 estimators, max depth 2)
- **Condition Health Estimation:** `GradientBoostingRegressor` (220 estimators, max depth 3)
- **Traffic Density Categorization:** `GradientBoostingClassifier` (180 estimators, max depth 3)
- **Optimization Engine:** Deterministic multi-objective composite priority scoring

---

## 8. System Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     CLIENT / PLANNER INTERFACE                         │
│             React 18 + TypeScript + Vite Dashboard                     │
│                                                                        │
│  [Network Overview]  [Asset Intelligence]  [Traffic Forecast]          │
│  [Backlog Queue]     [Block Planner]       [Decisions & Audit]         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JWT Bearer Auth)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND API                             │
│                                                                        │
│  /auth/login          /sections            /assets                     │
│  /maintenance         /traffic/forecast    /predict/urgency            │
│  /schedule/recommend  /schedule/approve    /feedback                   │
│  /analytics           /model/performance                               │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│     INTELLIGENCE & OPTIMIZATION      │ │       DATA PERSISTENCE        │
│                                      │ │                               │
│  - Urgency Classifier (GBDT)         │ │  - SQLite Database            │
│  - Health Regressor (GBDT)           │ │    (railoptima.db)            │
│  - Traffic Density Classifier (GBDT) │ │  - SQLAlchemy 2.0 ORM         │
│  - Deterministic Scheduling Engine   │ │  - Seeded from Canonical CSVs │
│  - Explainability Synthesizer        │ │  - Feedback & Audit Ledger    │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 9. Machine Learning Approach

RAILOPTIMA employs a rigorous machine learning design engineered specifically to prevent target leakage and ensure operational trust:

### 1. Feature Engineering & Target Leakage Prevention
The primary maintenance urgency model identifies whether an asset is at critical risk of failure. The ground-truth supervision target is defined as:
$$\text{Urgent} = 1 \iff (\text{Critical/Major Defects in Prior 180 Days} > 0 \lor \text{Open Defects} > 0 \lor \text{Deferred Tasks} > 0)$$
To prevent target leakage, all direct defect-severity counters and deferred task flags are **strictly excluded** from model inputs. The model learns exclusively from physical condition measurements and operational history:
- Physical wear: `base_wear_index`, `rail_wear_mm`, `vibration_mm_s`, `track_geometry_deviation_mm`
- Operational stress: `age_years`, `days_since_last_service`, `historical_failures`, `maintenance_frequency_per_year`, `maintenance_count_365d`, `emergency_count`, `avg_duration_minutes`
- Structural context: `asset_type` (One-hot encoded), `section_class` (One-hot encoded)

### 2. Condition Health Regression
A continuous health index ($0–100$) is predicted using a Gradient Boosting Regressor, giving planners a granular gauge of physical condition degradation.

### 3. Supplementary Traffic Density Classification
Corridor freight traffic is categorized into operational intensity tiers: LOW ($\le 3$), MEDIUM ($4–9$), and HIGH ($>9$) trains/hour based on temporal and section attributes.

---

## 10. Model Evaluation

Model evaluation metrics are loaded dynamically by the API from saved artifacts (`backend/ml/saved_models/`):

### Maintenance Urgency Classifier (`GradientBoostingClassifier`)
- **Dataset Split:** 600 Train / 150 Test (Stratified)
- **Accuracy:** $98.0\%$ ($0.9800$)
- **Precision:** $93.1\%$ ($0.9310$)
- **Recall:** $96.4\%$ ($0.9643$)
- **F1-Score:** $94.7\%$ ($0.9474$)
- **ROC-AUC:** $99.27\%$ ($0.9927$)

### Asset Health Regression (`GradientBoostingRegressor`)
- **Dataset Split:** 600 Train / 150 Test
- **$R^2$ Score:** $0.9813$
- **Mean Absolute Error (MAE):** $1.0375$

### Traffic Density Level Model (`GradientBoostingClassifier`)
- **Dataset Split:** 10,483 Train / 2,621 Test
- **Accuracy:** $96.49\%$ ($0.9649$)

> [!NOTE]
> - **Supplementary Traffic Model:** The traffic classifier categorizes operational density levels; it is NOT an exact passenger timetable simulation. Exact freight train counts originate from the supplied canonical forecast.
> - **Prototype Condition Score:** The health score is a prototype-derived condition score reflecting relative wear and servicing age, not a statutory Indian Railways safety certificate.

---

## 11. Scheduling & Optimization Approach

Railway block scheduling requires absolute determinism and unit-testable consistency. RAILOPTIMA utilizes a transparent, multi-criteria optimization engine (`optimization_service.py`):

1. **Candidate Possession Windows:** Generates feasible candidate start times covering off-peak and daytime operational slots:
   $$\mathcal{H} = \{00:00, 02:00, 05:00, 10:00, 13:00, 16:00, 21:00\}$$
2. **Disruption Estimation:** Disruption is calculated per candidate window based on forecast traffic:
   $$\text{DisruptionMinutes} = \text{PredictedTraffic} \times 3.2\text{ delay minutes/train}$$
   *(The factor $3.2\text{ min/train}$ is an illustrative prototype assumption requiring calibration with divisional operational data).*
3. **Composite Priority Formulation:**
   $$\text{PriorityScore} = 1.6 \times \text{UrgencyScore} + 0.15 \times \min(\text{BacklogDays}, 60) - 1.0 \times \text{DisruptionMinutes}$$
4. **Quantified Delay Reduction:** Measures delay minutes saved relative to the runner-up candidate window:
   $$\text{DelayReductionPct} = \max\left(0, \frac{\text{Disruption}_{\text{next-best}} - \text{Disruption}_{\text{best}}}{\text{Disruption}_{\text{next-best}}}\right) \times 100$$
5. **Confidence & Explanation:** Computes recommendation confidence based on score separation and generates an explainable textual summary.

---

## 12. Dataset Description

The system is fully data-backed and operates on the canonical dataset supplied for SIH:

> [!NOTE]
> **Data Authenticity Notice:** The supplied dataset represents the Delhi–Ghaziabad corridor but is **synthetic and illustrative**. It does not represent confidential or official Indian Railways operational logs.

### Canonical Reference Statistics (`dataset/canonical_reference/`)
- **750 Canonical Assets** across 6 sections and 16 asset types (`assets.csv`)
- **6 Track Sections** covering the $28.5\text{ km}$ corridor (`sections.csv`)
- **16 Asset Types** across Civil Track, S&T, and TRD Electrical (`asset_types.csv`)
- **16,725 Inspection Records** with multi-sensor readings (`inspections.csv`)
- **888 Recorded Faults / Defects** with severity categorizations (`defects.csv`)
- **6,255 Maintenance Tasks** covering scheduled and emergency repairs (`maintenance_tasks.csv`)
- **6,212 Completed Maintenance History Records** (`maintenance_history.csv`)
- **5,707 Historical Block Records** (`blocks.csv`)
- **13,104 Hourly Goods Train Forecast Records** (`goods_train_forecast.csv`)
- **18 Block Availability Allowances** (`block_availability.csv`)

---

## 13. Repository Structure

```text
Final_SIH26027/
│
├── README.md                      # Comprehensive project documentation
├── SUBMISSION_GUIDE.md            # Evaluator instructions, setup, and workflow
├── requirements.txt               # Root dependencies pointer (-r backend/requirements.txt)
├── .gitignore                     # Git ignore rules for node_modules, .venv, *.db, etc.
│
├── submission/                    # SIH evaluation reference documents
│   ├── PRESENTATION.md            # Presentation deck structure & evaluator talking points
│   └── DEMO.md                    # 11-step video demonstration script & walkthrough guide
│
├── docs/                          # In-depth technical documentation
│   └── architecture.md            # Full architecture specification, ML pipelines & formulas
│
├── assets/                        # Submission media
│   └── screenshots/               # Visual UI captures
│       └── README.md              # Screenshot index and naming conventions
│
├── frontend/                      # React 18 + TypeScript + Vite web application
│   ├── src/
│   │   ├── components/            # Reusable UI components (Header, Sidebar, RailwayMotion)
│   │   ├── pages/                 # Dashboard, Assets, Traffic, Backlog, Planner, Blocks, Analytics
│   │   ├── api.ts                 # Backend API client & type definitions
│   │   └── types.ts               # TypeScript data interfaces
│   ├── package.json               # Frontend dependencies (React, Lucide, Recharts, Vite)
│   └── vite.config.ts             # Vite build configuration
│
├── backend/                       # FastAPI REST backend & ML services
│   ├── main.py                    # API routes, startup seeding, authentication
│   ├── requirements.txt           # Backend Python package requirements
│   ├── database/                  # SQLAlchemy engine and session management
│   ├── models/orm.py              # Relational database models
│   ├── optimization/              # Deterministic scheduling engine
│   ├── ml/                        # ML training scripts and saved models
│   │   ├── saved_models/          # Urgency, health, and traffic .joblib & .json files
│   │   ├── train_urgency_model.py # Urgency model training entry point
│   │   └── train_traffic_model.py # Traffic model training entry point
│   ├── scripts/                   # Canonical ETL and preprocessing utilities
│   └── data/                      # Backend operational data tables
│
└── dataset/                       # Supplied SIH synthetic dataset
    ├── canonical_reference/       # 15 canonical tables
    ├── data_dictionary.csv        # Comprehensive data dictionary
    └── README.md                  # Dataset origin and ETL documentation
```

---

## 14. Installation

### Prerequisites
- Python 3.10+ (Python 3.11 or 3.12 recommended)
- Node.js 18+ and npm 9+
- Git

### 1. Clone or Open the Repository
```bash
cd Final_SIH26027
```

### 2. Backend Environment Setup
```bash
# Create Python virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS / Linux:
source .venv/bin/activate
# On Windows (PowerShell):
# .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Frontend Environment Setup
```bash
cd frontend
npm install
cd ..
```

---

## 15. Run Instructions

### 1. Start the Backend API
In the project root with the virtual environment activated:
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
- API Base URL: [`http://localhost:8000`](http://localhost:8000)
- Swagger Documentation: [`http://localhost:8000/docs`](http://localhost:8000/docs)
- Health Check: [`http://localhost:8000/health`](http://localhost:8000/health)

### 2. Start the Frontend Application
Open a second terminal window:
```bash
cd frontend
npm run dev
```
- Web Application: [`http://localhost:5173`](http://localhost:5173)

---

## 16. Demo Credentials

> [!NOTE]
> These credentials are **LOCAL DEMO CREDENTIALS ONLY**, provisioned in the local SQLite store for evaluation.

| Username | Password | Role | Access Scope |
|---|---|---|---|
| `planner` | `planner123` | **Planner** *(Primary)* | Section controller; generate, evaluate, approve, and reject block requests. |
| `admin` | `admin123` | **Administrator** | Full operational administration and system visibility. |
| `engineer` | `engineer123` | **Engineer** | Field maintenance engineer; inspect assets and record post-block execution feedback. |

---

## 17. Demonstration Workflow

Follow this concise sequence during evaluation:
1. **Sign In:** Log in as `planner` / `planner123`.
2. **Network Overview:** Inspect the 6-station corridor map and high-level health KPIs.
3. **Asset Intelligence:** Filter by `Critical` risk; inspect degradation telemetry and maintenance history in the detail modal.
4. **Traffic Forecast:** Review 24-hour freight traffic trends and LOW / MEDIUM / HIGH operational bands.
5. **Maintenance Backlog:** Review pending work orders ranked by urgency and days overdue.
6. **Block Planner:** Select `SEC-001`, `PREVENTIVE` maintenance, date `2026-08-01`, and `3 hours` duration.
7. **Generate Recommendation:** Click **Generate Optimal Block** to view candidate rankings and disruption calculations.
8. **Explainability:** Review the natural language explanation and delay reduction percentage vs. runner-up slots.
9. **Planner Action:** Click **Approve Block** (or **Reject Block**) to record the decision.
10. **Audit & Feedback:** Navigate to **Block Decisions** to verify the audit log and log execution feedback.
11. **System Analytics:** Inspect live model validation metrics populated directly from saved model artifacts.

---

## 18. API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server status, model verification, data mode | No |
| `POST` | `/auth/login` | Issues JWT bearer access token | No |
| `GET` | `/sections` | List 6 corridor track sections | Yes |
| `GET` | `/assets` | Query assets with risk-level filter and pagination | Yes |
| `GET` | `/assets/{asset_id}` | Detailed asset telemetry and recent servicing history | Yes |
| `GET` | `/maintenance` | Retrieve prioritized maintenance task backlog | Yes |
| `GET` | `/traffic/forecast` | 24-hour section freight traffic forecast | Yes |
| `POST` | `/predict/urgency` | Run ML inference for failure probability and urgency | Yes |
| `POST` | `/schedule/recommend` | Generate deterministic block recommendation | Yes |
| `GET` | `/schedule/recommendations`| Retrieve all generated block recommendations | Yes |
| `POST` | `/schedule/{rid}/approve` | Planner approval of recommendation | Planner / Admin |
| `POST` | `/schedule/{rid}/reject` | Planner rejection of recommendation | Planner / Admin |
| `POST` | `/feedback` | Post-block actual delay and variance logging | Yes |
| `GET` | `/analytics` | Corridor operational KPIs and decision stats | Yes |
| `GET` | `/model/performance` | Live model validation metrics from saved artifacts | Yes |

---

## 19. Screenshots Section

Refer to [`assets/screenshots/README.md`](assets/screenshots/README.md) for the screenshot capture guide and standard naming convention. Expected evaluation captures:
- `login.png`: Authentication portal with role selection.
- `network-overview.png`: Corridor schematic map and operational KPIs.
- `asset-intelligence.png`: Asset registry with risk indicators and search filters.
- `traffic-forecast.png`: 24-hour freight traffic timeline with density bands.
- `maintenance-backlog.png`: Prioritized maintenance work-order queue.
- `block-planner.png`: Block configuration input card.
- `recommendation.png`: Recommended slot, explanation narrative, and candidate comparison.
- `block-decisions.png`: Immutable decision history and approval audit log.
- `system-analytics.png`: Live model evaluation metrics and corridor operational KPIs.

---

## 20. Prototype Limitations

1. **Synthetic Data Scope:** The dataset is synthetic and illustrative, designed to validate algorithm functionality without requiring sensitive railway infrastructure data.
2. **Disruption Assumption:** Traffic delay is estimated using an operational baseline assumption of **$3.2\text{ delay minutes per train}$**. In production, this factor must be calibrated against historical COA dispatch logs.
3. **Static Headway Envelope:** Headway safety intervals between consecutive trains are modeled via average hourly density rather than dynamic signal block-by-block track circuit occupancy.
4. **Single-Corridor Scope:** The prototype is configured for the 6 sections of the Delhi–Ghaziabad corridor ($28.5\text{ km}$).

---

## 21. Future Scope & Production Roadmap

- **CRIS Enterprise Integration:** Direct real-time streaming integration with Control Office Application (COA), Track Management System (TMS), and FOIS/ICMS.
- **Kavach / ETCS Level 2 Integration:** Ingesting automatic train protection (ATP) telemetry for dynamic headway reservation.
- **Resource & Crew Constraints:** Incorporating maintenance machine (tamper machines, wiring cars, rail grinders) and maintenance gang depot availability into the scheduling engine.
- **Dynamic Timetable Simulation:** Microscopic simulation of passenger priority classes and freight rerouting paths during prolonged possessions.
- **Network-Wide Deployment:** Scaling the architecture to divisional control offices across all 17 railway zones of Indian Railways.

---

## 22. Human-in-the-Loop Philosophy

$$\textbf{“AI recommends. The planner decides.”}$$

Railway operations are safety-critical. Automated systems must assist, not supersede, authorized railway personnel. RAILOPTIMA does not unilaterally grant track access or halt train movements. Instead, it serves as a high-precision analytical co-pilot that synthesizes thousands of telemetry points into transparent, explainable recommendations. Every possession decision requires explicit human authorization, and every action is recorded in an immutable audit ledger for complete accountability.

---

## 23. SIH Submission References

- **Submission Guide:** [`SUBMISSION_GUIDE.md`](SUBMISSION_GUIDE.md)
- **Technical Architecture Specification:** [`docs/architecture.md`](docs/architecture.md)
- **Presentation Reference Deck:** [`submission/PRESENTATION.md`](submission/PRESENTATION.md)
- **Video Demonstration Walkthrough:** [`submission/DEMO.md`](submission/DEMO.md)
- **Screenshots Index:** [`assets/screenshots/README.md`](assets/screenshots/README.md)
- **Dataset Documentation & Dictionary:** [`dataset/README.md`](dataset/README.md) and [`dataset/data_dictionary.csv`](dataset/data_dictionary.csv)
