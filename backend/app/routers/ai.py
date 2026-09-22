from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine
from app.models.ai import AIAnomaly, AIRecurringPattern, AIRecommendation, AIPrediction
from app.auth.jwt import get_current_user
from app.services.ai_service import calculate_mine_risk_score, detect_recurring_patterns, query_role_copilot

router = APIRouter(prefix="/ai", tags=["AI Risk & Intelligence"])

class CopilotQueryRequest(BaseModel):
    query: str

@router.get("/risk")
def get_ai_risk_overview(mine_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if mine_id:
        return calculate_mine_risk_score(db, mine_id)
        
    # Return for all mines if no specific mine
    mines = db.query(Mine).all()
    return [calculate_mine_risk_score(db, m.id) for m in mines]

@router.get("/anomalies")
def get_ai_anomalies(mine_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(AIAnomaly)
    if mine_id:
        q = q.filter(AIAnomaly.mine_id == mine_id)
    return q.order_by(AIAnomaly.detected_at.desc()).all()

@router.get("/recurring-patterns")
def get_ai_recurring_patterns(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return detect_recurring_patterns(db)

@router.get("/recommendations")
def get_ai_recommendations(mine_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(AIRecommendation).filter(AIRecommendation.status == "PENDING")
    if mine_id:
        q = q.filter(AIRecommendation.mine_id == mine_id)
    return q.all()

@router.get("/predictions")
def get_ai_predictions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AIPrediction).order_by(AIPrediction.created_at.desc()).limit(15).all()

@router.post("/copilot")
def ask_ai_copilot(
    payload: CopilotQueryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return query_role_copilot(db=db, user=user, query=payload.query)
