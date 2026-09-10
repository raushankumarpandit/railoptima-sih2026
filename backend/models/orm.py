from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False)  # admin | planner | engineer
    created_at = Column(DateTime, default=datetime.utcnow)


class TrackSection(Base):
    __tablename__ = "track_sections"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    section_class = Column(String(32), nullable=False)
    zone = Column(String(64), nullable=True)


class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(32), unique=True, index=True, nullable=False)
    track_section = Column(String(32), index=True, nullable=False)
    section_class = Column(String(32), nullable=True)
    asset_type = Column(String(64), nullable=False)
    age_years = Column(Float, nullable=False)
    base_wear_index = Column(Float, nullable=False)
    historical_failures = Column(Integer, default=0)
    maintenance_frequency_per_year = Column(Float, default=2.0)
    last_service_date = Column(String(16), nullable=True)
    days_since_last_service = Column(Float, default=0.0)
    previous_maintenance_outcome = Column(String(32), default="Completed")
    vibration_mm_s = Column(Float, default=0.0)
    rail_wear_mm = Column(Float, default=0.0)
    ultrasonic_flaw_score = Column(Float, default=0.0)
    track_geometry_deviation_mm = Column(Float, default=0.0)
    critical_defects_180d = Column(Integer, default=0)
    major_defects_180d = Column(Integer, default=0)
    open_defects = Column(Integer, default=0)
    maintenance_count_365d = Column(Integer, default=0)
    deferred_count = Column(Integer, default=0)
    emergency_count = Column(Integer, default=0)
    avg_duration_minutes = Column(Float, default=0.0)

    health_score = Column(Float, nullable=True)
    urgency_score = Column(Float, nullable=True)
    failure_probability = Column(Float, nullable=True)
    risk_level = Column(String(16), nullable=True)  # Healthy | Attention | Critical

    maintenance_records = relationship("MaintenanceRecord", back_populates="asset")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(32), unique=True, index=True)
    asset_id = Column(String(32), ForeignKey("assets.asset_id"))
    track_section = Column(String(32))
    maintenance_type = Column(String(64))
    scheduled_date = Column(String(16))
    duration_hours = Column(Float)
    outcome = Column(String(32))

    asset = relationship("Asset", back_populates="maintenance_records")


class TrafficRecord(Base):
    __tablename__ = "traffic_records"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(16), index=True)
    track_section = Column(String(32), index=True)
    hour = Column(Integer)
    day_of_week = Column(Integer)
    is_weekend = Column(Boolean)
    is_holiday = Column(Boolean)
    month = Column(Integer)
    season = Column(String(16))
    scheduled_train_count = Column(Float)
    actual_train_count = Column(Float)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(32), index=True)
    predicted_at = Column(DateTime, default=datetime.utcnow)
    health_score = Column(Float)
    urgency_score = Column(Float)
    failure_probability = Column(Float)
    risk_level = Column(String(16))
    model_version = Column(String(64))


class BlockRecommendation(Base):
    __tablename__ = "block_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    track_section = Column(String(32), index=True)
    asset_id = Column(String(32), index=True, nullable=True)
    maintenance_type = Column(String(64))
    requested_date = Column(String(16))
    duration_hours = Column(Integer)

    recommended_start_hour = Column(Integer)
    recommended_window_label = Column(String(32))
    predicted_traffic = Column(Float)
    disruption_minutes = Column(Float)
    urgency_score = Column(Float)
    failure_probability = Column(Float)
    delay_reduction_pct = Column(Float)
    confidence_pct = Column(Float)
    explanation = Column(Text)
    alternatives_json = Column(Text)  # JSON-serialized list

    status = Column(String(16), default="PENDING")  # PENDING | APPROVED | REJECTED | COMPLETED
    created_by = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String(64), nullable=True)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("block_recommendations.id"))
    actual_start_time = Column(String(32), nullable=True)
    actual_end_time = Column(String(32), nullable=True)
    actual_delay_minutes = Column(Float, nullable=True)
    predicted_disruption_minutes = Column(Float, nullable=True)
    prediction_error_minutes = Column(Float, nullable=True)
    completion_status = Column(String(32), default="COMPLETED")
    unexpected_issues = Column(Text, nullable=True)
    submitted_by = Column(String(64), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)


class ModelMetric(Base):
    __tablename__ = "model_metrics"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(64))
    metrics_json = Column(Text)
    trained_at = Column(String(64))
