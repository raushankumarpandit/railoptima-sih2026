# RAILOPTIMA — Screenshots Index & Submission Media Guide

This directory stores visual captures of the working RAILOPTIMA prototype for the Smart India Hackathon 2026 (Problem Statement: SIH26027) evaluation panel and portfolio documentation.

---

## 1. Directory Purpose

Screenshots in this directory provide judges, reviewers, and technical evaluators with immediate visual proof of the system's operational workflow, UI design quality, and feature completeness without requiring an immediate local build.

---

## 2. Recommended Screenshot Set & Standard Naming Conventions

Capture high-resolution screenshots (1080p recommended, standard 16:9 ratio, clear typography) using the standard filenames below:

| File Name | Corresponding Page / Modal | Recommended View / State to Capture |
|---|---|---|
| `login.png` | Login Portal (`/login`) | Authentication interface displaying role-based access options (`planner`, `admin`, `engineer`). |
| `network-overview.png` | Network Overview (`/` or `/dashboard`) | Corridor map of the Delhi–Ghaziabad route, corridor KPIs, and section health indicators. |
| `asset-intelligence.png` | Asset Intelligence (`/assets`) | Paginated asset condition registry with risk tags (`Critical`, `Attention`, `Healthy`) and search filter. |
| `traffic-forecast.png` | Traffic Forecast (`/traffic`) | 24-hour section traffic density chart showing LOW / MEDIUM / HIGH operational bands. |
| `maintenance-backlog.png` | Maintenance Backlog (`/backlog`) | Prioritized queue of pending tasks, days overdue, and required possession durations. |
| `block-planner.png` | Optimal Block Planner (`/planner`) | Input configuration card showing section, maintenance type, date, and duration selector. |
| `recommendation.png` | Recommendation View (`/planner`) | Recommended possession window card, explanation narrative, disruption savings %, and candidate comparison table. |
| `block-decisions.png` | Block Decisions & Audit (`/blocks`) | Ledger of past recommendations showing approval statuses (`APPROVED`, `REJECTED`), decision timestamps, and reviewer IDs. |
| `system-analytics.png` | System Analytics (`/analytics`) | Live model evaluation cards (Urgency GBDT, Health Regressor, Traffic Density) and operational efficiency KPIs. |

---

## 3. Capture Guidelines for Team Members

When generating screenshots prior to final submission:

1. **Resolution & Scaling:** Capture at standard 1920×1080 or higher with 100% OS browser zoom for maximum text clarity.
2. **Data Consistency:** Use `SEC-001` (Delhi–Shahdara UP) on date `2026-08-01` across all screenshots to maintain narrative consistency.
3. **Format:** Store images as optimized `.png` format with lowercase hyphenated names matching the table above.
4. **Clean State:** Ensure the local backend server is running so that live data (not error states or placeholder loaders) is displayed.
