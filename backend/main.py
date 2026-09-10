from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, inspect, text
from datetime import datetime
import os, json
import pandas as pd
import joblib
from jose import jwt, JWTError
from backend.database.db import Base, engine, get_db
from backend.models.orm import User, Asset, TrackSection, MaintenanceRecord, Prediction, BlockRecommendation, Feedback, ModelMetric
from backend.optimization.optimization_service import rank_windows, default_candidate_hours

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')
SECRET = os.getenv('RAILOPTIMA_SECRET', 'railoptima-demo-secret-change-me')
ALGO_VERSION = '2026.09-provided-dataset'
DATA_MODE = 'PROVIDED SYNTHETIC DATASET — Delhi–Ghaziabad corridor MVP'

app = FastAPI(title='RAILOPTIMA API', version=ALGO_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173','http://127.0.0.1:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

urgency_model = None
health_model = None
traffic_level_model = None
assets_df = None
traffic_df = None
sections_df = None
maintenance_df = None

class LoginRequest(BaseModel):
    username: str
    password: str

class RecommendationRequest(BaseModel):
    track_section: str
    maintenance_type: str = 'Inspection'
    duration_hours: int = 3
    requested_date: str
    asset_id: str | None = None

class FeedbackRequest(BaseModel):
    recommendation_id: int
    actual_start_time: str | None = None
    actual_end_time: str | None = None
    actual_delay_minutes: float | None = None
    completion_status: str = 'COMPLETED'
    unexpected_issues: str | None = None


def load_models():
    global urgency_model, health_model, traffic_level_model, assets_df, traffic_df, sections_df, maintenance_df
    urgency_model = joblib.load(os.path.join(MODEL_DIR, 'urgency_classifier.joblib'))
    health_model = joblib.load(os.path.join(MODEL_DIR, 'health_regressor.joblib'))
    traffic_level_model = joblib.load(os.path.join(MODEL_DIR, 'traffic_level_classifier.joblib'))
    assets_df = pd.read_csv(os.path.join(DATA_DIR, 'assets.csv'))
    traffic_df = pd.read_csv(os.path.join(DATA_DIR, 'train_traffic.csv'))
    sections_df = pd.read_csv(os.path.join(DATA_DIR, 'sections.csv'))
    maintenance_df = pd.read_csv(os.path.join(DATA_DIR, 'maintenance_history.csv'))


def seed_db():
    # Recreate a legacy demo database whose Asset schema predates the
    # provided-dataset fields. This keeps the demo reproducible.
    inspector = inspect(engine)
    if 'assets' in inspector.get_table_names():
        cols = {c['name'] for c in inspector.get_columns('assets')}
        required = {'critical_defects_180d','major_defects_180d','open_defects','maintenance_count_365d','deferred_count','emergency_count','avg_duration_minutes'}
        if not required.issubset(cols):
            Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        # If an older RAILOPTIMA database is present, rebuild its operational
        # tables so the supplied dataset becomes the source of truth.
        existing = db.query(Asset).count()
        supplied_first = str(assets_df.iloc[0]['asset_id']) if len(assets_df) else None
        if existing and supplied_first and db.query(Asset).filter(Asset.asset_id == supplied_first).count() == 0:
            for model in [Feedback, BlockRecommendation, Prediction, MaintenanceRecord, Asset, TrackSection, ModelMetric]:
                db.query(model).delete()
            db.commit()
        if db.query(User).count() == 0:
            db.add_all([
                User(username='planner', full_name='Operations Planner', hashed_password='planner123', role='planner'),
                User(username='admin', full_name='System Administrator', hashed_password='admin123', role='admin'),
                User(username='engineer', full_name='Maintenance Engineer', hashed_password='engineer123', role='engineer'),
            ])
        if db.query(TrackSection).count() == 0:
            for _, r in sections_df.iterrows():
                db.add(TrackSection(code=r.section_id, section_class=r.line_type, zone='Delhi–Ghaziabad Corridor'))
        if db.query(Asset).count() == 0:
            for _, r in assets_df.iterrows():
                db.add(Asset(
                    asset_id=r.asset_id, track_section=r.track_section, section_class=r.section_class,
                    asset_type=r.asset_type, age_years=float(r.age_years), base_wear_index=float(r.base_wear_index),
                    historical_failures=int(r.historical_failures), maintenance_frequency_per_year=float(r.maintenance_frequency_per_year),
                    last_service_date=str(r.last_service_date)[:16], days_since_last_service=float(r.days_since_last_service),
                    previous_maintenance_outcome=str(r.previous_maintenance_outcome),
                    health_score=float(r.health_score), urgency_score=float(r.urgency_score),
                    failure_probability=float(r.failure_probability),
                    risk_level=('Critical' if r.urgency_score >= 70 else 'Attention' if r.urgency_score >= 40 else 'Healthy'),
                    vibration_mm_s=float(r.vibration_mm_s), rail_wear_mm=float(r.rail_wear_mm),
                    ultrasonic_flaw_score=float(r.ultrasonic_flaw_score), track_geometry_deviation_mm=float(r.track_geometry_deviation_mm),
                    critical_defects_180d=int(r.critical_defects_180d), major_defects_180d=int(r.major_defects_180d),
                    open_defects=int(r.open_defects), maintenance_count_365d=int(r.maintenance_count_365d),
                    deferred_count=int(r.deferred_count), emergency_count=int(r.emergency_count),
                    avg_duration_minutes=float(r.avg_duration_minutes),
                ))
        if db.query(MaintenanceRecord).count() == 0:
            for _, r in maintenance_df.iterrows():
                db.add(MaintenanceRecord(record_id=r.record_id, asset_id=r.asset_id, track_section=r.track_section,
                                         maintenance_type=r.maintenance_type, scheduled_date=str(r.scheduled_date),
                                         duration_hours=float(r.duration_hours), outcome=str(r.status)))
        if db.query(ModelMetric).count() == 0:
            for fn in ['urgency_metrics.json','traffic_metrics.json']:
                p = os.path.join(MODEL_DIR, fn)
                if os.path.exists(p):
                    payload = json.load(open(p, encoding='utf-8'))
                    db.add(ModelMetric(model_name=payload.get('model_name','Model'), metrics_json=json.dumps(payload), trained_at=payload.get('trained_at','')))
        db.commit()
    finally:
        db.close()


def token_for(username, role):
    return jwt.encode({'sub': username, 'role': role}, SECRET, algorithm='HS256')


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(401, 'Authentication required')
    try:
        token = authorization.replace('Bearer ', '')
        data = jwt.decode(token, SECRET, algorithms=['HS256'])
        user = db.query(User).filter(User.username == data.get('sub')).first()
        if not user:
            raise HTTPException(401, 'Invalid user')
        return user
    except JWTError:
        raise HTTPException(401, 'Invalid token')


@app.on_event('startup')
def startup():
    load_models()
    seed_db()

@app.get('/health')
def health():
    return {'status':'ok','service':'RAILOPTIMA API','models_loaded': all(x is not None for x in [urgency_model, health_model, traffic_level_model]), 'data_mode':DATA_MODE}

@app.post('/auth/login')
def login(req: LoginRequest, db: Session=Depends(get_db)):
    user = db.query(User).filter(User.username==req.username, User.hashed_password==req.password).first()
    if not user:
        raise HTTPException(401,'Invalid username or password')
    return {'access_token':token_for(user.username,user.role),'token_type':'bearer','user':{'username':user.username,'full_name':user.full_name,'role':user.role}}

@app.get('/sections')
def sections(user=Depends(current_user)):
    return sections_df.to_dict('records')

@app.get('/assets')
def assets(limit:int=100, risk:str|None=None, db:Session=Depends(get_db), user=Depends(current_user)):
    q = db.query(Asset)
    if risk: q = q.filter(Asset.risk_level==risk)
    rows = q.order_by(Asset.urgency_score.desc()).limit(limit).all()
    return [asset_out(a) for a in rows]

@app.get('/assets/{asset_id}')
def asset_detail(asset_id:str, db:Session=Depends(get_db), user=Depends(current_user)):
    a = db.query(Asset).filter(Asset.asset_id==asset_id).first()
    if not a: raise HTTPException(404,'Asset not found')
    hist = db.query(MaintenanceRecord).filter(MaintenanceRecord.asset_id==asset_id).order_by(MaintenanceRecord.scheduled_date.desc()).limit(10).all()
    return {**asset_out(a), 'maintenance_history':[{'record_id':h.record_id,'type':h.maintenance_type,'date':h.scheduled_date,'duration_hours':h.duration_hours,'outcome':h.outcome} for h in hist]}

def section_name(code):
    r = sections_df[sections_df.section_id == code]
    return str(r.iloc[0].name) if False else (str(r.iloc[0]['name']) if len(r) else code)

def asset_out(a):
    return {'asset_id':a.asset_id,'track_section':a.track_section,'section_name':section_name(a.track_section),'section_class':a.section_class,
            'asset_type':a.asset_type,'age_years':a.age_years,'base_wear_index':a.base_wear_index,'historical_failures':a.historical_failures,
            'maintenance_frequency_per_year':a.maintenance_frequency_per_year,'last_service_date':a.last_service_date,'days_since_last_service':a.days_since_last_service,
            'previous_maintenance_outcome':a.previous_maintenance_outcome,'health_score':a.health_score,'urgency_score':a.urgency_score,
            'failure_probability':a.failure_probability,'risk_level':a.risk_level,'vibration_mm_s':a.vibration_mm_s,'rail_wear_mm':a.rail_wear_mm,
            'ultrasonic_flaw_score':a.ultrasonic_flaw_score,'track_geometry_deviation_mm':a.track_geometry_deviation_mm,
            'critical_defects_180d':a.critical_defects_180d,'major_defects_180d':a.major_defects_180d,'open_defects':a.open_defects,
            'maintenance_count_365d':a.maintenance_count_365d,'deferred_count':a.deferred_count,'emergency_count':a.emergency_count,
            'avg_duration_minutes':a.avg_duration_minutes}

@app.get('/maintenance')
def maintenance(limit:int=100, status:str|None=None, db:Session=Depends(get_db), user=Depends(current_user)):
    q = db.query(MaintenanceRecord).order_by(MaintenanceRecord.scheduled_date.desc())
    if status: q=q.filter(MaintenanceRecord.outcome==status)
    records=q.limit(limit).all(); out=[]
    for m in records:
        a=db.query(Asset).filter(Asset.asset_id==m.asset_id).first()
        if not a: continue
        out.append({'record_id':m.record_id,'asset_id':m.asset_id,'track_section':m.track_section,'section_name':section_name(m.track_section),
                    'issue':m.maintenance_type,'urgency':round(a.urgency_score or 0,1),'risk':a.risk_level,
                    'days_since_service':round(a.days_since_last_service or 0,0),'required_duration':round(m.duration_hours or 0,1),'status':m.outcome})
    return out

@app.get('/traffic/forecast')
def traffic_forecast(section:str, date:str, start_hour:int=0, hours:int=24, user=Depends(current_user)):
    return build_forecast(section,date,start_hour,hours)

def build_forecast(section,date,start_hour,hours):
    dt=pd.Timestamp(date); rows=[]
    for h in range(start_hour, min(start_hour+hours,24)):
        exact=traffic_df[(traffic_df.track_section==section)&(traffic_df.date.astype(str)==str(date))&(traffic_df.hour==h)]
        if len(exact):
            pred=float(exact.iloc[0].actual_train_count)
            source='Provided goods-train forecast'
        else:
            fallback=traffic_df[(traffic_df.track_section==section)&(traffic_df.hour==h)]
            pred=float(fallback.actual_train_count.mean()) if len(fallback) else float(traffic_df[traffic_df.hour==h].actual_train_count.mean())
            source='Historical mean from provided forecast'
        level='LOW' if pred<=3 else 'MEDIUM' if pred<=9 else 'HIGH'
        rows.append({'hour':h,'predicted_train_count':round(pred,2),'traffic_level':level,'source':source})
    return {'section':section,'section_name':section_name(section),'date':date,'forecast':rows,'data_mode':DATA_MODE}

def model_features(a):
    return pd.DataFrame([{
        'age_years':a.age_years,'days_since_last_service':a.days_since_last_service,'base_wear_index':a.base_wear_index,
        'historical_failures':a.historical_failures,'maintenance_frequency_per_year':a.maintenance_frequency_per_year,
        'vibration_mm_s':a.vibration_mm_s,'rail_wear_mm':a.rail_wear_mm,'track_geometry_deviation_mm':a.track_geometry_deviation_mm,
        'maintenance_count_365d':a.maintenance_count_365d,'emergency_count':a.emergency_count,'avg_duration_minutes':a.avg_duration_minutes,
        'asset_type':a.asset_type,'section_class':a.section_class
    }])

@app.post('/predict/urgency')
def predict_urgency(asset_id:str, db:Session=Depends(get_db), user=Depends(current_user)):
    a=db.query(Asset).filter(Asset.asset_id==asset_id).first()
    if not a: raise HTTPException(404,'Asset not found')
    df=model_features(a); pred=int(urgency_model.predict(df)[0]); proba=float(urgency_model.predict_proba(df)[0,1]); health=float(np_clip(health_model.predict(df)[0]))
    urgency=round(proba*100,1); risk='Critical' if urgency>=70 else 'Attention' if urgency>=40 else 'Healthy'
    rec=Prediction(asset_id=asset_id,health_score=health,urgency_score=urgency,failure_probability=proba,risk_level=risk,model_version=ALGO_VERSION); db.add(rec); db.commit()
    return {'asset_id':asset_id,'health_score':round(health,1),'urgency_score':urgency,'failure_probability':round(proba,4),'risk_level':risk,'urgent_class':pred,'model_version':ALGO_VERSION}

def np_clip(v): return max(0,min(100,float(v)))

@app.post('/schedule/recommend')
def schedule_recommend(req:RecommendationRequest, db:Session=Depends(get_db), user=Depends(current_user)):
    if req.duration_hours<1 or req.duration_hours>12: raise HTTPException(400,'Duration must be between 1 and 12 hours')
    asset=None
    if req.asset_id: asset=db.query(Asset).filter(Asset.asset_id==req.asset_id).first()
    if asset is None: asset=db.query(Asset).filter(Asset.track_section==req.track_section).order_by(Asset.urgency_score.desc()).first()
    if not asset: raise HTTPException(404,'No asset found for section')
    pred=predict_urgency(asset.asset_id,db,user)
    def forecaster(section,date,start,duration):
        f=build_forecast(section,date,start,duration)['forecast']; return sum(x['predicted_train_count'] for x in f)/max(1,len(f))
    backlog=float(asset.days_since_last_service or 0)
    rec=rank_windows(req.track_section,req.requested_date,pred['urgency_score'],pred['failure_probability'],req.duration_hours,default_candidate_hours(),forecaster,backlog,feature_importance_pct=feature_importance())
    row=BlockRecommendation(track_section=rec.section,asset_id=asset.asset_id,maintenance_type=req.maintenance_type,requested_date=req.requested_date,duration_hours=req.duration_hours,
        recommended_start_hour=rec.recommended.start_hour,recommended_window_label=rec.recommended.label(),predicted_traffic=rec.recommended.predicted_traffic,disruption_minutes=rec.recommended.disruption_minutes,
        urgency_score=rec.urgency_score,failure_probability=rec.failure_probability,delay_reduction_pct=rec.delay_reduction_pct,confidence_pct=rec.confidence_pct,explanation=rec.explanation,
        alternatives_json=json.dumps([window_dict(w) for w in rec.alternatives]),created_by=user.username)
    db.add(row); db.commit(); db.refresh(row); return recommendation_out(row)

def window_dict(w): return {'window':w.label(),'start_hour':w.start_hour,'duration_hours':w.duration_hours,'predicted_traffic':round(w.predicted_traffic,2),'traffic_level':w.traffic_level(),'disruption_minutes':w.disruption_minutes,'priority_score':w.priority_score}

def feature_importance():
    p=os.path.join(MODEL_DIR,'urgency_metrics.json'); return json.load(open(p,encoding='utf-8')).get('feature_importance_pct',{}) if os.path.exists(p) else {}

@app.get('/schedule/recommendations')
def recommendations(limit:int=50, db:Session=Depends(get_db), user=Depends(current_user)):
    return [recommendation_out(x) for x in db.query(BlockRecommendation).order_by(BlockRecommendation.created_at.desc()).limit(limit).all()]

def recommendation_out(r):
    return {'id':r.id,'track_section':r.track_section,'section_name':section_name(r.track_section),'asset_id':r.asset_id,'maintenance_type':r.maintenance_type,'requested_date':r.requested_date,'duration_hours':r.duration_hours,'recommended_window':r.recommended_window_label,'recommended_start_hour':r.recommended_start_hour,'predicted_traffic':r.predicted_traffic,
            'traffic_level':'LOW' if r.predicted_traffic<=3 else 'MEDIUM' if r.predicted_traffic<=9 else 'HIGH','disruption_minutes':r.disruption_minutes,'urgency_score':r.urgency_score,'failure_probability':r.failure_probability,
            'delay_reduction_pct':r.delay_reduction_pct,'confidence_pct':r.confidence_pct,'explanation':r.explanation,'alternatives':json.loads(r.alternatives_json or '[]'),'status':r.status,'feature_importance_pct':feature_importance()}

@app.post('/schedule/{rid}/approve')
def approve(rid:int, db:Session=Depends(get_db), user=Depends(current_user)):
    if user.role not in ('planner','admin'): raise HTTPException(403,'Planner role required')
    r=db.query(BlockRecommendation).filter(BlockRecommendation.id==rid).first()
    if not r: raise HTTPException(404,'Recommendation not found')
    r.status='APPROVED'; r.decided_at=datetime.utcnow(); r.decided_by=user.username; db.commit(); return recommendation_out(r)

@app.post('/schedule/{rid}/reject')
def reject(rid:int, db:Session=Depends(get_db), user=Depends(current_user)):
    if user.role not in ('planner','admin'): raise HTTPException(403,'Planner role required')
    r=db.query(BlockRecommendation).filter(BlockRecommendation.id==rid).first()
    if not r: raise HTTPException(404,'Recommendation not found')
    r.status='REJECTED'; r.decided_at=datetime.utcnow(); r.decided_by=user.username; db.commit(); return recommendation_out(r)

@app.post('/feedback')
def feedback(req:FeedbackRequest, db:Session=Depends(get_db), user=Depends(current_user)):
    r=db.query(BlockRecommendation).filter(BlockRecommendation.id==req.recommendation_id).first()
    if not r: raise HTTPException(404,'Recommendation not found')
    error=round(req.actual_delay_minutes-r.disruption_minutes,2) if req.actual_delay_minutes is not None else None
    db.add(Feedback(recommendation_id=r.id,actual_start_time=req.actual_start_time,actual_end_time=req.actual_end_time,actual_delay_minutes=req.actual_delay_minutes,predicted_disruption_minutes=r.disruption_minutes,prediction_error_minutes=error,completion_status=req.completion_status,unexpected_issues=req.unexpected_issues,submitted_by=user.username)); r.status='COMPLETED' if req.completion_status=='COMPLETED' else r.status; db.commit(); return {'status':'saved','prediction_error_minutes':error}

@app.get('/analytics')
def analytics(db:Session=Depends(get_db), user=Depends(current_user)):
    total=db.query(Asset).count(); critical=db.query(Asset).filter(Asset.risk_level=='Critical').count(); attention=db.query(Asset).filter(Asset.risk_level=='Attention').count(); backlog=db.query(Asset).filter(Asset.days_since_last_service>180).count(); avg=float(db.query(func.avg(Asset.health_score)).scalar() or 0); recs=db.query(BlockRecommendation).count(); approved=db.query(BlockRecommendation).filter(BlockRecommendation.status=='APPROVED').count()
    return {'assets_total':total,'critical_assets':critical,'attention_assets':attention,'maintenance_backlog':backlog,'average_asset_health':round(avg,1),'recommendations_total':recs,'approved_blocks':approved,'expected_delay_reduction_pct':round(float(db.query(func.avg(BlockRecommendation.delay_reduction_pct)).scalar() or 0),1),'data_mode':DATA_MODE}

@app.get('/model/performance')
def model_performance(db:Session=Depends(get_db), user=Depends(current_user)):
    return [json.loads(x.metrics_json) for x in db.query(ModelMetric).all()]

if __name__=='__main__':
    import uvicorn; uvicorn.run('backend.main:app',host='0.0.0.0',port=8000,reload=False)
