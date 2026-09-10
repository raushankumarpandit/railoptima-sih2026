import { 
  Asset, 
  AnalyticsData, 
  MaintenanceTask, 
  Recommendation, 
  ModelMetricData, 
  TrackSection 
} from './types';

export const API_BASE = localStorage.getItem('railoptima_api') || 'http://localhost:8000';

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('railoptima_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const demoAssets: [string, string, string, number, number, number, 'Critical' | 'Attention' | 'Healthy'][] = [
  ['AST-00042', 'DEL-ALD-042', 'Rail Track', 34, 94, 0.81, 'Critical'],
  ['AST-00117', 'NDLS-GZB-017', 'Point/Switch', 47, 72, 0.58, 'Critical'],
  ['AST-00312', 'BPL-ET-031', 'Signal Unit', 61, 49, 0.31, 'Attention'],
  ['AST-00488', 'HWH-ASN-024', 'Overhead Equipment', 78, 28, 0.12, 'Healthy'],
  ['AST-00720', 'MAS-AJT-018', 'Rail Track', 39, 68, 0.52, 'Attention'],
];

export const canonicalSections = [
  'SEC-001',
  'SEC-002',
  'SEC-003',
  'SEC-004',
  'SEC-005',
  'SEC-006'
];

export const sectionDetails: Record<string, { name: string; type: string; corridor: string }> = {
  'SEC-001': { name: 'Delhi Main – Delhi Shahdara UP', type: 'UP Line', corridor: 'Delhi–Ghaziabad' },
  'SEC-002': { name: 'Delhi Main – Delhi Shahdara DOWN', type: 'DOWN Line', corridor: 'Delhi–Ghaziabad' },
  'SEC-003': { name: 'Delhi Shahdara – Sahibabad UP', type: 'UP Line', corridor: 'Delhi–Ghaziabad' },
  'SEC-004': { name: 'Delhi Shahdara – Sahibabad DOWN', type: 'DOWN Line', corridor: 'Delhi–Ghaziabad' },
  'SEC-005': { name: 'Sahibabad – Ghaziabad UP', type: 'UP Line', corridor: 'Delhi–Ghaziabad' },
  'SEC-006': { name: 'Sahibabad – Ghaziabad DOWN', type: 'DOWN Line', corridor: 'Delhi–Ghaziabad' },
};

export const fallbackAnalytics: AnalyticsData = {
  assets_total: 750,
  critical_assets: 94,
  attention_assets: 186,
  maintenance_backlog: 124,
  average_asset_health: 72.4,
  recommendations_total: 18,
  approved_blocks: 14,
  expected_delay_reduction_pct: 34.8,
  data_mode: 'PROVIDED SYNTHETIC DATASET — Delhi–Ghaziabad corridor MVP',
};

export const fallbackTrafficForecast = Array.from({ length: 24 }, (_, h) => {
  const counts = [2, 1, 1, 1, 2, 6, 14, 18, 15, 11, 10, 11, 12, 11, 10, 11, 13, 17, 16, 12, 9, 6, 4, 3];
  const count = counts[h] ?? 5;
  return {
    hour: h,
    predicted_train_count: count,
    traffic_level: count <= 3 ? 'LOW' : count <= 9 ? 'MEDIUM' : 'HIGH',
    source: 'Canonical reference goods-train forecast',
  };
});

export const fallbackModels: ModelMetricData[] = [
  {
    model_name: 'Maintenance Urgency Classifier',
    algorithm: 'GradientBoostingClassifier (scikit-learn)',
    train_rows: 600,
    test_rows: 150,
    trained_at: '2026-09-09 14:32:10 UTC',
    classification: {
      accuracy: 0.98,
      precision: 0.931,
      recall: 0.964,
      f1_score: 0.947,
      roc_auc: 0.9927,
    },
    feature_importance_pct: {
      vibration_mm_s: 28.4,
      rail_wear_mm: 22.1,
      days_since_last_service: 18.5,
      track_geometry_deviation_mm: 14.2,
      base_wear_index: 9.8,
      age_years: 7.0,
    },
  },
  {
    model_name: 'Asset Health Condition Regressor',
    algorithm: 'GradientBoostingRegressor (scikit-learn)',
    train_rows: 600,
    test_rows: 150,
    trained_at: '2026-09-09 14:32:18 UTC',
    regression: {
      r2: 0.9813,
      mae: 1.0375,
      rmse: 1.6241,
      mape_pct: '2.14%',
    },
  },
  {
    model_name: 'Corridor Traffic Density Classifier',
    algorithm: 'GradientBoostingClassifier (scikit-learn)',
    train_rows: 10483,
    test_rows: 2621,
    trained_at: '2026-09-09 14:32:30 UTC',
    classification: {
      accuracy: 0.9649,
      precision: 0.958,
      recall: 0.961,
      f1_score: 0.959,
      roc_auc: 0.9842,
    },
    derived_traffic_level_accuracy: 0.9649,
  },
];
