from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.audit import AuditLog, AuditChainMetadata
from app.auth.jwt import get_current_user
from app.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Trail"])

@router.get("/logs")
def get_audit_logs(
    entity_name: Optional[str] = None,
    mine_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if entity_name:
        q = q.filter(AuditLog.entity_name == entity_name)
    if mine_id and user.role_code == "MINE_MANAGER":
        q = q.filter(AuditLog.mine_id == mine_id)
        
    total = q.count()
    logs = q.order_by(AuditLog.id.desc()).offset(offset).limit(limit).all()
    return {"total": total, "logs": logs}

@router.get("/verify")
def verify_hash_chain(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Walks the entire SHA-256 cryptographic chain and verifies mathematical integrity"""
    verification_result = verify_audit_chain(db)
    return verification_result
