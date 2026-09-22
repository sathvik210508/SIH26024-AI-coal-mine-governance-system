import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine, MineZone
from app.models.workforce import Worker, Attendance
from app.models.machinery import Machine, MachineMaintenance, ProductionRecord
from app.models.contractors import Contractor
from app.models.inspections import Inspection, InspectionTemplate, InspectionFinding
from app.models.safety import SafetyObservation, Incident, NearMiss
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction, CorrectiveActionVerification
from app.models.compliance import ComplianceItem, ComplianceRecord
from app.models.documents import Document, DocumentOCRData
from app.models.environment import EnvironmentalReading
from app.models.alerts import Alert
from app.auth.jwt import get_current_user, require_roles, verify_mine_access
from app.services.audit_service import record_audit_event
from app.services.ai_service import calculate_mine_risk_score
from app.services.gis_service import build_mine_gis_layers
from app.services.ocr_service import parse_document_text, audit_missing_documents
from app.services.notification_service import create_notification, trigger_escalation

router = APIRouter(prefix="/mine", tags=["Mine Management"])

mine_guard = require_roles(["MINE_MANAGER", "CORPORATE_EXECUTIVE", "GOVERNMENT_REGULATOR"])

class InspectionCreate(BaseModel):
    template_id: Optional[int] = None
    mine_zone_id: Optional[int] = None
    inspection_type: str = "SAFETY"
    priority: str = "MEDIUM"
    scheduled_date: datetime.date
    assigned_supervisor_id: Optional[int] = None
    instructions: Optional[str] = None
    regulatory_reference: Optional[str] = None

class ViolationFromFinding(BaseModel):
    finding_id: int
    category: str
    description: str
    severity: str = "HIGH"
    department: str = "Maintenance"
    deadline: datetime.date
    responsible_person: Optional[str] = None
    contractor_id: Optional[int] = None

class CorrectiveActionCreate(BaseModel):
    violation_id: Optional[int] = None
    incident_id: Optional[int] = None
    description: str
    assigned_person: str
    assigned_user_id: Optional[int] = None
    department: str
    priority: str = "HIGH"
    severity: str = "HIGH"
    deadline: datetime.date
    requires_gov_verification: bool = False

class ActionVerify(BaseModel):
    decision: str # ACCEPTED, RETURNED_FOR_CORRECTION
    remarks: str

@router.get("/dashboard")
def get_mine_dashboard(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    today = datetime.date.today()
    workers_count = db.query(Worker).filter(Worker.mine_id == mine_id, Worker.status == "ACTIVE").count()
    attendance_today = db.query(Attendance).filter(Attendance.mine_id == mine_id, Attendance.date == today, Attendance.status == "PRESENT").count()
    
    machines = db.query(Machine).filter(Machine.mine_id == mine_id).all()
    active_machines = sum(1 for m in machines if m.status == "OPERATIONAL")
    maintenance_due = sum(1 for m in machines if m.status in ["MAINTENANCE_DUE", "WARNING"])
    
    open_violations = db.query(Violation).filter(Violation.mine_id == mine_id, Violation.status != "CLOSED").all()
    critical_violations = [v for v in open_violations if v.severity == "CRITICAL"]
    
    open_actions = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id, CorrectiveAction.status != "CLOSED").all()
    overdue_actions = [a for a in open_actions if a.deadline < today]
    
    today_inspections = db.query(Inspection).filter(Inspection.mine_id == mine_id, Inspection.scheduled_date == today).all()
    incidents = db.query(Incident).filter(Incident.mine_id == mine_id).order_by(Incident.id.desc()).limit(5).all()
    near_misses = db.query(NearMiss).filter(NearMiss.mine_id == mine_id).order_by(NearMiss.id.desc()).limit(5).all()
    
    env_alerts = db.query(EnvironmentalReading).filter(EnvironmentalReading.mine_id == mine_id, EnvironmentalReading.is_breach == True).order_by(EnvironmentalReading.id.desc()).limit(5).all()
    alerts = db.query(Alert).filter(Alert.mine_id == mine_id, Alert.is_active == True).all()
    
    ai_risk = calculate_mine_risk_score(db, mine_id)
    missing_docs = audit_missing_documents(db, mine_id)
    
    return {
        "mine": {
            "id": mine.id,
            "name": mine.name,
            "code": mine.code,
            "status": mine.status,
            "compliance_score": mine.compliance_score,
            "risk_score": mine.risk_score,
            "risk_tier": mine.risk_tier,
            "manager": mine.manager_name,
            "registration": mine.registration_number
        },
        "metrics": {
            "workers_total": workers_count,
            "workers_present": attendance_today,
            "active_machines": active_machines,
            "maintenance_due_machines": maintenance_due,
            "open_violations": len(open_violations),
            "critical_violations": len(critical_violations),
            "open_actions": len(open_actions),
            "overdue_actions": len(overdue_actions),
            "today_inspections": len(today_inspections),
            "recent_incidents": len(incidents),
            "environmental_alerts": len(env_alerts),
            "missing_documents_count": missing_docs.get("total_missing_flags", 0)
        },
        "ai_risk": ai_risk,
        "recent_incidents": incidents,
        "recent_near_misses": near_misses,
        "open_violations_sample": open_violations[:5],
        "open_actions_sample": open_actions[:5],
        "alerts": alerts
    }

@router.get("/operations")
def get_mine_operations(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    prod = db.query(ProductionRecord).filter(ProductionRecord.mine_id == mine_id).order_by(ProductionRecord.date.desc()).limit(14).all()
    machines = db.query(Machine).filter(Machine.mine_id == mine_id).all()
    zones = db.query(MineZone).filter(MineZone.mine_id == mine_id).all()
    return {"production": prod, "machines": machines, "zones": zones}

@router.get("/workers")
def get_mine_workers(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Worker).filter(Worker.mine_id == mine_id).all()

@router.get("/attendance")
def get_mine_attendance(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    records = db.query(Attendance).filter(Attendance.mine_id == mine_id).order_by(Attendance.date.desc()).limit(100).all()
    workers = db.query(Worker).filter(Worker.mine_id == mine_id).all()
    return {"records": records, "workers": workers}

@router.post("/attendance")
def post_mine_attendance(payload: Dict[str, Any], user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    worker_id = payload.get("worker_id")
    status_val = payload.get("status", "PRESENT")
    shift = payload.get("shift", "SHIFT_A")
    today = datetime.date.today()
    
    att = db.query(Attendance).filter(
        Attendance.worker_id == worker_id,
        Attendance.date == today,
        Attendance.shift == shift
    ).first()
    
    if att:
        att.status = status_val
    else:
        att = Attendance(
            worker_id=worker_id,
            mine_id=mine_id,
            date=today,
            shift=shift,
            status=status_val,
            recorded_by_id=user.id,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(att)
    db.commit()
    return {"status": "success", "attendance": att}

@router.get("/machines")
def get_mine_machines(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    machines = db.query(Machine).filter(Machine.mine_id == mine_id).all()
    return machines

@router.get("/inspections")
def get_mine_inspections(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Inspection).filter(Inspection.mine_id == mine_id).order_by(Inspection.scheduled_date.desc()).all()

@router.post("/inspections")
def create_mine_inspection(
    payload: InspectionCreate,
    user: User = Depends(mine_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(Inspection).count() + 1
    insp_id = f"INSP-2026-{count:04d}"
    
    inspection = Inspection(
        inspection_id=insp_id,
        template_id=payload.template_id,
        mine_id=mine_id,
        mine_zone_id=payload.mine_zone_id,
        inspection_type=payload.inspection_type,
        priority=payload.priority,
        scheduled_date=payload.scheduled_date,
        created_by_role=user.role_code,
        created_by_id=user.id,
        assigned_supervisor_id=payload.assigned_supervisor_id,
        instructions=payload.instructions,
        regulatory_reference=payload.regulatory_reference,
        status="ASSIGNED"
    )
    db.add(inspection)
    
    # Notify assigned supervisor
    if payload.assigned_supervisor_id:
        create_notification(
            db=db,
            user_id=payload.assigned_supervisor_id,
            title=f"New Inspection Assigned: {insp_id}",
            message=f"You have been assigned {payload.inspection_type} inspection scheduled for {payload.scheduled_date}",
            notification_type="ASSIGNMENT",
            priority=payload.priority,
            related_entity="INSPECTION",
            related_id=insp_id
        )
        
    db.commit()
    db.refresh(inspection)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="INSPECTION",
        entity_id=insp_id,
        action="CREATE_INSPECTION",
        metadata={"scheduled_date": str(payload.scheduled_date), "supervisor_id": payload.assigned_supervisor_id}
    )
    return {
        "id": inspection.id,
        "inspection_id": inspection.inspection_id,
        "inspection_type": inspection.inspection_type,
        "priority": inspection.priority,
        "scheduled_date": str(inspection.scheduled_date),
        "status": inspection.status
    }

@router.get("/safety")
def get_mine_safety(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    obs = db.query(SafetyObservation).filter(SafetyObservation.mine_id == mine_id).order_by(SafetyObservation.id.desc()).all()
    inc = db.query(Incident).filter(Incident.mine_id == mine_id).order_by(Incident.id.desc()).all()
    nm = db.query(NearMiss).filter(NearMiss.mine_id == mine_id).order_by(NearMiss.id.desc()).all()
    return {"observations": obs, "incidents": inc, "near_misses": nm}

@router.get("/incidents")
def get_mine_incidents(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Incident).filter(Incident.mine_id == mine_id).order_by(Incident.id.desc()).all()

@router.post("/incidents")
def create_mine_incident(payload: Dict[str, Any], user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    count = db.query(Incident).count() + 1
    inc_id = f"INC-2026-{count:04d}"
    incident = Incident(
        incident_id=inc_id,
        mine_id=mine_id,
        incident_type=payload.get("incident_type", "Dangerous Occurrence"),
        incident_datetime=datetime.datetime.utcnow(),
        description=payload.get("description", ""),
        location_details=payload.get("location_details"),
        severity=payload.get("severity", "HIGH"),
        status="OPEN",
        reported_by_id=user.id
    )
    db.add(incident)
    db.commit()
    return incident

@router.get("/violations")
def get_mine_violations(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Violation).filter(Violation.mine_id == mine_id).order_by(Violation.id.desc()).all()

@router.post("/violations")
def create_mine_violation(
    payload: ViolationFromFinding,
    user: User = Depends(mine_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(Violation).count() + 1
    vio_id = f"VIO-2026-{count:04d}"
    
    violation = Violation(
        violation_id=vio_id,
        mine_id=mine_id,
        finding_id=payload.finding_id,
        category=payload.category,
        description=payload.description,
        severity=payload.severity,
        department=payload.department,
        deadline=payload.deadline,
        responsible_person=payload.responsible_person,
        contractor_id=payload.contractor_id,
        status="OPEN"
    )
    db.add(violation)
    
    # Check if recurring category in this mine
    prior_count = db.query(Violation).filter(Violation.mine_id == mine_id, Violation.category == payload.category).count()
    if prior_count >= 2:
        violation.is_recurring = True
        violation.recurrence_count = prior_count + 1
        
    db.commit()
    db.refresh(violation)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="VIOLATION",
        entity_id=vio_id,
        action="CONVERT_FROM_FINDING",
        metadata={"finding_id": payload.finding_id, "severity": payload.severity}
    )
    return violation

@router.get("/corrective-actions")
def get_mine_corrective_actions(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id).order_by(CorrectiveAction.id.desc()).all()

@router.post("/corrective-actions")
def create_mine_corrective_action(
    payload: CorrectiveActionCreate,
    user: User = Depends(mine_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(CorrectiveAction).count() + 1
    act_id = f"ACT-2026-{count:04d}"
    
    action = CorrectiveAction(
        action_id=act_id,
        source_type="VIOLATION" if payload.violation_id else "INCIDENT",
        violation_id=payload.violation_id,
        incident_id=payload.incident_id,
        mine_id=mine_id,
        description=payload.description,
        assigned_person=payload.assigned_person,
        assigned_user_id=payload.assigned_user_id,
        department=payload.department,
        priority=payload.priority,
        severity=payload.severity,
        deadline=payload.deadline,
        requires_gov_verification=payload.requires_gov_verification,
        status="ASSIGNED"
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="CORRECTIVE_ACTION",
        entity_id=act_id,
        action="CREATE_ACTION",
        metadata={"deadline": str(payload.deadline), "department": payload.department}
    )
    return {
        "id": action.id,
        "action_id": action.action_id,
        "description": action.description,
        "status": action.status,
        "priority": action.priority,
        "deadline": str(action.deadline)
    }

@router.patch("/corrective-actions/{action_id}")
def verify_mine_corrective_action(
    action_id: int,
    payload: ActionVerify,
    user: User = Depends(mine_guard),
    db: Session = Depends(get_db)
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    verification = CorrectiveActionVerification(
        action_id=action.id,
        verified_by_id=user.id,
        verified_by_role=user.role_code,
        decision=payload.decision,
        remarks=payload.remarks,
        verified_at=datetime.datetime.utcnow()
    )
    db.add(verification)
    
    if payload.decision == "ACCEPTED":
        # If government verification is also configured, wait for regulator; otherwise close
        if action.requires_gov_verification and user.role_code != "GOVERNMENT_REGULATOR":
            action.status = "VERIFIED"
        else:
            action.status = "CLOSED"
            action.closure_date = datetime.datetime.utcnow()
    else:
        # Returned for correction
        action.status = "IN_PROGRESS"
        
    db.commit()
    record_audit_event(
        db=db,
        user=user,
        entity_name="CORRECTIVE_ACTION",
        entity_id=action.action_id,
        action="VERIFY_ACTION",
        metadata={"decision": payload.decision, "new_status": action.status}
    )
    return {
        "status": "success",
        "action": {
            "id": action.id,
            "action_id": action.action_id,
            "status": action.status,
            "closure_date": action.closure_date.isoformat() if action.closure_date else None
        },
        "verification": {
            "id": verification.id,
            "decision": verification.decision,
            "remarks": verification.remarks
        }
    }

@router.get("/contractors")
def get_mine_contractors(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Contractor).filter(Contractor.mine_id == mine_id).all()

@router.get("/documents")
def get_mine_documents(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(Document).filter(Document.mine_id == mine_id).order_by(Document.id.desc()).all()

@router.post("/documents")
def upload_mine_document(
    title: str = Form(...),
    category: str = Form(...),
    ocr_text: Optional[str] = Form(None),
    user: User = Depends(mine_guard),
    db: Session = Depends(get_db)
):
    mine_id = user.mine_id or 1
    count = db.query(Document).count() + 1
    doc_id = f"DOC-2026-{count:04d}"
    
    simulated_path = f"/uploads/{doc_id}.pdf"
    ocr_meta = parse_document_text(ocr_text or title, f"{doc_id}.pdf")
    
    doc = Document(
        doc_id=doc_id,
        title=title,
        category=category,
        mine_id=mine_id,
        file_path=simulated_path,
        file_name=f"{doc_id}.pdf",
        issue_date=ocr_meta["issue_date"],
        expiry_date=ocr_meta["expiry_date"],
        uploaded_by_id=user.id,
        status="VALID"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    ocr_rec = DocumentOCRData(
        document_id=doc.id,
        raw_text=ocr_meta["raw_text"],
        doc_number=ocr_meta["doc_number"],
        extracted_issue_date=ocr_meta["issue_date"],
        extracted_expiry_date=ocr_meta["expiry_date"],
        issuing_authority=ocr_meta["issuing_authority"],
        confidence_score=ocr_meta["confidence_score"]
    )
    db.add(ocr_rec)
    db.commit()
    
    record_audit_event(
        db=db,
        user=user,
        entity_name="DOCUMENT",
        entity_id=doc_id,
        action="UPLOAD_AND_OCR",
        metadata={"category": category, "ocr_confidence": ocr_meta["confidence_score"]}
    )
    return {"document": doc, "ocr": ocr_rec}

@router.get("/compliance")
def get_mine_compliance(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return db.query(ComplianceItem).filter(ComplianceItem.applicable_mine_id == mine_id).all()

@router.get("/compliance/calendar")
def get_mine_compliance_calendar(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    items = db.query(ComplianceItem).filter(ComplianceItem.applicable_mine_id == mine_id).all()
    today = datetime.date.today()
    return {
        "due_soon": [i for i in items if today <= i.next_due <= today + datetime.timedelta(days=14)],
        "overdue": [i for i in items if i.next_due < today and i.status != "COMPLETED"],
        "completed": [i for i in items if i.status in ["COMPLETED", "VERIFIED"]],
        "all_items": items
    }

@router.get("/environment")
def get_mine_environment(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    readings = db.query(EnvironmentalReading).filter(EnvironmentalReading.mine_id == mine_id).order_by(EnvironmentalReading.id.desc()).limit(30).all()
    return readings

@router.get("/map")
def get_mine_map(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return build_mine_gis_layers(db, mine_id)

@router.get("/ai-risk")
def get_mine_ai_risk(user: User = Depends(mine_guard), db: Session = Depends(get_db)):
    mine_id = user.mine_id or 1
    return calculate_mine_risk_score(db, mine_id)
