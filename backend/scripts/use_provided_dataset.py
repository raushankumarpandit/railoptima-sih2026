import os, json, shutil
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, r2_score, mean_absolute_error, mean_squared_error

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.join(os.path.dirname(BASE), 'dataset', 'canonical_reference')
OUT = os.path.join(BASE, 'data')
MODELS = os.path.join(BASE, 'ml', 'saved_models')
CUTOFF = pd.Timestamp('2026-08-01')
os.makedirs(OUT, exist_ok=True); os.makedirs(MODELS, exist_ok=True)

A = pd.read_csv(os.path.join(ROOT,'assets.csv'))
T = pd.read_csv(os.path.join(ROOT,'asset_types.csv'))
S = pd.read_csv(os.path.join(ROOT,'sections.csv'))
I = pd.read_csv(os.path.join(ROOT,'inspections.csv'))
D = pd.read_csv(os.path.join(ROOT,'defects.csv'))
M = pd.read_csv(os.path.join(ROOT,'maintenance_tasks.csv'))
H = pd.read_csv(os.path.join(ROOT,'maintenance_history.csv'))
G = pd.read_csv(os.path.join(ROOT,'goods_train_forecast.csv'))

A = A.merge(T[['asset_type_id','name']], on='asset_type_id', how='left').merge(S[['section_id','line_type','name']].rename(columns={'name':'section_name'}), on='section_id', how='left')
A['asset_type']=A['name']; A['section_class']=A['line_type']
A['installation_date']=pd.to_datetime(A['installation_date']); A['last_inspected_date']=pd.to_datetime(A['last_inspected_date'])
I['inspection_date']=pd.to_datetime(I['inspection_date']); D['detected_date']=pd.to_datetime(D['detected_date']); M['due_date']=pd.to_datetime(M['due_date']); M['planned_start_dt']=pd.to_datetime(M['planned_start']); H['actual_end']=pd.to_datetime(H['actual_end'],errors='coerce')
HT=H.merge(M[['task_id','asset_id','task_type','estimated_duration_minutes']],on='task_id',how='left')
last_service=HT[HT.completion_status.eq('COMPLETED')].groupby('asset_id').actual_end.max()
A['last_service_date']=A.asset_id.map(last_service).fillna(A.last_inspected_date)
A['days_since_last_service']=(CUTOFF-A.last_service_date).dt.days.clip(lower=0)
A['age_years']=((CUTOFF-A.installation_date).dt.days/365.25).round(2)

# Latest condition measurement per asset
rows=[]
for aid,g in I.groupby('asset_id'):
    lm=json.loads(g.sort_values('inspection_date').iloc[-1].condition_measurements)
    def v(k): return float(lm.get(k,0) or 0)
    rows.append([aid,v('wear_index'),v('track_gauge_deviation_mm'),v('voltage_level_v'),v('signal_visibility_m'),v('contact_wire_wear_mm'),v('mast_tilt_degrees'),len(g)])
C=pd.DataFrame(rows,columns=['asset_id','wear_index','gauge_deviation_mm','voltage_level_v','signal_visibility_m','contact_wire_wear_mm','mast_tilt_degrees','inspection_count'])
A=A.merge(C,on='asset_id',how='left')

R=D[D.detected_date.between(CUTOFF-pd.Timedelta(days=180),CUTOFF)]
da=R.groupby('asset_id').agg(historical_failures=('defect_id','count'),critical_defects_180d=('severity_level',lambda s:(s=='CRITICAL').sum()),major_defects_180d=('severity_level',lambda s:(s=='MAJOR').sum()),open_defects=('status',lambda s:s.isin(['OPEN','UNDER_MAINTENANCE']).sum())).reset_index()
A=A.merge(da,on='asset_id',how='left')
MR=M[M.planned_start_dt.between(CUTOFF-pd.Timedelta(days=365),CUTOFF)]
ma=MR.groupby('asset_id').agg(maintenance_count_365d=('task_id','count'),deferred_count=('status',lambda s:(s=='DEFERRED').sum()),emergency_count=('task_type',lambda s:(s=='EMERGENCY').sum()),avg_duration_minutes=('estimated_duration_minutes','mean')).reset_index()
A=A.merge(ma,on='asset_id',how='left')
for c in ['historical_failures','critical_defects_180d','major_defects_180d','open_defects','maintenance_count_365d','deferred_count','emergency_count','avg_duration_minutes']:
    A[c]=A[c].fillna(0)
A['previous_maintenance_outcome']=A.asset_id.map(HT.sort_values('actual_end').groupby('asset_id').completion_status.last()).fillna('NONE')

# Domain-normalized condition indicators for the common API schema.
A['base_wear_index']=np.select([
    A.asset_type.isin(['track','rail','turnout','sleeper']),
    A.asset_type.isin(['OHE','contact wire','mast','cantilever','isolator','feeder','traction substation'])
], [A.wear_index.fillna(0)*100, A.contact_wire_wear_mm.fillna(0)/6*100], default=(100-A.signal_visibility_m.fillna(200).clip(0,200)/2).clip(0,100))
A['vibration_mm_s']=(A.gauge_deviation_mm.abs().fillna(0)*0.25+A.mast_tilt_degrees.fillna(0)*1.5).round(2)
A['rail_wear_mm']=A.contact_wire_wear_mm.fillna(A.wear_index.fillna(0)*6).round(2)
A['ultrasonic_flaw_score']=(A.critical_defects_180d*40+A.major_defects_180d*20+A.open_defects*30).clip(0,100)
A['track_geometry_deviation_mm']=A.gauge_deviation_mm.fillna(0)
A['maintenance_frequency_per_year']=A.maintenance_count_365d

# Historical supervision target, derived only from the supplied maintenance/defect records.
A['urgent_label']=(((A.critical_defects_180d+A.major_defects_180d)>0)|(A.open_defects>0)|(A.deferred_count>0)).astype(int)
A['health_target']=(100-(A.base_wear_index.clip(0,100)*.35+A.ultrasonic_flaw_score*.25+A.days_since_last_service.clip(0,365)/365*100*.15+A.deferred_count.clip(0,5)/5*100*.15+A.emergency_count.clip(0,5)/5*100*.1)).clip(0,100)

# Urgency model deliberately excludes direct target-derived defect-severity counts to reduce leakage.
features=['age_years','days_since_last_service','base_wear_index','historical_failures','maintenance_frequency_per_year','vibration_mm_s','rail_wear_mm','track_geometry_deviation_mm','maintenance_count_365d','emergency_count','avg_duration_minutes','asset_type','section_class']
num=features[:-2]; cat=features[-2:]
X=A[features]; y=A.urgent_label
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
prep=ColumnTransformer([('num','passthrough',num),('cat',OneHotEncoder(handle_unknown='ignore'),cat)])
clf=Pipeline([('prep',prep),('model',GradientBoostingClassifier(n_estimators=160,learning_rate=.05,max_depth=2,random_state=42))])
clf.fit(Xtr,ytr); yp=clf.predict(Xte); pp=clf.predict_proba(Xte)[:,1]
imp=clf.named_steps['model'].feature_importances_; names=clf.named_steps['prep'].get_feature_names_out(); pairs=sorted(zip(names,imp),key=lambda z:z[1],reverse=True)[:12]
metrics={'model_name':'MaintenanceUrgencyModel','algorithm':'GradientBoostingClassifier (sklearn)','trained_at':'2026-09-09','train_rows':len(Xtr),'test_rows':len(Xte),'data_source':'Provided dataset.zip / canonical_reference','dataset_scope':'Delhi–Ghaziabad corridor MVP; synthetic and illustrative per supplied dataset README','target_definition':'Urgent if the asset had a major/critical defect in the prior 180 days, an open defect, or a deferred maintenance task as of 2026-08-01.','classification':{'accuracy':round(accuracy_score(yte,yp),4),'precision':round(precision_score(yte,yp,zero_division=0),4),'recall':round(recall_score(yte,yp,zero_division=0),4),'f1_score':round(f1_score(yte,yp,zero_division=0),4),'roc_auc':round(roc_auc_score(yte,pp),4)},'feature_importance_pct':{k.replace('num__','').replace('cat__',''):round(float(v/imp.sum()*100),2) for k,v in pairs}}
joblib.dump(clf,os.path.join(MODELS,'urgency_classifier.joblib'))

# Health regression uses the same non-leaky feature set and a continuous health target.
Xtr,Xte,ytr,yte=train_test_split(X,A.health_target,test_size=.2,random_state=42)
rprep=ColumnTransformer([('num','passthrough',num),('cat',OneHotEncoder(handle_unknown='ignore'),cat)])
reg=Pipeline([('prep',rprep),('model',GradientBoostingRegressor(n_estimators=220,learning_rate=.06,max_depth=3,random_state=42))])
reg.fit(Xtr,ytr); pr=np.clip(reg.predict(Xte),0,100)
metrics['health_regression']={'r2':round(r2_score(yte,pr),4),'mae':round(mean_absolute_error(yte,pr),4)}
joblib.dump(reg,os.path.join(MODELS,'health_regressor.joblib')); json.dump(metrics,open(os.path.join(MODELS,'urgency_metrics.json'),'w'),indent=2)

# API-ready asset table with predictions from the trained model.
E=A[['asset_id','section_id','section_name','section_class','asset_type','age_years','base_wear_index','historical_failures','maintenance_frequency_per_year','last_service_date','days_since_last_service','previous_maintenance_outcome','vibration_mm_s','rail_wear_mm','ultrasonic_flaw_score','track_geometry_deviation_mm','critical_defects_180d','major_defects_180d','open_defects','maintenance_count_365d','deferred_count','emergency_count','avg_duration_minutes']].copy()
E['failure_probability']=clf.predict_proba(A[features])[:,1]; E['urgency_score']=E.failure_probability*100; E['health_score']=np.clip(reg.predict(A[features]),0,100)
E.to_csv(os.path.join(OUT,'assets.csv'),index=False)
A[['asset_id','vibration_mm_s','rail_wear_mm','ultrasonic_flaw_score','track_geometry_deviation_mm']].to_csv(os.path.join(OUT,'sensor_readings.csv'),index=False)

# Maintenance adapter from supplied canonical maintenance tasks.
HM=M[['task_id','asset_id','section_id','task_type','planned_start','estimated_duration_minutes','status']].merge(S[['section_id','name']].rename(columns={'name':'track_section'}),on='section_id',how='left')
HM=HM.rename(columns={'task_id':'record_id','planned_start':'scheduled_date','estimated_duration_minutes':'duration_minutes'}); HM['maintenance_type']=HM.task_type; HM['duration_hours']=HM.duration_minutes/60
HM[['record_id','asset_id','track_section','maintenance_type','scheduled_date','duration_hours','status']].to_csv(os.path.join(OUT,'maintenance_history.csv'),index=False)

# Traffic uses the supplied goods-train forecast as the operational forecast source.
G['date']=G.forecast_date; dt=pd.to_datetime(G.date); G['track_section']=G.section_id; G['hour']=G.forecast_hour; G['day_of_week']=dt.dt.dayofweek; G['month']=dt.dt.month; G['is_weekend']=(G.day_of_week>=5).astype(int); G['is_holiday']=0; G['season']=np.select([G.month.isin([12,1,2]),G.month.isin([3,4,5,6]),G.month.isin([7,8,9])],['Winter','Summer','Monsoon'],default='Autumn'); G['scheduled_train_count']=G.estimated_goods_trains_count; G['actual_train_count']=G.estimated_goods_trains_count
G[['date','track_section','hour','day_of_week','is_weekend','is_holiday','month','season','scheduled_train_count','actual_train_count']].to_csv(os.path.join(OUT,'train_traffic.csv'),index=False)

# Independent ML traffic-density classifier (LOW/MEDIUM/HIGH) trained from the supplied forecast records.
G['traffic_level']=np.where(G.estimated_goods_trains_count<=3,'LOW',np.where(G.estimated_goods_trains_count<=9,'MEDIUM','HIGH'))
ft=['hour','day_of_week','month','is_weekend','track_section','season']; X=G[ft]; y=G.traffic_level; Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
prep=ColumnTransformer([('num','passthrough',ft[:4]),('cat',OneHotEncoder(handle_unknown='ignore'),ft[4:])]); tclf=Pipeline([('prep',prep),('model',GradientBoostingClassifier(n_estimators=180,learning_rate=.05,max_depth=3,random_state=42))]); tclf.fit(Xtr,ytr); yp=tclf.predict(Xte); prob=tclf.predict_proba(Xte)
traffic_metrics={'model_name':'TrafficDensityLevelModel','algorithm':'GradientBoostingClassifier (sklearn)','trained_at':'2026-09-09','train_rows':len(Xtr),'test_rows':len(Xte),'data_source':'Provided dataset.zip / canonical_reference/goods_train_forecast.csv','target':'traffic level derived from supplied estimated_goods_trains_count (LOW <=3, MEDIUM <=9, HIGH >9)','classification':{'accuracy':round(accuracy_score(yte,yp),4),'precision_macro':round(precision_score(yte,yp,average='macro',zero_division=0),4),'recall_macro':round(recall_score(yte,yp,average='macro',zero_division=0),4),'f1_macro':round(f1_score(yte,yp,average='macro',zero_division=0),4)}}
joblib.dump(tclf,os.path.join(MODELS,'traffic_level_classifier.joblib')); json.dump(traffic_metrics,open(os.path.join(MODELS,'traffic_metrics.json'),'w'),indent=2)
S[['section_id','name','line_type']].to_csv(os.path.join(OUT,'sections.csv'),index=False)
print(json.dumps({'urgency':metrics,'traffic':traffic_metrics,'assets':len(E),'maintenance_tasks':len(HM),'traffic_rows':len(G)},indent=2))
