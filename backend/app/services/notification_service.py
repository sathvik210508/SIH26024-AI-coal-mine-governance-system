import datetime
import json
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.alerts import Alert, Notification, Escalation
from app.models.auth import User
from app.services.audit_service import record_audit_event

# In-memory pub-sub queues for SSE connections
event_subscribers: List[asyncio.Queue] = []

async def broadcast_event(event_type: str, data: Dict[str, Any]):
    message = json.dumps({"event": event_type, "data": data, "timestamp": datetime.datetime.utcnow().isoformat()})
    for queue in list(event_subscribers):
        try:
            await queue.put(message)
        except Exception:
            event_subscribers.remove(queue)

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "INFO",
    priority: str = "MEDIUM",
    related_entity: Optional[str] = None,
    related_id: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        related_entity=related_entity,
        related_id=related_id,
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def trigger_escalation(
    db: Session,
    mine_id: int,
    source_type: str,
    source_id: str,
    severity: str,
    trigger_reason: str,
    user: Optional[User] = None
) -> Escalation:
    # Determine escalation target
    if severity == "CRITICAL":
        from_role = "MINE_MANAGER"
        to_role = "GOVERNMENT_REGULATOR"
    elif severity == "HIGH":
        from_role = "MINE_MANAGER"
        to_role = "CORPORATE_EXECUTIVE"
    else:
        from_role = "FIELD_SUPERVISOR"
        to_role = "MINE_MANAGER"
        
    esc_count = db.query(Escalation).count() + 1
    esc_id = f"ESC-2026-{esc_count:04d}"
    
    escalation = Escalation(
        escalation_id=esc_id,
        mine_id=mine_id,
        source_type=source_type,
        source_id=source_id,
        from_role=from_role,
        to_role=to_role,
        trigger_reason=trigger_reason,
        status="TRIGGERED",
        escalated_at=datetime.datetime.utcnow()
    )
    db.add(escalation)
    
    # Notify target users by role
    target_users = db.query(User).filter(User.role_code == to_role).all()
    for u in target_users:
        create_notification(
            db=db,
            user_id=u.id,
            title=f"System Escalation: {trigger_reason[:45]}...",
            message=f"Escalation {esc_id} triggered for {source_type} {source_id} due to {trigger_reason}",
            notification_type="ESCALATION",
            priority="CRITICAL" if severity == "CRITICAL" else "HIGH",
            related_entity=source_type,
            related_id=source_id
        )
        
    # Create audit event
    record_audit_event(
        db=db,
        user=user,
        entity_name="ESCALATION",
        entity_id=esc_id,
        action="ESCALATE",
        metadata={
            "source_type": source_type,
            "source_id": source_id,
            "severity": severity,
            "to_role": to_role,
            "reason": trigger_reason
        }
    )
    
    db.commit()
    db.refresh(escalation)
    return escalation
