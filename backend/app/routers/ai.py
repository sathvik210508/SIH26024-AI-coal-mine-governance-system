from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine
from app.models.ai import AIAnomaly, AIRecurringPattern, AIRecommendation, AIPrediction
from app.auth.jwt import get_current_user
from app.services.ai_service import (
    calculate_mine_risk_score,
    detect_recurring_patterns,
    query_role_copilot,
    calculate_issue_risk_score,
    get_early_warnings,
    verify_evidence_ai
)

router = APIRouter(prefix="/ai", tags=["AI Risk & Intelligence"])

class CopilotQueryRequest(BaseModel):
    query: str

@router.get("/early-warnings")
def get_ai_early_warnings(
    mine_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns synthesized AI early warning cards with risk score, patterns, and recommended actions"""
    # If user is a MINE_MANAGER, prioritize their mine unless they passed a parameter
    effective_mine_id = mine_id
    if user.role_code == "MINE_MANAGER" and not effective_mine_id:
        effective_mine_id = user.mine_id
    return get_early_warnings(db=db, mine_id=effective_mine_id)

@router.get("/risk-analysis/{entity_type}/{entity_id}")
def get_entity_risk_analysis(
    entity_type: str,
    entity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Provides item-level explainable risk scoring with factor weights and recommended action"""
    if entity_type.lower() in ["violation", "vio"]:
        return calculate_issue_risk_score(db=db, violation_id=entity_id)
    elif entity_type.lower() in ["action", "corrective-action", "act"]:
        return calculate_issue_risk_score(db=db, action_id=entity_id)
    else:
        # Fallback to mine risk
        return calculate_mine_risk_score(db=db, mine_id=entity_id)

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

