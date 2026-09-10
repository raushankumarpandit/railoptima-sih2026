export interface User {
  username: string;
  full_name: string;
  role: 'planner' | 'admin' | 'engineer' | string;
}

export interface Asset {
  asset_id: string;
  track_section: string;
  section_name?: string;
  section_class?: string;
  asset_type: string;
  age_years?: number;
  base_wear_index?: number;
  historical_failures?: number;
  maintenance_frequency_per_year?: number;
  last_service_date?: string;
  days_since_last_service: number;
  previous_maintenance_outcome?: string;
  health_score: number;
  urgency_score: number;
  failure_probability: number;
  risk_level: 'Critical' | 'Attention' | 'Healthy' | string;
  vibration_mm_s?: number;
  rail_wear_mm?: number;
  ultrasonic_flaw_score?: number;
  track_geometry_deviation_mm?: number;
  critical_defects_180d?: number;
  major_defects_180d?: number;
  open_defects?: number;
  maintenance_count_365d?: number;
  deferred_count?: number;
  emergency_count?: number;
  avg_duration_minutes?: number;
}

export interface TrackSection {
  section_id: string;
  name: string;
  line_type: string;
}

export interface AlternativeWindow {
  window: string;
  start_hour: number;
  duration_hours: number;
  predicted_traffic: number;
  traffic_level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  disruption_minutes: number;
  priority_score: number;
}

export interface Recommendation {
  id: number;
  track_section: string;
  section_name?: string;
  asset_id?: string;
  maintenance_type: string;
  requested_date: string;
  duration_hours: number;
  recommended_window: string;
  recommended_start_hour?: number;
  predicted_traffic: number;
  traffic_level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  disruption_minutes: number;
  urgency_score: number;
  failure_probability: number;
  delay_reduction_pct: number;
  confidence_pct: number;
  explanation: string;
  alternatives?: AlternativeWindow[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | string;
  feature_importance_pct?: Record<string, number>;
}

export interface MaintenanceTask {
  record_id: string;
  asset_id: string;
  track_section: string;
  section_name?: string;
  issue: string;
  urgency: number;
  risk: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  days_since_service: number;
  required_duration: number;
  status: string;
}

export interface ForecastHour {
  hour: number;
  predicted_train_count: number;
  traffic_level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  source?: string;
}

export interface AnalyticsData {
  assets_total: number;
  critical_assets: number;
  attention_assets: number;
  maintenance_backlog: number;
  average_asset_health: number;
  recommendations_total: number;
  approved_blocks: number;
  expected_delay_reduction_pct: number;
  data_mode?: string;
}

export interface ModelMetricData {
  model_name: string;
  algorithm: string;
  train_rows: number;
  test_rows: number;
  trained_at: string;
  classification?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  regression?: {
    r2: number;
    mae: number;
    rmse: number;
    mape_pct: number | string;
  };
  derived_traffic_level_accuracy?: number;
  feature_importance_pct?: Record<string, number>;
}
