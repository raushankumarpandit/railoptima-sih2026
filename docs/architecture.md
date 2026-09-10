# RAILOPTIMA — Technical Architecture Specification

### SIH 2026 Problem Statement SIH26027: AI-Powered Automatic Block Planning

---

## 1. System Overview

RAILOPTIMA is a full-stack, data-driven decision-support platform designed to automate railway maintenance block planning on Indian Railways. The system resolves the core operational dilemma of railway infrastructure management: **balancing urgent track asset maintenance with the minimization of commercial train traffic disruptions**.

The prototype implementation is scoped to the **Delhi–Ghaziabad corridor** ($28.5\text{ km}$, 6 bidirectional track sections, 750 canonical infrastructure assets). It ingests multi-departmental asset condition, defect history, maintenance backlog, and train traffic forecast records to recommend optimal, explainable possession windows.

### Core Philosophy
$$\textbf{“AI recommends. The planner decides.”}$$
RAILOPTIMA is strictly a **decision-support system** for section controllers and infrastructure planners. It does not autonomously execute possession closures or override existing safety signaling or interlocking protocols.

---

## 2. End-to-End Conceptual Flow

```text
       ┌────────────────────────────────────────────────────────┐
       │              Supplied Canonical Dataset                │
       │  (TMS, SMMS, TDMS, COA, Freight Forecast, Master Data) │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                       Data Layer                       │
       │    FastAPI Data Ingestion + SQLite / SQLAlchemy Store  │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │        Asset / Maintenance / Traffic Intelligence      │
       │   Telemetry Normalization, Backlog Scoring, Density    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                       ML Models                        │
       │   - Urgency Classifier (GBDT: 98% Acc, 99.27% ROC-AUC) │
       │   - Health Regressor (GBDT: R² 0.9813, MAE 1.0375)     │
       │   - Traffic Density Classifier (GBDT: 96.49% Acc)      │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │           Scheduling / Optimization Engine             │
       │    Deterministic Candidate Possession Window Ranking   │
       │   Priority = 1.6*Urgency + 0.15*Backlog - 1.0*Disruption│
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                Recommended Block Window                │
       │     Optimal Slot + Quantified Delay Reduction %        │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                   Explanation Layer                    │
       │  Natural Language Rationale + Feature Attribution      │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                Planner Review Dashboard                │
       │       Human-in-the-Loop Visual Decision Support        │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                    Approve / Reject                    │
       │           Explicit Section Controller Action           │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               Decision / Feedback / Audit              │
       │     Permanent Audit Trail + Post-Block Telemetry       │
       └────────────────────────────────────────────────────────┘
```

---

## 3. High-Level Architectural Layers

RAILOPTIMA is structured into four decoupled layers: Presentation, API & Orchestration, Intelligence & Optimization, and Persistence.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│           React 18 + TypeScript + Vite + Tailwind/Custom CSS          │
│                                                                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Network Overview │ │Asset Intelligence│ │    Traffic Forecast    │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │   Backlog Queue  │ │  Block Planner   │ │ Block Decisions/Audit  │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐                             │
│  │ System Analytics │ │   Auth & RBAC    │                             │
│  └──────────────────┘ └──────────────────┘                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API & ORCHESTRATION LAYER                       │
│                     Python 3.10+ / FastAPI Application                 │
│                                                                        │
│  - JWT Bearer Authentication & Role-Based Access Control               │
│  - Asset Management & Inspection History Routing                       │
│  - Traffic Forecast & Density Retrieval Routing                        │
│  - Scheduling & Recommendation Generation Routing                      │
│  - Human Decision Workflow (Approve / Reject) Routing                  │
│  - Operational Feedback & Audit Log Routing                            │
│  - Analytics & Model Performance Metrics Routing                       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│     INTELLIGENCE & OPTIMIZATION      │ │       DATA PERSISTENCE        │
│                                      │ │                               │
│ ┌──────────────────────────────────┐ │ │ ┌───────────────────────────┐ │
│ │ Scikit-Learn Predictive Pipeline │ │ │ │ SQLite Relational DB      │ │
│ │  - Urgency Classifier (GBDT)     │ │ │ │ (railoptima.db)           │ │
│ │  - Health Regressor (GBDT)       │ │ │ └─────────────┬─────────────┘ │
│ │  - Traffic Density Model (GBDT)  │ │ │               │               │
│ └──────────────────────────────────┘ │ │ ┌─────────────▼─────────────┐ │
│ ┌──────────────────────────────────┐ │ │ │ SQLAlchemy 2.0 ORM        │ │
│ │ Deterministic Scheduling Engine  │ │ │ │  - User & Role Entities   │ │
│ │  - Candidate Window Generator    │ │ │ │  - TrackSection & Asset   │ │
│ │  - Disruption Estimator          │ │ │ │  - MaintenanceRecord      │ │
│ │  - Multi-Objective Ranker        │ │ │ │  - BlockRecommendation    │ │
│ │  - Explainability Synthesizer    │ │ │ │  - Feedback & Audit Log   │ │
│ └──────────────────────────────────┘ │ │ └───────────────────────────┘ │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 4. Frontend Architecture (`frontend/`)

The client interface is built as a Single Page Application (SPA) providing sub-second interaction response times and intuitive railway management UX:

- **Framework & Tooling:** React 18 with TypeScript, packaged and served via Vite for high-performance Hot Module Replacement (HMR) and optimized build bundles.
- **Iconography & Visualization:** `lucide-react` for standardized railway symbols; `recharts` for interactive time-series traffic and degradation curves.
- **Client-Side API Layer (`frontend/src/api.ts`):**
  - Modular HTTP client interfacing with the FastAPI backend.
  - Automatic JWT Bearer token injection on authenticated requests.
  - Type-safe payload validation using TypeScript interfaces (`frontend/src/types.ts`).
- **Pages & Components:**
  1. `Dashboard.tsx`: Corridor overview, station connectivity graph, high-level operational statistics.
  2. `Assets.tsx`: Searchable, filterable asset registry with real-time risk classification (`Critical`, `Attention`, `Healthy`) and interactive modal for multi-sensor drilldown.
  3. `Traffic.tsx`: Section-level 24-hour freight traffic forecast visualization with LOW/MEDIUM/HIGH density thresholds.
  4. `Backlog.tsx`: Work-order management highlighting deferred tasks and overdue days.
  5. `Planner.tsx`: Core decision-support interface for block request parametrization, animated evaluation phases, candidate comparison, and human approval.
  6. `Blocks.tsx`: Historical ledger of approved, rejected, and completed block windows with field feedback capture.
  7. `Analytics.tsx`: Model evaluation dashboards populated dynamically from backend model artifacts.
  8. `Login.tsx`: Role-based authentication portal (`planner`, `admin`, `engineer`).

---

## 5. Backend Architecture & REST API (`backend/`)

The server is implemented using FastAPI, leveraging Python's asynchronous capabilities and Pydantic validation:

- **Application Entry Point (`backend/main.py`):**
  - Initializes FastAPI application with CORS middleware for frontend communication.
  - Lifecycle `startup` event loads pre-trained scikit-learn models from disk (`joblib`) into memory and executes idempotent database seeding from preprocessed CSV data.
- **Authentication & Security:**
  - Standard JSON Web Tokens (JWT) signed using HMAC-SHA256 (`python-jose`).
  - Role-based authorization (`current_user` dependency) protecting administrative and planner endpoints.
  - Local demo accounts provided for evaluation: `planner`, `admin`, `engineer`.
- **Database Connection & ORM (`backend/database/db.py` & `backend/models/orm.py`):**
  - SQLAlchemy 2.0 ORM over SQLite (`railoptima.db`).
  - Strict relational schema modeling assets, track sections, historical maintenance tasks, predictions, block recommendations, feedback, and model metrics.
- **Core Endpoints:**
  | Method | Path | Description | Access |
  |---|---|---|---|
  | `GET` | `/health` | System status, model loading verification, data mode | Public |
  | `POST` | `/auth/login` | JWT credential authentication | Public |
  | `GET` | `/sections` | List 6 corridor track sections | Authenticated |
  | `GET` | `/assets` | Query assets with risk-level filtering and pagination | Authenticated |
  | `GET` | `/assets/{asset_id}` | Detailed asset telemetry and last 10 maintenance records | Authenticated |
  | `GET` | `/maintenance` | Retrieve maintenance task backlog | Authenticated |
  | `GET` | `/traffic/forecast` | 24-hour section traffic forecast with density tier | Authenticated |
  | `POST` | `/predict/urgency` | Trigger real-time ML urgency & health prediction | Authenticated |
  | `POST` | `/schedule/recommend` | Generate optimal block recommendation across candidate windows | Authenticated |
  | `GET` | `/schedule/recommendations`| Retrieve all generated block recommendations | Authenticated |
  | `POST` | `/schedule/{rid}/approve` | Planner approval of recommended block | Planner / Admin |
  | `POST` | `/schedule/{rid}/reject` | Planner rejection of recommended block | Planner / Admin |
  | `POST` | `/feedback` | Post-block actual delay and variance reporting | Authenticated |
  | `GET` | `/analytics` | Corridor KPIs and decision summaries | Authenticated |
  | `GET` | `/model/performance` | Live model validation metrics from saved artifacts | Authenticated |

---

## 6. Machine Learning Architecture (`backend/ml/`)

The predictive intelligence layer comprises two primary machine learning tasks designed to evaluate asset degradation without target leakage, alongside a supplementary traffic density model:

```text
                                 ASSET TELEMETRY
  [Age, Days Since Service, Wear Index, Failures, Freq, Vibration, Geometry, etc.]
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │    ColumnTransformer Feature Pipeline     │
                  │  Numeric: Passthrough                     │
                  │  Categorical: OneHotEncoder (Asset Type,  │
                  │               Section Class)              │
                  └─────────────────────┬─────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
    ┌───────────────────────────────┐       ┌───────────────────────────────┐
    │  MaintenanceUrgencyModel      │       │   HealthRegressionModel       │
    │  GradientBoostingClassifier   │       │   GradientBoostingRegressor   │
    │  (160 estimators, lr=0.05)    │       │   (220 estimators, lr=0.06)   │
    └───────────────┬───────────────┘       └───────────────┬───────────────┘
                    │                                       │
                    ▼                                       ▼
     Failure Probability (0.0–1.0)              Condition Health Score
     Urgency Score (0.0–100.0)                  (Continuous scale 0–100)
```

### 1. Maintenance Urgency Classifier (`urgency_classifier.joblib`)
- **Objective:** Predict whether an asset requires urgent possession planning to prevent critical failure.
- **Supervision Target Definition:** Urgent ($1$) if the asset had a major or critical defect in the prior 180 days, an unresolved open defect, or a deferred maintenance task as of the evaluation cutoff date (`2026-08-01`); Non-Urgent ($0$) otherwise.
- **Leakage Prevention:** The direct defect-severity counters (`critical_defects_180d`, `major_defects_180d`, `open_defects`, `deferred_count`) are strictly excluded from the training feature vector. The model learns exclusively from physical telemetry and operational history:
  - `age_years`
  - `days_since_last_service`
  - `base_wear_index`
  - `historical_failures`
  - `maintenance_frequency_per_year`
  - `vibration_mm_s`
  - `rail_wear_mm`
  - `track_geometry_deviation_mm`
  - `maintenance_count_365d`
  - `emergency_count`
  - `avg_duration_minutes`
  - `asset_type` (One-hot encoded)
  - `section_class` (One-hot encoded)
- **Model Architecture:** Scikit-learn `Pipeline` combining `ColumnTransformer` and `GradientBoostingClassifier` ($160\text{ estimators}$, $\text{learning\_rate}=0.05$, $\text{max\_depth}=2$, $\text{random\_state}=42$).
- **Evaluation Metrics (600 Train / 150 Test Stratified Split):**
  - **Accuracy:** $98.0\%$ ($0.9800$)
  - **Precision:** $93.1\%$ ($0.9310$)
  - **Recall:** $96.4\%$ ($0.9643$)
  - **F1-Score:** $94.7\%$ ($0.9474$)
  - **ROC-AUC:** $99.27\%$ ($0.9927$)

### 2. Asset Health Regression Model (`health_regressor.joblib`)
- **Objective:** Compute a continuous physical condition health index ($0–100$).
- **Architecture:** `GradientBoostingRegressor` ($220\text{ estimators}$, $\text{learning\_rate}=0.06$, $\text{max\_depth}=3$, $\text{random\_state}=42$).
- **Evaluation Metrics:**
  - **$R^2$ Score:** $0.9813$
  - **Mean Absolute Error (MAE):** $1.0375$
- **Clarification:** The health score is a prototype-derived condition score reflecting relative asset wear, not an official statutory Indian Railways safety certificate.

### 3. Traffic Density Classifier (`traffic_level_classifier.joblib`)
- **Objective:** Classify operational train intensity into categorical bands: LOW ($\le 3$), MEDIUM ($4–9$), and HIGH ($>9$) trains per hour.
- **Features:** `hour`, `day_of_week`, `month`, `is_weekend`, `track_section`, `season`.
- **Architecture:** `GradientBoostingClassifier` ($180\text{ estimators}$, $\text{learning\_rate}=0.05$, $\text{max\_depth}=3$).
- **Evaluation Metrics (10,483 Train / 2,621 Test Split):**
  - **Accuracy:** $96.49\%$ ($0.9649$)
- **Clarification:** Train count forecasts displayed in the application originate directly from the supplied canonical goods-train forecast. The classifier serves as a supplementary density categorizer, not as an exact passenger timetable simulation.

---

## 7. Deterministic Scheduling & Optimization Engine (`backend/optimization/`)

Railway block scheduling requires absolute reproducibility, transparency, and explainability. Neural or non-deterministic optimization methods are ill-suited for safety-critical railway dispatching. RAILOPTIMA employs a deterministic multi-criteria optimization algorithm (`optimization_service.py`).

### 1. Candidate Possession Window Generation
For any requested maintenance date and block duration ($D\text{ hours}$, where $1 \le D \le 12$), the engine evaluates candidate start hours covering off-peak, midday, and twilight operations:
$$\mathcal{H} = \{00:00, 02:00, 05:00, 10:00, 13:00, 16:00, 21:00\}$$

### 2. Disruption Estimation Formula
For each candidate window $w \in \mathcal{H}$, the engine queries the forecast average train count $\bar{T}_w$. The estimated disruption in delay minutes is computed as:
$$\text{DisruptionMinutes}(w) = \bar{T}_w \times \delta$$
where $\delta = 3.2\text{ minutes/train}$.
*(Note: $\delta = 3.2$ is a prototype operational assumption that will be calibrated with empirical division-level dispatching logs in production).*

### 3. Multi-Objective Composite Priority Score
The candidate windows are ranked using a composite priority objective that explicitly balances asset safety necessity against passenger/freight delay:
$$\text{PriorityScore}(w) = w_u \cdot U + w_b \cdot \min(B, 60) - w_d \cdot \text{DisruptionMinutes}(w)$$
Where:
- $U \in [0, 100]$: Asset Urgency Score generated by the ML classifier.
- $B \ge 0$: Backlog pressure (days elapsed since last service, capped at 60 days).
- $w_u = 1.6$: Relative weight assigned to asset safety and failure risk.
- $w_b = 0.15$: Relative weight assigned to servicing backlog pressure.
- $w_d = 1.0$: Relative penalty weight assigned to traffic disruption.

### 4. Selection, Delay Reduction & Confidence Scoring
- **Recommended Window ($w^*$):** The candidate window with the highest priority score:
  $$w^* = \arg\max_{w \in \mathcal{H}} \text{PriorityScore}(w)$$
- **Quantified Delay Reduction:** Measures disruption savings compared to the next-best alternative candidate ($w_{\text{alt}}$):
  $$\text{DelayReductionPct} = \max\left(0, \frac{\text{DisruptionMinutes}(w_{\text{alt}}) - \text{DisruptionMinutes}(w^*)}{\text{DisruptionMinutes}(w_{\text{alt}})}\right) \times 100$$
- **Confidence Metric:** Evaluated as a function of the score separation gap from runner-up candidates and traffic variance risk:
  $$\text{ConfidencePct} = \min\left(99.0, 55 + 25 \times \text{SeparationGap} + 20 \times \text{TrafficStability}\right)$$

### 5. Explainability Synthesis
The engine automatically generates an executive natural language explanation outlining the rationale behind the recommendation:
> *"Asset urgency on SEC-001 is 87/100. Failure probability is 87%. Traffic forecast for 02:00–05:00 is 1.8 trains (LOW density). Expected disruption in this window is approximately 6 minutes. This window reduces expected disruption by 54% compared with the next-best window (05:00–08:00, 13 min disruption)."*

---

## 8. Human-in-the-Loop Governance & Audit Trail

```text
  [Optimal Recommendation Generated]
                 │
                 ▼
     [Section Planner Review]
     - Inspects Urgency & Health
     - Inspects Traffic Density & Disruption
     - Compares Alternative Windows
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [Approve Block]   [Reject Block]
        │                 │
        │                 │
        ▼                 ▼
  [Status: APPROVED] [Status: REJECTED]
  Recorded:          Recorded:
  - decided_by       - decided_by
  - decided_at       - decided_at
        │
        ▼
  [Execution Feedback]
  - actual_start_time
  - actual_end_time
  - actual_delay_minutes
  - variance error calculated
        │
        ▼
  [Model Retraining & Calibration Loop]
```

Every block recommendation transitions through a strict lifecycle (`PENDING` $\to$ `APPROVED` / `REJECTED` $\to$ `COMPLETED`). Section planners have full discretion to reject recommendations if unmodeled factors (e.g., VIP special movement, adverse weather) arise.

Post-execution, field engineers log actual block start/end times and observed train delays via the `/feedback` API. The system automatically computes prediction error metrics:
$$\text{PredictionError} = \text{ActualDelayMinutes} - \text{PredictedDisruptionMinutes}$$
This closed-loop feedback provides the exact dataset needed to periodically fine-tune the disruption multiplier $\delta$ and retrain models.

---

## 9. Data Layer & Canonical Ingestion Pipeline (`dataset/`)

The repository integrates 15 canonical tables synthesized from four primary Indian Railways IT data sources:

```text
TMS (Track Management)       ──┐
SMMS (Signal Maintenance)    ──┼──► Canonical 15 Tables ──► Backend SQLite Database
TDMS (Traction Distribution) ──┤    (dataset/canonical_     (railoptima.db)
COA (Control Office App)     ──┘     reference/*.csv)
```

1. **`assets.csv` (750 records):** Unified asset register across 6 sections and 16 asset types.
2. **`sections.csv` (6 records):** Bidirectional corridor sections (`SEC-001` through `SEC-006`).
3. **`inspections.csv` (16,725 records):** Periodic inspection logs with JSON condition measurements.
4. **`defects.csv` (888 records):** Historical minor, major, and critical fault events.
5. **`maintenance_tasks.csv` (6,255 records):** Scheduled, deferred, and emergency work orders.
6. **`maintenance_history.csv` (6,212 records):** Completed servicing logs with duration and status.
7. **`blocks.csv` (5,707 records):** Historical track possession records.
8. **`goods_train_forecast.csv` (13,104 records):** Section-level hourly freight density forecast.
9. **`block_availability.csv` (18 records):** Pre-notified engineering block allowances.
10. **Master Reference Data:** `stations.csv`, `corridors.csv`, `departments.csv`, `asset_types.csv`, `trains.csv`, `train_schedules.csv`.

---

## 10. Local Deployment vs. Production Roadmap

### Local Prototype Architecture (Evaluated Build)
- Backend: Standalone FastAPI process run via Uvicorn on port 8000.
- Frontend: Single-page application run via Vite dev server on port 5173.
- Database: Embedded SQLite file (`railoptima.db`).
- Models: Serialized Joblib pipelines loaded in-process.

### Production Railway Enterprise Architecture
- **Data Ingestion:** Kafka/RabbitMQ message streaming connected to CRIS enterprise buses (COA, TMS, FOIS, ICMS).
- **Compute & API:** Containerized microservices deployed on Kubernetes with automated load balancing.
- **Database:** High-availability PostgreSQL cluster with PostGIS geospatial indexing for track assets.
- **Safety Interlocking:** Integration with Kavach / ETCS Level 2 train protection interfaces to ensure recommended possession windows respect dynamic signal headway constraints.
- **Crew & Machine Logistics:** Solvers (OR-Tools / Mixed-Integer Linear Programming) to incorporate track tamper, OHE wiring car, and crane depot logistics into the possession window ranking.
