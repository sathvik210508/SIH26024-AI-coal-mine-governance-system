import hashlib
import json
import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, AuditChainMetadata
from app.models.auth import User

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def get_or_create_chain_metadata(db: Session) -> AuditChainMetadata:
    meta = db.query(AuditChainMetadata).first()
    if not meta:
        meta = AuditChainMetadata(
            genesis_hash=GENESIS_HASH,
            last_block_hash=GENESIS_HASH,
            total_events_count=0,
            verification_status="HASH_CHAIN_VALID"
        )
        db.add(meta)
        db.commit()
        db.refresh(meta)
    return meta

def calculate_block_hash(
    prev_hash: str,
    timestamp: datetime.datetime,
    user_id: Optional[int],
    role_code: str,
    entity_name: str,
    entity_id: str,
    action: str,
    metadata_json: Optional[Dict[str, Any]]
) -> str:
    ts_str = timestamp.isoformat()
    meta_str = json.dumps(metadata_json or {}, sort_keys=True)
    raw_payload = f"{prev_hash}|{ts_str}|{user_id}|{role_code}|{entity_name}|{entity_id}|{action}|{meta_str}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

def record_audit_event(
    db: Session,
    user: Optional[User],
    entity_name: str,
    entity_id: str,
    action: str,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    meta = get_or_create_chain_metadata(db)
    
    # Get previous log hash
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.current_hash if last_log else GENESIS_HASH
    
    now = datetime.datetime.utcnow()
    user_id = user.id if user else None
    user_email = user.email if user else "system@sih26024.gov.in"
    role_code = user.role_code if user else "SYSTEM"
    org_id = user.organization_id if user else None
    mine_id = user.mine_id if user else None
    region_id = user.region_id if user else None
    
    current_hash = calculate_block_hash(
        prev_hash=prev_hash,
        timestamp=now,
        user_id=user_id,
        role_code=role_code,
        entity_name=entity_name,
        entity_id=str(entity_id),
        action=action,
        metadata_json=metadata
    )
    
    event_count = meta.total_events_count + 1
    event_id = f"EVT-2026-{event_count:06d}"
    
    log_entry = AuditLog(
        event_id=event_id,
        timestamp=now,
        user_id=user_id,
        user_email=user_email,
        role_code=role_code,
        organization_id=org_id,
        region_id=region_id,
        mine_id=mine_id,
        entity_name=entity_name,
        entity_id=str(entity_id),
        action=action,
        previous_hash=prev_hash,
        current_hash=current_hash,
        metadata_json=metadata or {},
        ip_address=ip_address or "127.0.0.1"
    )
    db.add(log_entry)
    
    meta.last_block_hash = current_hash
    meta.total_events_count = event_count
    db.commit()
    db.refresh(log_entry)
    return log_entry

def verify_audit_chain(db: Session) -> Dict[str, Any]:
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "status": "HASH_CHAIN_VALID",
            "message": "Audit chain initialized, zero transactions",
            "total_blocks": 0,
            "verified_at": datetime.datetime.utcnow().isoformat()
        }
    
    expected_prev = GENESIS_HASH
    for index, log in enumerate(logs):
        if log.previous_hash != expected_prev:
            return {
                "status": "INTEGRITY_ISSUE_DETECTED",
                "message": f"Hash chain broken at event {log.event_id} (ID: {log.id}). Previous hash mismatch.",
                "broken_event_id": log.event_id,
                "expected_previous_hash": expected_prev,
                "found_previous_hash": log.previous_hash,
                "verified_blocks": index,
                "total_blocks": len(logs),
                "verified_at": datetime.datetime.utcnow().isoformat()
            }
        
        recomputed = calculate_block_hash(
            prev_hash=log.previous_hash,
            timestamp=log.timestamp,
            user_id=log.user_id,
            role_code=log.role_code,
            entity_name=log.entity_name,
            entity_id=log.entity_id,
            action=log.action,
            metadata_json=log.metadata_json
        )
        if recomputed != log.current_hash:
            return {
                "status": "INTEGRITY_ISSUE_DETECTED",
                "message": f"Block hash tampering detected at event {log.event_id} (ID: {log.id}).",
                "broken_event_id": log.event_id,
                "recomputed_hash": recomputed,
                "stored_hash": log.current_hash,
                "verified_blocks": index,
                "total_blocks": len(logs),
                "verified_at": datetime.datetime.utcnow().isoformat()
            }
        expected_prev = log.current_hash
        
    return {
        "status": "HASH_CHAIN_VALID",
        "message": "All cryptographic block hashes and sequential chains verified successfully.",
        "total_blocks": len(logs),
        "latest_block_hash": expected_prev,
        "verified_at": datetime.datetime.utcnow().isoformat()
    }
