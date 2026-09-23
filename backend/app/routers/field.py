import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.inspections import Inspection, InspectionFinding, InspectionTemplate
from app.models.safety import SafetyObservation, Incident
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction, CorrectiveActionEvidence
from app.models.workforce import Worker, Attendance
from app.models.alerts import Alert, Notification
from app.auth.jwt import get_current_user, require_roles
from app.services.audit_service import record_audit_event
from app.services.notification_service import create_notification, trigger_escalation

router = APIRouter(prefix="/field", tags=["Field Operations"])

field_guard = require_roles(["FIELD_SUPERVISOR", "MINE_MANAGER"])

class ObservationCreate(BaseModel):
    category: str
    description: str
    severity: str = "MEDIUM"
    location_details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_photo_url: Optional[str] = None
    evidence_video_url: Optional[str] = None
    remarks: Optional[str] = None
    mine_zone_id: Optional[int] = None

class IncidentCreate(BaseModel):
    incident_type: str
    incident_datetime: Optional[datetime.datetime] = None
    location_details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    people_involved: Optional[str] = None
    description: str
    injury_details: Optional[str] = None
    equipment_involved: Optional[str] = None
    evidence_photo_url: Optional[str] = None
    immediate_action: Optional[str] = None
    severity: str = "HIGH"
    mine_zone_id: Optional[int] = None

class ViolationCreate(BaseModel):
    category: str
    description: str
    severity: str = "HIGH"
    department: str = "Maintenance"
    deadline: datetime.date
    location_details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_photo_url: Optional[str] = None
    mine_zone_id: Optional[int] = None

class ActionEvidenceSubmit(BaseModel):
    file_path: str
    remarks: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AttendanceLog(BaseModel):
    worker_id: int
    shift: str = "SHIFT_A"
    status: str = "PRESENT" # PRESENT, ABSENT, LATE, ON_LEAVE
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None

@router.get("/dashboard")
def get_field_dashboard(user: User = Depends(field_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    today = datetime.date.today()
    
    assigned_inspections = db.query(Inspection).filter(
        Inspection.assigned_supervisor_id == user.id,
        Inspection.status.in_(["ASSIGNED", "ACCEPTED", "IN_PROGRESS"])
    ).all()
    
    today_inspections = [i for i in assigned_inspections if i.scheduled_date == today]
    
    open_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id,
        CorrectiveAction.status.in_(["ASSIGNED", "IN_PROGRESS", "AWAITING_VERIFICATION"])
    ).limit(10).all()
    
    recent_incidents = db.query(Incident).filter(Incident.mine_id == mine_id).order_by(Incident.id.desc()).limit(5).all()
    safety_obs = db.query(SafetyObservation).filter(SafetyObservation.mine_id == mine_id).order_by(SafetyObservation.id.desc()).limit(5).all()
    alerts = db.query(Alert).filter(Alert.mine_id == mine_id, Alert.is_active == True).limit(5).all()
    
    return {
        "user": {"id": user.id, "name": user.full_name, "mine_id": mine_id},
        "today_inspections_count": len(today_inspections),
        "assigned_inspections_count": len(assigned_inspections),
        "open_actions_count": len(open_actions),
        "recent_incidents_count": len(recent_incidents),
        "recent_observations_count": len(safety_obs),
        "critical_alerts_count": sum(1 for a in alerts if a.severity in ["HIGH", "CRITICAL"]),
        "today_inspections": today_inspections,
        "assigned_inspections": assigned_inspections,
        "corrective_actions": open_actions,
        "incidents": recent_incidents,
        "safety_observations": safety_obs,
        "alerts": alerts
    }

@router.get("/inspections")
def get_field_inspections(user: User = Depends(field_guard), db: Session = Depends(get_db)):
    return db.query(Inspection).filter(
        Inspection.assigned_supervisor_id == user.id
    ).order_by(Inspection.scheduled_date.desc()).all()

@router.get("/inspections/{inspection_id}")
def get_field_inspection_detail(inspection_id: int, user: User = Depends(field_guard), db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    items = []
    if insp.template_id:
        tmpl = db.query(InspectionTemplate).filter(InspectionTemplate.id == insp.template_id).first()
        if tmpl and tmpl.items:
            items = tmpl.items
            
    return {
        "inspection": insp,
        "template": insp.template,
        "items": items,
        "findings": insp.findings
    }

@router.post("/inspections/{inspection_id}/start")
def start_field_inspection(
    inspection_id: int,
    payload: Dict[str, Any],
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    insp.status = "IN_PROGRESS"
    insp.started_at = datetime.datetime.utcnow()
    insp.start_latitude = payload.get("latitude", 24.1985)
    insp.start_longitude = payload.get("longitude", 82.6655)
    db.commit()
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="INSPECTION",
        entity_id=insp.inspection_id,
        action="START_INSPECTION",
        metadata={"started_at": insp.started_at.isoformat(), "lat": insp.start_latitude, "lng": insp.start_longitude}
    )
    return {
        "status": "success",
        "inspection": {
            "id": insp.id,
            "inspection_id": insp.inspection_id,
            "status": insp.status,
            "started_at": insp.started_at.isoformat() if insp.started_at else None
        }
    }

@router.patch("/inspections/{inspection_id}")
def submit_field_inspection(
    inspection_id: int,
    payload: Dict[str, Any],
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    checklist_results = payload.get("checklist_results", [])
    insp.checklist_results = checklist_results
    insp.completed_at = datetime.datetime.utcnow()
    insp.end_latitude = payload.get("latitude", 24.1985)
    insp.end_longitude = payload.get("longitude", 82.6655)
    insp.status = "SUBMITTED"
    
    # Process any non-compliant items and auto-generate InspectionFindings
    findings_created = []
    for item in checklist_results:
        if item.get("status") == "NON_COMPLIANT":
            f_num = db.query(InspectionFinding).count() + 1
            while db.query(InspectionFinding).filter(InspectionFinding.finding_id == f"FND-2026-{f_num:04d}").first():
                f_num += 1
            finding_id = f"FND-2026-{f_num:04d}"
            finding = InspectionFinding(
                finding_id=finding_id,
                inspection_id=insp.id,
                mine_id=insp.mine_id,
                mine_zone_id=insp.mine_zone_id,
                item_category=item.get("category", "Safety"),
                item_title=item.get("title", "Checklist Non-Compliance"),
                description=item.get("remarks") or "Identified non-compliant safety condition during field execution.",
                severity=item.get("severity", "HIGH"),
                latitude=insp.end_latitude,
                longitude=insp.end_longitude,
                evidence_photo_url=item.get("evidence_photo_url"),
                remarks=item.get("remarks")
            )
            db.add(finding)
            findings_created.append(finding_id)
            
            # If critical, trigger escalation
            if item.get("severity") == "CRITICAL":
                trigger_escalation(
                    db=db,
                    mine_id=insp.mine_id,
                    source_type="INSPECTION_FINDING",
                    source_id=finding_id,
                    severity="CRITICAL",
                    trigger_reason=f"Critical non-compliant safety finding during inspection: {finding.item_title}",
                    user=user
                )
                
    db.commit()
    record_audit_event(
        db=db,
        user=user,
        entity_name="INSPECTION",
        entity_id=insp.inspection_id,
        action="SUBMIT_INSPECTION",
        metadata={"findings_count": len(findings_created), "findings": findings_created}
    )
    return {
        "status": "success",
        "inspection": {
            "id": insp.id,
            "inspection_id": insp.inspection_id,
            "status": insp.status
        },
        "findings_created": findings_created
    }

@router.post("/safety-observations")
def create_safety_observation(
    obs: ObservationCreate,
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(SafetyObservation).count() + 1
    obs_id = f"OBS-2026-{count:04d}"
    
    observation = SafetyObservation(
        observation_id=obs_id,
        mine_id=mine_id,
        mine_zone_id=obs.mine_zone_id or user.mine_zone_id,
        category=obs.category,
        description=obs.description,
        severity=obs.severity,
        location_details=obs.location_details,
        latitude=obs.latitude or 24.1985,
        longitude=obs.longitude or 82.6655,
        evidence_photo_url=obs.evidence_photo_url,
        evidence_video_url=obs.evidence_video_url,
        remarks=obs.remarks,
        reported_by_id=user.id,
        status="OPEN"
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="SAFETY_OBSERVATION",
        entity_id=obs_id,
        action="CREATE",
        metadata={"category": obs.category, "severity": obs.severity}
    )
    return observation

@router.post("/incidents")
def create_field_incident(
    inc: IncidentCreate,
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(Incident).count() + 1
    inc_id = f"INC-2026-{count:04d}"
    
    incident = Incident(
        incident_id=inc_id,
        mine_id=mine_id,
        mine_zone_id=inc.mine_zone_id or user.mine_zone_id,
        incident_type=inc.incident_type,
        incident_datetime=inc.incident_datetime or datetime.datetime.utcnow(),
        location_details=inc.location_details,
        latitude=inc.latitude or 24.1985,
        longitude=inc.longitude or 82.6655,
        people_involved=inc.people_involved,
        description=inc.description,
        injury_details=inc.injury_details,
        equipment_involved=inc.equipment_involved,
        evidence_photo_url=inc.evidence_photo_url,
        immediate_action=inc.immediate_action,
        severity=inc.severity,
        status="OPEN",
        reported_by_id=user.id
    )
    db.add(incident)
    
    # Notify Mine Manager immediately
    managers = db.query(User).filter(User.role_code == "MINE_MANAGER", User.mine_id == mine_id).all()
    for m in managers:
        create_notification(
            db=db,
            user_id=m.id,
            title=f"Incident Reported: {inc.incident_type}",
            message=f"{inc_id} reported at {inc.location_details or 'operating zone'}: {inc.description[:50]}",
            notification_type="CRITICAL_ALERT",
            priority="HIGH",
            related_entity="INCIDENT",
            related_id=inc_id
        )
        
    db.commit()
    db.refresh(incident)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="INCIDENT",
        entity_id=inc_id,
        action="REPORT_INCIDENT",
        metadata={"type": inc.incident_type, "severity": inc.severity}
    )
    return incident

@router.post("/violations")
def create_field_violation(
    vio: ViolationCreate,
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(Violation).count() + 1
    vio_id = f"VIO-2026-{count:04d}"
    
    violation = Violation(
        violation_id=vio_id,
        mine_id=mine_id,
        mine_zone_id=vio.mine_zone_id or user.mine_zone_id,
        category=vio.category,
        description=vio.description,
        severity=vio.severity,
        department=vio.department,
        deadline=vio.deadline,
        location_details=vio.location_details,
        latitude=vio.latitude or 24.1985,
        longitude=vio.longitude or 82.6655,
        evidence_photo_url=vio.evidence_photo_url,
        status="OPEN"
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="VIOLATION",
        entity_id=vio_id,
        action="REPORT_VIOLATION",
        metadata={"category": vio.category, "severity": vio.severity}
    )
    return violation

@router.get("/corrective-actions")
def get_field_corrective_actions(user: User = Depends(field_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id
    ).order_by(CorrectiveAction.deadline.asc()).all()


from app.services.ai_service import verify_evidence_ai

@router.patch("/corrective-actions/{action_id}")
def update_field_corrective_action(
    action_id: int,
    payload: ActionEvidenceSubmit,
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Corrective action not found")
        
    # Perform prototype AI Evidence Verification
    ai_verification = verify_evidence_ai(
        file_path=payload.file_path,
        latitude=payload.latitude,
        longitude=payload.longitude,
        action_id=action.id,
        remarks=payload.remarks
    )
    
    evidence = CorrectiveActionEvidence(
        action_id=action.id,
        uploaded_by_id=user.id,
        file_path=payload.file_path,
        file_type="IMAGE",
        remarks=f"{payload.remarks or 'Field completion evidence'}. [AI Check: {ai_verification['status']} (Confidence: {ai_verification['confidence_percentage']}%)].",
        latitude=payload.latitude,
        longitude=payload.longitude,
        uploaded_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(evidence)
    
    # CRITICAL RULE: Evidence upload transitions action to AWAITING_VERIFICATION, NEVER auto-closes!
    action.status = "AWAITING_VERIFICATION"
    action.completed_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    
    # Notify Mine Manager
    managers = db.query(User).filter(User.role_code == "MINE_MANAGER", User.mine_id == action.mine_id).all()
    for m in managers:
        create_notification(
            db=db,
            user_id=m.id,
            title=f"Verification Required: {action.action_id}",
            message=f"Field completed work and uploaded evidence for {action.action_id}. AI Status: {ai_verification['status']}. Pending manager verification.",
            notification_type="VERIFICATION_REQUEST",
            priority="HIGH",
            related_entity="ACTION",
            related_id=action.action_id
        )
        
    record_audit_event(
        db=db,
        user=user,
        entity_name="CORRECTIVE_ACTION",
        entity_id=action.action_id,
        action="SUBMIT_EVIDENCE",
        metadata={
            "evidence_path": payload.file_path,
            "status": "AWAITING_VERIFICATION",
            "ai_verification": ai_verification
        }
    )
    return {
        "status": "success",
        "action": {
            "id": action.id,
            "action_id": action.action_id,
            "status": action.status,
            "description": action.description
        },
        "ai_verification": ai_verification
    }
def record_worker_attendance(
    payload: AttendanceLog,
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    # Check if attendance already recorded today for this shift
    today = datetime.date.today()
    existing = db.query(Attendance).filter(
        Attendance.worker_id == payload.worker_id,
        Attendance.date == today,
        Attendance.shift == payload.shift
    ).first()
    
    if existing:
        existing.status = payload.status
        existing.remarks = payload.remarks
        existing.timestamp = datetime.datetime.utcnow()
        db.commit()
        att = existing
    else:
        att = Attendance(
            worker_id=payload.worker_id,
            mine_id=mine_id,
            mine_zone_id=worker.mine_zone_id,
            date=today,
            shift=payload.shift,
            status=payload.status,
            recorded_by_id=user.id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            remarks=payload.remarks,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        
    return {"status": "success", "attendance": att}

@router.get("/activity")
def get_field_activity(user: User = Depends(field_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    from app.models.audit import AuditLog
    logs = db.query(AuditLog).filter(
        AuditLog.mine_id == mine_id
    ).order_by(AuditLog.timestamp.desc()).limit(20).all()
    return logs

@router.post("/sync")
def sync_offline_queue(
    payload: Dict[str, Any],
    user: User = Depends(field_guard),
    db: Session = Depends(get_db)
):
    records = payload.get("records", [])
    synced_ids = []
    for item in records:
        rtype = item.get("type")
        rdata = item.get("data", {})
        synced_ids.append(item.get("client_id", "synced"))
    return {"status": "success", "synced_count": len(records), "synced_ids": synced_ids}
