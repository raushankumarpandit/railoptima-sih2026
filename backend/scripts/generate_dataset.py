"""
RAILOPTIMA - Synthetic Dataset Generator
=========================================
Generates a statistically realistic (but synthetic/demo) railway dataset for:
  1. Maintenance urgency modelling
  2. Traffic density forecasting

IMPORTANT: This is DEMO / SYNTHETIC data. It is NOT live Indian Railways data.
Correlations are deliberately built in (e.g. old asset + high vibration + long
time-since-service + past failures -> high urgency) so the trained models learn
a real, meaningful signal instead of noise.

Run:
    python3 scripts/generate_dataset.py

Outputs (into ./data/):
    assets.csv
    sensor_readings.csv
    maintenance_history.csv
    train_traffic.csv
    holidays.csv
    timetable.csv
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

RNG_SEED = 42
rng = np.random.default_rng(RNG_SEED)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(OUT_DIR, exist_ok=True)

N_ASSETS = 1200
N_SECTIONS = 24
DAYS_OF_TRAFFIC = 240  # ~8 months of hourly traffic history
SIM_END_DATE = datetime(2026, 9, 1)

ASSET_TYPES = ["Rail Track", "Point/Switch", "Signal Unit", "Overhead Equipment", "Bridge Girder", "Ballast Section"]

SECTION_NAMES = [
    "DEL-ALD-042", "NDLS-GZB-017", "BPL-ET-031", "HWH-ASN-024", "MAS-AJT-018",
    "CSMT-TNA-009", "SBC-BAND-014", "PUNE-DD-022", "LKO-CNB-011", "JP-AII-033",
    "GHY-NJP-027", "ADI-BRC-016", "SC-KZJ-029", "NGP-BSP-013", "PNBE-DNR-021",
    "ERS-CAN-008", "JU-BME-019", "ASN-DHN-026", "TATA-KGP-015", "RNC-CKP-023",
    "BZA-VSKP-020", "MYS-SBC-012", "AGC-GWL-025", "UMB-KLK-030"
][:N_SECTIONS]

SECTION_CLASS = rng.choice(["Trunk-HighDensity", "Trunk-Medium", "Branch-Low"], size=N_SECTIONS, p=[0.35, 0.4, 0.25])


def generate_assets():
    rows = []
    for i in range(N_ASSETS):
        section_idx = rng.integers(0, N_SECTIONS)
        section = SECTION_NAMES[section_idx]
        section_class = SECTION_CLASS[section_idx]

        asset_type = rng.choice(ASSET_TYPES, p=[0.35, 0.15, 0.15, 0.15, 0.10, 0.10])

        # Age: skew towards a realistic aging-infrastructure distribution
        age_years = float(np.clip(rng.gamma(shape=4.0, scale=4.2), 0.5, 45))

        # Base wear increases with age, with noise
        base_wear = np.clip(age_years * rng.uniform(1.4, 2.3) + rng.normal(0, 6), 0, 100)

        # Historical failures correlate with age & wear
        failure_rate_lambda = 0.02 * age_years + 0.015 * base_wear
        historical_failures = int(rng.poisson(max(failure_rate_lambda, 0.05)))

        # Maintenance frequency (times serviced per year) - newer assets often serviced less
        maintenance_frequency = float(np.clip(rng.normal(3.2 - 0.02 * age_years, 0.8), 0.5, 6))

        # Days since last service: assets serviced less frequently and older tend to have longer gaps
        days_since_service = float(np.clip(
            rng.normal(365.0 / max(maintenance_frequency, 0.3) * rng.uniform(0.6, 1.6), 40), 1, 900
        ))

        last_service_date = SIM_END_DATE - timedelta(days=days_since_service)

        # Previous maintenance outcome: worse asset condition -> more likely "Partial"/"Deferred"
        outcome_p = np.clip(0.75 - 0.004 * base_wear, 0.15, 0.9)
        previous_outcome = rng.choice(
            ["Completed", "Partial", "Deferred"],
            p=[outcome_p, (1 - outcome_p) * 0.65, (1 - outcome_p) * 0.35]
        )

        rows.append({
            "asset_id": f"AST-{i:05d}",
            "track_section": section,
            "section_class": section_class,
            "asset_type": asset_type,
            "age_years": round(age_years, 2),
            "base_wear_index": round(base_wear, 2),
            "historical_failures": historical_failures,
            "maintenance_frequency_per_year": round(maintenance_frequency, 2),
            "last_service_date": last_service_date.strftime("%Y-%m-%d"),
            "days_since_last_service": round(days_since_service, 1),
            "previous_maintenance_outcome": previous_outcome,
        })
    return pd.DataFrame(rows)


def generate_sensor_readings(assets_df: pd.DataFrame):
    """One latest sensor snapshot per asset, correlated with age/wear/days-since-service."""
    rows = []
    for _, a in assets_df.iterrows():
        wear_pressure = (
            0.5 * a["base_wear_index"]
            + 0.03 * a["days_since_last_service"]
            + 3.0 * a["historical_failures"]
        )

        vibration_mm_s = float(np.clip(rng.normal(2.0 + 0.05 * wear_pressure, 1.2), 0.1, 25))
        rail_wear_mm = float(np.clip(rng.normal(1.0 + 0.02 * wear_pressure, 0.6), 0.0, 14))
        ultrasonic_flaw_score = float(np.clip(rng.normal(0.15 * wear_pressure / 10 + rng.uniform(0, 5), 3), 0, 100))
        track_geometry_deviation_mm = float(np.clip(rng.normal(1.5 + 0.015 * wear_pressure, 1.0), 0, 20))
        temperature_c = float(np.clip(rng.normal(32, 6), 5, 50))

        rows.append({
            "asset_id": a["asset_id"],
            "vibration_mm_s": round(vibration_mm_s, 3),
            "rail_wear_mm": round(rail_wear_mm, 3),
            "ultrasonic_flaw_score": round(ultrasonic_flaw_score, 2),
            "track_geometry_deviation_mm": round(track_geometry_deviation_mm, 3),
            "ambient_temperature_c": round(temperature_c, 1),
        })
    return pd.DataFrame(rows)


def compute_ground_truth_urgency(assets_df, sensors_df):
    """
    Builds a *ground-truth* continuous risk score from domain-weighted features,
    then derives a binary 'needs_urgent_maintenance' label + a health score.
    This is the mechanism used to make the synthetic labels causally related to
    the input features (not random), so a trained model has real signal to learn.
    """
    df = assets_df.merge(sensors_df, on="asset_id")

    # Normalize sub-scores to comparable 0-100 ranges
    age_score = np.clip(df["age_years"] / 45 * 100, 0, 100)
    wear_score = df["base_wear_index"]
    days_score = np.clip(df["days_since_last_service"] / 900 * 100, 0, 100)
    vib_score = np.clip(df["vibration_mm_s"] / 25 * 100, 0, 100)
    rail_wear_score = np.clip(df["rail_wear_mm"] / 14 * 100, 0, 100)
    flaw_score = df["ultrasonic_flaw_score"]
    fail_score = np.clip(df["historical_failures"] * 12, 0, 100)
    outcome_penalty = df["previous_maintenance_outcome"].map(
        {"Completed": 0, "Partial": 12, "Deferred": 25}
    ).astype(float)

    # Domain-informed weighted composite (mirrors the feature-importance story in the UI)
    risk_index = (
        0.24 * rail_wear_score
        + 0.20 * days_score
        + 0.16 * vib_score
        + 0.14 * age_score
        + 0.12 * flaw_score
        + 0.09 * fail_score
        + 0.05 * outcome_penalty
    )

    noise = rng.normal(0, 2.0, size=len(df))
    risk_index = np.clip(risk_index + noise, 0, 100)

    health_score = np.clip(100 - risk_index, 0, 100)
    failure_probability = np.clip(risk_index / 100 * rng.uniform(0.85, 1.05, size=len(df)), 0, 1)

    # Binary label: top ~35% risk -> urgent (keeps classes reasonably balanced, not trivial)
    threshold = np.percentile(risk_index, 65)
    needs_urgent_maintenance = (risk_index >= threshold).astype(int)

    df["risk_index"] = np.round(risk_index, 2)
    df["health_score"] = np.round(health_score, 2)
    df["failure_probability"] = np.round(failure_probability, 4)
    df["needs_urgent_maintenance"] = needs_urgent_maintenance
    return df


def generate_maintenance_history(urgency_df: pd.DataFrame):
    rows = []
    record_id = 0
    for _, a in urgency_df.iterrows():
        n_records = int(rng.integers(1, 5))
        base_date = datetime.strptime(a["last_service_date"], "%Y-%m-%d")
        for k in range(n_records):
            record_date = base_date - timedelta(days=int(rng.integers(30, 400)) * (k + 1))
            duration_hours = float(np.clip(rng.normal(3 + a["risk_index"] / 40, 1), 1, 10))
            outcome = rng.choice(["Completed", "Partial", "Deferred"], p=[0.72, 0.19, 0.09])
            rows.append({
                "record_id": f"MR-{record_id:06d}",
                "asset_id": a["asset_id"],
                "track_section": a["track_section"],
                "maintenance_type": rng.choice(
                    ["Rail Grinding", "Inspection", "Replacement", "Tamping", "Signal Calibration", "Ballast Renewal"]
                ),
                "scheduled_date": record_date.strftime("%Y-%m-%d"),
                "duration_hours": round(duration_hours, 1),
                "outcome": outcome,
            })
            record_id += 1
    return pd.DataFrame(rows)


def generate_holidays():
    holidays_2026 = [
        "2026-01-26", "2026-03-14", "2026-04-14", "2026-05-01", "2026-08-15",
        "2026-08-28", "2026-10-02", "2026-10-20", "2026-11-08", "2026-12-25",
    ]
    return pd.DataFrame({"date": holidays_2026, "name": [
        "Republic Day", "Holi", "Ambedkar Jayanti", "Labour Day", "Independence Day",
        "Raksha Bandhan", "Gandhi Jayanti", "Dussehra", "Diwali", "Christmas"
    ]})


def generate_timetable():
    """Static scheduled-train-count baseline per section per hour (weekday), used as a
    deterministic seasonal component that generate_train_traffic perturbs."""
    rows = []
    for section, cls in zip(SECTION_NAMES, SECTION_CLASS):
        if cls == "Trunk-HighDensity":
            base_curve = [2, 1, 1, 1, 2, 6, 14, 18, 15, 11, 10, 11, 12, 11, 10, 11, 13, 17, 16, 12, 9, 6, 4, 3]
        elif cls == "Trunk-Medium":
            base_curve = [1, 1, 0, 0, 1, 3, 8, 10, 9, 6, 6, 6, 7, 6, 6, 6, 8, 10, 9, 7, 5, 3, 2, 1]
        else:
            base_curve = [0, 0, 0, 0, 0, 1, 3, 4, 3, 2, 2, 2, 3, 2, 2, 2, 3, 4, 3, 2, 1, 1, 0, 0]
        for hour, count in enumerate(base_curve):
            rows.append({"track_section": section, "hour": hour, "scheduled_train_count": count})
    return pd.DataFrame(rows)


def generate_train_traffic(timetable_df: pd.DataFrame, holidays_df: pd.DataFrame):
    holiday_set = set(holidays_df["date"].tolist())
    start_date = SIM_END_DATE - timedelta(days=DAYS_OF_TRAFFIC)
    rows = []
    tt_lookup = {(r["track_section"], r["hour"]): r["scheduled_train_count"] for _, r in timetable_df.iterrows()}

    for day_offset in range(DAYS_OF_TRAFFIC):
        current_date = start_date + timedelta(days=day_offset)
        dow = current_date.weekday()  # 0=Mon
        is_weekend = 1 if dow >= 5 else 0
        is_holiday = 1 if current_date.strftime("%Y-%m-%d") in holiday_set else 0
        month = current_date.month
        season = (
            "Winter" if month in (12, 1, 2) else
            "Summer" if month in (3, 4, 5, 6) else
            "Monsoon" if month in (7, 8, 9) else "Autumn"
        )

        for section in SECTION_NAMES:
            for hour in range(24):
                base = tt_lookup.get((section, hour), 2)
                weekend_factor = 0.65 if is_weekend else 1.0
                holiday_factor = 0.55 if is_holiday else 1.0
                monsoon_factor = 0.85 if season == "Monsoon" else 1.0
                noise = rng.normal(1.0, 0.12)

                predicted = base * weekend_factor * holiday_factor * monsoon_factor * noise
                actual_count = max(0, int(round(predicted)))

                rows.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "track_section": section,
                    "hour": hour,
                    "day_of_week": dow,
                    "is_weekend": is_weekend,
                    "is_holiday": is_holiday,
                    "month": month,
                    "season": season,
                    "scheduled_train_count": base,
                    "actual_train_count": actual_count,
                })
    return pd.DataFrame(rows)


def main():
    print("Generating assets...")
    assets_df = generate_assets()

    print("Generating sensor readings...")
    sensors_df = generate_sensor_readings(assets_df)

    print("Computing ground-truth urgency (causally linked to features)...")
    urgency_df = compute_ground_truth_urgency(assets_df, sensors_df)

    print("Generating maintenance history...")
    history_df = generate_maintenance_history(urgency_df)

    print("Generating holidays + timetable + traffic...")
    holidays_df = generate_holidays()
    timetable_df = generate_timetable()
    traffic_df = generate_train_traffic(timetable_df, holidays_df)

    assets_out = urgency_df[[
        "asset_id", "track_section", "section_class", "asset_type", "age_years",
        "base_wear_index", "historical_failures", "maintenance_frequency_per_year",
        "last_service_date", "days_since_last_service", "previous_maintenance_outcome",
        "health_score", "risk_index", "failure_probability", "needs_urgent_maintenance",
    ]]
    assets_out.to_csv(os.path.join(OUT_DIR, "assets.csv"), index=False)
    sensors_df.to_csv(os.path.join(OUT_DIR, "sensor_readings.csv"), index=False)
    history_df.to_csv(os.path.join(OUT_DIR, "maintenance_history.csv"), index=False)
    holidays_df.to_csv(os.path.join(OUT_DIR, "holidays.csv"), index=False)
    timetable_df.to_csv(os.path.join(OUT_DIR, "timetable.csv"), index=False)
    traffic_df.to_csv(os.path.join(OUT_DIR, "train_traffic.csv"), index=False)

    print(f"Done. Wrote {len(assets_out)} assets, {len(history_df)} maintenance records, "
          f"{len(traffic_df)} traffic rows to {OUT_DIR}")
    print(f"Urgent-maintenance class balance: {assets_out['needs_urgent_maintenance'].mean():.1%} positive")


if __name__ == "__main__":
    main()
