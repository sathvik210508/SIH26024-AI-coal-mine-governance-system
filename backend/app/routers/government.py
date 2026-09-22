import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine, Organization, Region
from app.models.regulatory import RegulatoryAction, RegulatoryApplication
from app.models.inspections import Inspection
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction, CorrectiveActionVerification
from app.models.safety import Incident, IncidentInvestigation
from app.auth.jwt import require_roles
from app.services.audit_service import record_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/government", tags=["Government Regulatory Authority"])

gov_guard = require_roles(["GOVERNMENT_REGULATOR"])

class RegulatoryActionCreate(BaseModel):
    mine_id: int
    organization_id: int
    source_violation_id: Optional[int] = None
    source_incident_id: Optional[int] = None
    action_type: str = "REGULATORY_DIRECTION"
    description: str
    deadline: datetime.date
    required_evidence: str

class RegulatoryInvestigationCreate(BaseModel):
    incident_id: int
    lead_investigator_name: str
    investigator_team: Optional[str] = None
    start_date: datetime.date
    findings: Optional[str] = None
    root_contributing_factors: Optional[str] = None
    preventive_recommendations: Optional[str] = None

class ApplicationDecision(BaseModel):
    decision: str # APPROVED, REJECTED, CONDITIONAL
    conditions: Optional[str] = None
    expiry_date: Optional[datetime.date] = None

class ActionVerificationReview(BaseModel):
    decision: str # ACCEPTED, RETURNED_FOR_CORRECTION
    remarks: str

@router.get("/dashboard")
def get_government_dashboard(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    orgs = db.query(Organization).all()
    regions = db.query(Region).all()
    
    total_mines = len(mines)
    operational_mines = sum(1 for m in mines if m.status == "OPERATIONAL")
    
    reg_actions = db.query(RegulatoryAction).all()
    open_reg_actions = [a for a in reg_actions if a.status not in ["VERIFIED", "CLOSED"]]
    today = datetime.date.today()
    overdue_reg_actions = [a for a in open_reg_actions if a.deadline < today]
    
    critical_violations = db.query(Violation).filter(Violation.severity == "CRITICAL", Violation.status != "CLOSED").all()
    open_violations = db.query(Violation).filter(Violation.status != "CLOSED").all()
    
    incidents = db.query(Incident).order_by(Incident.id.desc()).limit(15).all()
    investigations = db.query(IncidentInvestigation).all()
    
    high_risk_mines = [m for m in mines if m.risk_tier in ["HIGH", "CRITICAL"]]
    
    applications = db.query(RegulatoryApplication).filter(RegulatoryApplication.review_status == "PENDING").all()
    
    return {
        "metrics": {
            "registered_mines": total_mines,
            "operational_mines": operational_mines,
            "monitored_organizations": len(orgs),
            "jurisdiction_regions": len(regions),
            "national_compliance_avg": round(sum(m.compliance_score for m in mines)/max(total_mines,1), 1),
            "open_regulatory_actions": len(open_reg_actions),
            "overdue_regulatory_actions": len(overdue_reg_actions),
            "critical_violations": len(critical_violations),
            "total_open_violations": len(open_violations),
            "total_incidents": len(incidents),
            "active_investigations": sum(1 for i in investigations if i.status != "CLOSED"),
            "high_risk_mines_count": len(high_risk_mines),
            "pending_applications_count": len(applications)
        },
        "high_risk_mines": high_risk_mines,
        "recent_incidents": incidents[:5],
        "regulatory_actions": reg_actions[:5],
        "pending_applications": applications
    }

@router.get("/mines")
def get_government_mines(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    result = []
    today = datetime.date.today()
    for m in mines:
        reg_actions_count = db.query(RegulatoryAction).filter(RegulatoryAction.mine_id == m.id, RegulatoryAction.status != "CLOSED").count()
        crit_v = db.query(Violation).filter(Violation.mine_id == m.id, Violation.severity == "CRITICAL", Violation.status != "CLOSED").count()
        org_name = db.query(Organization.name).filter(Organization.id == m.organization_id).scalar() or "Org"
        region_name = db.query(Region.name).filter(Region.id == m.region_id).scalar() or "Region"
        
        result.append({
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "organization": org_name,
            "region": region_name,
            "type": m.mine_type,
            "status": m.status,
            "registration": m.registration_number,
            "compliance_score": m.compliance_score,
            "risk_score": m.risk_score,
            "risk_tier": m.risk_tier,
            "critical_violations": crit_v,
            "open_regulatory_actions": reg_actions_count,
            "latitude": m.latitude,
            "longitude": m.longitude
        })
    return result

@router.get("/mines/{mine_id}")
def get_government_mine_detail(mine_id: int, user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    violations = db.query(Violation).filter(Violation.mine_id == mine_id).all()
    actions = db.query(RegulatoryAction).filter(RegulatoryAction.mine_id == mine_id).all()
    incidents = db.query(Incident).filter(Incident.mine_id == mine_id).all()
    
    return {
        "mine": mine,
        "organization": mine.organization,
        "region": mine.region,
        "violations": violations,
        "regulatory_actions": actions,
        "incidents": incidents
    }

@router.get("/regions")
def get_government_regions(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    regions = db.query(Region).all()
    data = []
    for r in regions:
        mines = db.query(Mine).filter(Mine.region_id == r.id).all()
        avg_comp = round(sum(m.compliance_score for m in mines) / max(len(mines), 1), 1)
        avg_risk = round(sum(m.risk_score for m in mines) / max(len(mines), 1), 1)
        data.append({
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "state": r.state,
            "jurisdiction": r.jurisdiction_code,
            "mines_count": len(mines),
            "average_compliance": avg_comp,
            "average_risk": avg_risk
        })
    return data

@router.get("/organizations")
def get_government_organizations(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    orgs = db.query(Organization).all()
    return orgs

@router.get("/inspections")
def get_government_inspections(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(Inspection).filter(Inspection.created_by_role == "GOVERNMENT_REGULATOR").all()

@router.post("/inspections")
def create_regulatory_inspection(payload: Dict[str, Any], user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    count = db.query(Inspection).count() + 1
    insp_id = f"REG-INSP-2026-{count:04d}"
    mine_id = payload.get("mine_id", 1)
    
    inspection = Inspection(
        inspection_id=insp_id,
        mine_id=mine_id,
        inspection_type="REGULATORY",
        priority="CRITICAL",
        scheduled_date=datetime.date.today(),
        created_by_role="GOVERNMENT_REGULATOR",
        created_by_id=user.id,
        instructions=payload.get("instructions", "Statutory inspection under DGMS Coal Mines Regulations 2017"),
        regulatory_reference=payload.get("regulatory_reference", "DGMS Section 22/3"),
        status="ASSIGNED"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="INSPECTION",
        entity_id=insp_id,
        action="REGULATORY_INSPECTION_ORDERED",
        metadata={"mine_id": mine_id}
    )
    return inspection

@router.get("/incidents")
def get_government_incidents(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.id.desc()).all()

@router.get("/investigations")
def get_government_investigations(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(IncidentInvestigation).all()

@router.post("/investigations")
def create_government_investigation(
    payload: RegulatoryInvestigationCreate,
    user: User = Depends(gov_guard),
    db: Session = Depends(get_db)
):
    count = db.query(IncidentInvestigation).count() + 1
    inv_id = f"INV-2026-{count:04d}"
    
    investigation = IncidentInvestigation(
        investigation_id=inv_id,
        incident_id=payload.incident_id,
        investigating_authority="REGULATORY_DGMS",
        lead_investigator_name=payload.lead_investigator_name,
        investigator_team=payload.investigator_team,
        start_date=payload.start_date,
        status="OPEN",
        findings=payload.findings,
        root_contributing_factors=payload.root_contributing_factors,
        preventive_recommendations=payload.preventive_recommendations
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="INVESTIGATION",
        entity_id=inv_id,
        action="OPEN_STATUTORY_INVESTIGATION",
        metadata={"incident_id": payload.incident_id, "investigator": payload.lead_investigator_name}
    )
    return investigation

@router.get("/violations")
def get_government_violations(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(Violation).order_by(Violation.id.desc()).all()

@router.get("/regulatory-actions")
def get_regulatory_actions(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(RegulatoryAction).order_by(RegulatoryAction.id.desc()).all()

@router.post("/regulatory-actions")
def issue_regulatory_action(
    payload: RegulatoryActionCreate,
    user: User = Depends(gov_guard),
    db: Session = Depends(get_db)
):
    count = db.query(RegulatoryAction).count() + 1
    act_id = f"REG-2026-{count:04d}"
    
    reg_action = RegulatoryAction(
        action_id=act_id,
        mine_id=payload.mine_id,
        organization_id=payload.organization_id,
        source_violation_id=payload.source_violation_id,
        source_incident_id=payload.source_incident_id,
        action_type=payload.action_type,
        description=payload.description,
        issued_by="Directorate General of Mines Safety (DGMS)",
        issued_by_user_id=user.id,
        issue_date=datetime.date.today(),
        deadline=payload.deadline,
        required_evidence=payload.required_evidence,
        status="ISSUED"
    )
    db.add(reg_action)
    db.commit()
    db.refresh(reg_action)
    
    # Notify mine manager & corporate
    mine = db.query(Mine).filter(Mine.id == payload.mine_id).first()
    managers = db.query(User).filter(User.role_code == "MINE_MANAGER", User.mine_id == payload.mine_id).all()
    for m in managers:
        create_notification(
            db=db,
            user_id=m.id,
            title=f"Statutory Notice Issued: {act_id}",
            message=f"Regulatory Action {act_id} issued by DGMS: {payload.description[:50]}",
            notification_type="CRITICAL_ALERT",
            priority="CRITICAL",
            related_entity="REGULATORY_ACTION",
            related_id=act_id
        )
        
    record_audit_event(
        db=db,
        user=user,
        entity_name="REGULATORY_ACTION",
        entity_id=act_id,
        action="ISSUE_DIRECTIVE",
        metadata={"mine_id": payload.mine_id, "action_type": payload.action_type}
    )
    return {
        "id": reg_action.id,
        "action_id": reg_action.action_id,
        "mine_id": reg_action.mine_id,
        "organization_id": reg_action.organization_id,
        "action_type": reg_action.action_type,
        "description": reg_action.description,
        "issued_by": reg_action.issued_by,
        "issue_date": str(reg_action.issue_date),
        "deadline": str(reg_action.deadline),
        "required_evidence": reg_action.required_evidence,
        "status": reg_action.status
    }

@router.get("/corrective-actions")
def get_gov_corrective_actions(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    """Returns actions that require government/statutory verification"""
    return db.query(CorrectiveAction).filter(
        CorrectiveAction.status.in_(["AWAITING_VERIFICATION", "VERIFIED", "ASSIGNED"])
    ).all()

@router.post("/corrective-actions/{action_id}/verify")
def verify_gov_corrective_action(
    action_id: int,
    payload: ActionVerificationReview,
    user: User = Depends(gov_guard),
    db: Session = Depends(get_db)
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    verification = CorrectiveActionVerification(
        action_id=action.id,
        verified_by_id=user.id,
        verified_by_role="GOVERNMENT_REGULATOR",
        decision=payload.decision,
        remarks=payload.remarks,
        verified_at=datetime.datetime.utcnow()
    )
    db.add(verification)
    
    if payload.decision == "ACCEPTED":
        action.status = "CLOSED"
        action.closure_date = datetime.datetime.utcnow()
    else:
        action.status = "IN_PROGRESS"
        
    db.commit()
    record_audit_event(
        db=db,
        user=user,
        entity_name="CORRECTIVE_ACTION",
        entity_id=action.action_id,
        action="STATUTORY_VERIFICATION",
        metadata={"decision": payload.decision, "final_status": action.status}
    )
    return {"status": "success", "action": action, "verification": verification}

@router.get("/applications")
def get_regulatory_applications(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    return db.query(RegulatoryApplication).all()

@router.patch("/applications/{application_id}")
def decide_regulatory_application(
    application_id: int,
    payload: ApplicationDecision,
    user: User = Depends(gov_guard),
    db: Session = Depends(get_db)
):
    app = db.query(RegulatoryApplication).filter(RegulatoryApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.review_status = "APPROVED" if payload.decision == "APPROVED" else "REJECTED"
    app.decision = payload.decision
    app.decision_date = datetime.date.today()
    app.conditions = payload.conditions
    app.expiry_date = payload.expiry_date
    app.reviewer_name = user.full_name
    app.reviewer_id = user.id
    db.commit()
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="REGULATORY_APPLICATION",
        entity_id=app.application_id,
        action="DECIDE_PERMIT",
        metadata={"decision": payload.decision, "conditions": payload.conditions}
    )
    return app

@router.get("/risk-map")
def get_national_risk_map(user: User = Depends(gov_guard), db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    features = []
    for m in mines:
        open_v = db.query(Violation).filter(Violation.mine_id == m.id, Violation.status != "CLOSED").count()
        crit_v = db.query(Violation).filter(Violation.mine_id == m.id, Violation.severity == "CRITICAL", Violation.status != "CLOSED").count()
        org_name = db.query(Organization.name).filter(Organization.id == m.organization_id).scalar() or "Org"
        features.append({
            "id": m.id,
            "name": m.name,
            "organization": org_name,
            "coordinates": [m.latitude, m.longitude],
            "risk_score": m.risk_score,
            "risk_tier": m.risk_tier,
            "compliance_score": m.compliance_score,
            "open_violations": open_v,
            "critical_violations": crit_v
        })
    return {"mines": features, "jurisdiction": "National / Regional Directorate"}
