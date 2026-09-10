# RAILOPTIMA — SIH 2026 Presentation Reference

### AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Project Information

| Parameter | Details |
|---|---|
| **Project Title** | RAILOPTIMA |
| **Problem Statement ID** | SIH26027 |
| **Problem Statement** | AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways |
| **Track** | Software |
| **Theme** | Smart Automation |
| **Category** | Transportation & Logistics |
| **Sponsoring Ministry** | Ministry of Railways |
| **Prototype Scope** | Delhi–Ghaziabad Corridor (28.5 km, 6 sections, 750 assets) |
| **Core Philosophy** | *"AI recommends. The planner decides."* |

---

## 2. Presentation Deck Reference

> [!IMPORTANT]
> **Final presentation file/link to be added before submission.**

*(Please upload your final PPT/PDF presentation file to this directory or link your institutional Google Slides/OneDrive link here prior to submission).*

---

## 3. Executive Slide Outline & Key Talking Points

### Slide 1: Title & Team Credentials
- **Project Name:** RAILOPTIMA — Intelligent Block Scheduling & Asset Intelligence Platform.
- **SIH Problem Statement:** SIH26027 (Ministry of Railways).
- **Team Identity:** Hackathon Team & Affiliation.
- **Core Value Proposition:** Transition Indian Railways from siloed, manual block planning to predictive, data-driven, and disruption-minimizing possession scheduling.

### Slide 2: Problem Statement & Operational Context
- **The Challenge:** Track maintenance demands physical possession ("blocks"), closing railway segments to commercial traffic.
- **Current Operational Friction:**
  - Maintenance requirements (TMS/SMMS/TDMS) and traffic control (COA) operate in isolated departmental silos.
  - Urgent asset degradation risks derailments or speed restrictions if maintenance is deferred.
  - Scheduling blocks during dense traffic corridors causes severe cascade delays and commercial losses.
  - Manual block planning lacks explainability and holistic multi-objective evaluation.
- **Key Need:** An automated, decision-support platform that resolves the trade-off between asset safety urgency and train traffic disruption.

### Slide 3: Proposed Solution — RAILOPTIMA
- **Unified Decision-Support Platform:** Integrates multi-departmental asset condition, defect history, maintenance backlog, and train traffic forecasts.
- **Dual ML Engine:**
  1. *Maintenance Urgency Classifier*: Predicts asset failure probability and urgency from degradation telemetry.
  2. *Traffic Density Classifier*: Classifies section-level operational load to locate optimal possession windows.
- **Deterministic Optimization Engine:** Evaluates candidate possession windows using transparent multi-criteria scoring.
- **Human-in-the-Loop Governance:** Generates explainable recommendations; certified railway section controllers maintain final approval authority.
- **Closed-Loop Feedback:** Captures execution variances, audit trails, and model refinement data.

### Slide 4: System Architecture & Data Flow
- **Data Ingestion:** TMS (Track), SMMS (Signals), TDMS (Traction), COA (Traffic/Blocks).
- **Backend API Layer:** FastAPI + SQLAlchemy ORM with deterministic response caching and role-based security.
- **Analytical & Decision Pipeline:**
  ```text
  Supplied Dataset → Data Layer → Asset / Traffic Intelligence → ML Models →
  Scheduling Engine → Recommended Window → Explainability → Planner Decision → Audit
  ```
- **Modern Web Dashboard:** React 18, TypeScript, Vite, Recharts with high-contrast railway operations UX.

### Slide 5: Machine Learning & Predictive Intelligence
- **Urgency Classifier (`GradientBoostingClassifier`):**
  - Evaluates 13 non-leaky engineered features (wear indices, geometry deviations, vibration, failure frequency, service age).
  - Metrics on supplied test split (600 train / 150 test):
    - **Accuracy:** 98.0%
    - **Precision:** 93.1%
    - **Recall:** 96.4%
    - **F1-Score:** 94.7%
    - **ROC-AUC:** 99.27%
- **Health Regression (`GradientBoostingRegressor`):**
  - Predicts derived asset health index ($0–100$).
  - **$R^2$ Score:** 0.9813 | **MAE:** 1.0375
- **Traffic Density Classifier (`GradientBoostingClassifier`):**
  - Classifies corridor traffic intensity into LOW ($\le 3$), MEDIUM ($4–9$), and HIGH ($>9$) trains/hour.
  - **Accuracy:** 96.49% across 13,104 forecast records.

### Slide 6: Deterministic Scheduling & Optimization
- **Optimization Strategy:**
  - Evaluates candidate possession hours (e.g., `00:00`, `02:00`, `05:00`, `10:00`, `13:00`, `16:00`, `21:00`).
  - Disruption metric: Estimated using transparent prototype factor ($3.2\text{ delay min/train}$).
- **Composite Priority Formulation:**
  $$\text{Priority Score} = 1.6 \times \text{Urgency Score} + 0.15 \times \min(\text{Backlog Days}, 60) - 1.0 \times \text{Disruption Minutes}$$
- **Multi-Window Trade-off:** Automatically quantifies delay reduction percentage relative to alternative possession slots.
- **Explainability Engine:** Generates natural language justification explaining asset risk, traffic impact, and disruption savings.

### Slide 7: Prototype Scope & Data Authenticity
- **Prototype Corridor:** Delhi–Ghaziabad (DLI–GZB), $28.5\text{ km}$, 6 bi-directional track sections (`SEC-001` to `SEC-006`).
- **Canonical Dataset Statistics:**
  - 750 canonical infrastructure assets across Engineering, S&T, and TRD.
  - 16 distinct asset types (points, crossings, rails, track circuits, signals, OHE masts, substations).
  - 16,725 inspection logs, 888 recorded defects, 6,255 maintenance tasks, 5,707 historical blocks.
- **Authenticity Statement:** Built on synthetic, illustrative dataset supplied for SIH evaluation. No proprietary or confidential Indian Railways data used.

### Slide 8: Live Demonstration Highlights
- Role-based login (`planner`, `admin`, `engineer`).
- Real-time interactive corridor map with section-level telemetry.
- Asset condition drilldown with ultrasonic and geometric flaw indicators.
- Traffic density forecasting and low-impact window identification.
- One-click block recommendation generation with candidate window comparison.
- Planner approval workflow, feedback submission, and immutable audit ledger.

### Slide 9: Impact, Feasibility & Business Value
- **Asset Reliability:** Mitigates unexpected in-service failures and emergency possessions by proactively scheduling urgent backlog items.
- **Punctuality Protection:** Avoids peak passenger and freight operational hours, significantly reducing cumulative cascade delays.
- **Inter-Departmental Harmony:** Unifies Engineering, S&T, and Electrical requests onto a single coordinated possession timeline.
- **Accountability:** Full traceability of every block approval, rejection, and operational variance.

### Slide 10: Future Scope & Production Roadmap
- Integration with Indian Railways enterprise systems (FOIS, ICMS, COA, TMS, Kavach/ETCS-2).
- Dynamic real-time timetable disruption propagation and headway conflict resolution.
- Crew, maintenance machine (tamper, crane, wiring train) and material logistics constraints.
- Section-level digital twin and multi-zone deployment across Indian Railways network.

---

## 4. Key Questions & Rebuttal Guidelines for Evaluators

1. **"Does RAILOPTIMA take control away from railway section controllers?"**
   *Answer:* Absolutely not. RAILOPTIMA operates strictly under the philosophy **"AI recommends. The planner decides."** The system computes multi-criteria candidate rankings and presents complete context, but every possession block requires explicit human validation and authorization.

2. **"How does the model avoid data leakage during urgency prediction?"**
   *Answer:* The urgency classifier explicitly excludes direct defect severity counts and deferred task flags from its input features. It predicts urgency strictly from underlying physical attributes, sensor readings, service age, and maintenance frequency.

3. **"How is traffic disruption calculated?"**
   *Answer:* In the prototype, traffic disruption is computed using an illustrative baseline parameter of $3.2\text{ delay minutes per train}$ running during a possession window. In production, this parameter will be calibrated using historic COA operational logs and live train delay modeling.
