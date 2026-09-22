import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine, Organization, Region
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction
from app.models.safety import Incident, NearMiss, SafetyObservation
from app.models.contractors import Contractor
from app.models.initiatives import SafetyInitiative, TrainingProgram
from app.models.alerts import Alert, Escalation
from app.auth.jwt import require_roles
from app.services.audit_service import record_audit_event
from app.services.ai_service import detect_recurring_patterns, calculate_mine_risk_score

router = APIRouter(prefix="/corporate", tags=["Corporate Executive Governance"])

corporate_guard = require_roles(["CORPORATE_EXECUTIVE", "GOVERNMENT_REGULATOR"])

class InitiativeCreate(BaseModel):
    title: str
    description: str
    target_mine_ids: Optional[List[int]] = None
    start_date: datetime.date
    end_date: datetime.date
    inspections_target: int = 50
    compliance_target_pct: float = 95.0
    lead_executive_name: str

class CorporateEscalationCreate(BaseModel):
    mine_id: int
    source_type: str
    source_id: str
    severity: str = "HIGH"
    reason: str

@router.get("/dashboard")
def get_corporate_dashboard(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    total_mines = len(mines)
    operational_mines = sum(1 for m in mines if m.status == "OPERATIONAL")
    
    avg_compliance = round(sum(m.compliance_score for m in mines) / max(total_mines, 1), 1)
    avg_risk = round(sum(m.risk_score for m in mines) / max(total_mines, 1), 1)
    
    all_violations = db.query(Violation).filter(Violation.status != "CLOSED").all()
    critical_violations = [v for v in all_violations if v.severity == "CRITICAL"]
    
    all_actions = db.query(CorrectiveAction).filter(CorrectiveAction.status != "CLOSED").all()
    today = datetime.date.today()
    overdue_actions = [a for a in all_actions if a.deadline < today]
    
    incidents = db.query(Incident).order_by(Incident.id.desc()).limit(10).all()
    near_misses = db.query(NearMiss).order_by(NearMiss.id.desc()).limit(10).all()
    
    high_risk_mines = [m for m in mines if m.risk_tier in ["HIGH", "CRITICAL"]]
    contractors = db.query(Contractor).all()
    high_risk_contractors = [c for c in contractors if c.risk_score >= 50.0]
    
    recurring_patterns = detect_recurring_patterns(db)
    initiatives = db.query(SafetyInitiative).filter(SafetyInitiative.status == "ACTIVE").all()
    
    return {
        "metrics": {
            "total_mines": total_mines,
            "operational_mines": operational_mines,
            "mines_under_review": total_mines - operational_mines,
            "overall_compliance": avg_compliance,
            "overall_safety_risk": avg_risk,
            "open_violations": len(all_violations),
            "critical_violations": len(critical_violations),
            "open_corrective_actions": len(all_actions),
            "overdue_corrective_actions": len(overdue_actions),
            "total_incidents": len(incidents),
            "near_misses": len(near_misses),
            "high_risk_mines_count": len(high_risk_mines),
            "high_risk_contractors_count": len(high_risk_contractors),
            "recurring_patterns_count": len(recurring_patterns)
        },
        "high_risk_mines": high_risk_mines,
        "recurring_patterns": recurring_patterns,
        "active_initiatives": initiatives,
        "recent_incidents": incidents[:5],
        "mines_portfolio": mines
    }

@router.get("/mines")
def get_corporate_mines_portfolio(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    result = []
    today = datetime.date.today()
    for m in mines:
        open_v = db.query(Violation).filter(Violation.mine_id == m.id, Violation.status != "CLOSED").count()
        overdue_a = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == m.id, CorrectiveAction.deadline < today, CorrectiveAction.status != "CLOSED").count()
        inc_count = db.query(Incident).filter(Incident.mine_id == m.id).count()
        region_name = db.query(Region.name).filter(Region.id == m.region_id).scalar() or "Region"
        
        result.append({
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "region": region_name,
            "type": m.mine_type,
            "status": m.status,
            "compliance_score": m.compliance_score,
            "risk_score": m.risk_score,
            "risk_tier": m.risk_tier,
            "open_violations": open_v,
            "overdue_actions": overdue_a,
            "incidents_count": inc_count
        })
    return result

@router.get("/comparison")
def get_corporate_comparison(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    """Provides side-by-side comparison across all 6 authorized mines"""
    mines = db.query(Mine).all()
    today = datetime.date.today()
    data = []
    for m in mines:
        open_v = db.query(Violation).filter(Violation.mine_id == m.id, Violation.status != "CLOSED").count()
        overdue_a = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == m.id, CorrectiveAction.deadline < today, CorrectiveAction.status != "CLOSED").count()
        incidents = db.query(Incident).filter(Incident.mine_id == m.id).count()
        near_misses = db.query(NearMiss).filter(NearMiss.mine_id == m.id).count()
        
        data.append({
            "mine_id": m.id,
            "mine_name": m.name,
            "code": m.code,
            "risk_score": m.risk_score,
            "risk_tier": m.risk_tier,
            "compliance_score": m.compliance_score,
            "open_violations": open_v,
            "overdue_actions": overdue_a,
            "incidents": incidents,
            "near_misses": near_misses,
            "safety_index": round(100 - m.risk_score, 1)
        })
    return data

@router.get("/actions")
def get_corporate_actions(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    return db.query(CorrectiveAction).order_by(CorrectiveAction.deadline.asc()).limit(100).all()

@router.post("/actions")
def assign_corporate_action(payload: Dict[str, Any], user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    mine_id = payload.get("mine_id", 1)
    count = db.query(CorrectiveAction).count() + 1
    act_id = f"ACT-2026-{count:04d}"
    
    act = CorrectiveAction(
        action_id=act_id,
        source_type="CORPORATE_DIRECTIVE",
        mine_id=mine_id,
        description=payload.get("description", "Corporate Safety Requirement"),
        assigned_person=payload.get("assigned_person", "Mine Safety Head"),
        department=payload.get("department", "Safety"),
        priority=payload.get("priority", "HIGH"),
        severity=payload.get("severity", "HIGH"),
        deadline=datetime.date.today() + datetime.timedelta(days=14),
        status="ASSIGNED"
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="CORRECTIVE_ACTION",
        entity_id=act_id,
        action="CORPORATE_ASSIGNMENT",
        metadata={"mine_id": mine_id, "priority": act.priority}
    )
    return {
        "id": act.id,
        "action_id": act.action_id,
        "source_type": act.source_type,
        "mine_id": act.mine_id,
        "description": act.description,
        "assigned_person": act.assigned_person,
        "department": act.department,
        "priority": act.priority,
        "severity": act.severity,
        "deadline": str(act.deadline),
        "status": act.status
    }

@router.post("/safety-initiatives")
def create_safety_initiative(
    payload: InitiativeCreate,
    user: User = Depends(corporate_guard),
    db: Session = Depends(get_db)
):
    org_id = user.organization_id or 1
    count = db.query(SafetyInitiative).count() + 1
    init_id = f"INIT-2026-{count:03d}"
    
    initiative = SafetyInitiative(
        initiative_id=init_id,
        title=payload.title,
        description=payload.description,
        scope="ALL_MINES" if not payload.target_mine_ids else "SELECTED_MINES",
        organization_id=org_id,
        target_mine_ids=payload.target_mine_ids,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="ACTIVE",
        inspections_target=payload.inspections_target,
        compliance_target_pct=payload.compliance_target_pct,
        lead_executive_name=payload.lead_executive_name
    )
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="SAFETY_INITIATIVE",
        entity_id=init_id,
        action="CREATE_INITIATIVE",
        metadata={"title": payload.title, "scope": initiative.scope}
    )
    return initiative

@router.get("/initiatives")
def get_safety_initiatives(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    return db.query(SafetyInitiative).all()

@router.get("/contractors")
def get_corporate_contractors(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    return db.query(Contractor).all()

@router.get("/workforce")
def get_corporate_workforce(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    from app.models.workforce import Worker, Attendance
    total_workers = db.query(Worker).count()
    active_workers = db.query(Worker).filter(Worker.status == "ACTIVE").count()
    today = datetime.date.today()
    present_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "PRESENT").count()
    return {
        "total_workers": total_workers,
        "active_workers": active_workers,
        "present_today": present_today,
        "attendance_rate": round((present_today / max(active_workers, 1)) * 100, 1)
    }

@router.get("/training")
def get_corporate_training(user: User = Depends(corporate_guard), db: Session = Depends(get_db)):
    from app.models.initiatives import TrainingProgram, TrainingParticipation
    programs = db.query(TrainingProgram).all()
    participations = db.query(TrainingParticipation).all()
    completed_count = sum(1 for p in participations if p.status == "COMPLETED")
    return {
        "programs": programs,
        "total_enrollments": len(participations),
        "completed_count": completed_count,
        "completion_rate": round((completed_count / max(len(participations), 1)) * 100, 1)
    }
