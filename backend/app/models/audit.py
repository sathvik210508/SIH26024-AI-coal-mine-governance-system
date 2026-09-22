import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. EVT-2026-000142
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    role_code = Column(String(50), nullable=False)
    
    organization_id = Column(Integer, nullable=True)
    region_id = Column(Integer, nullable=True)
    mine_id = Column(Integer, nullable=True)
    
    entity_name = Column(String(100), nullable=False, index=True) # INSPECTION, VIOLATION, ACTION, EVIDENCE, VERIFICATION, REGULATORY_ACTION, LOGIN
    entity_id = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False) # CREATE, UPDATE, VERIFY, CLOSE, ESCALATE, OCR_CORRECTION, INITIATIVE_START, LOGIN
    
    # Cryptographic Hash Chaining
    previous_hash = Column(String(64), nullable=False) # SHA-256 hex string of previous record
    current_hash = Column(String(64), nullable=False, unique=True, index=True) # SHA-256(prev_hash + timestamp + user + entity + action + metadata)
    
    metadata_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    
    user = relationship("User", backref="audit_logs")

class AuditChainMetadata(Base):
    __tablename__ = "audit_chain_metadata"
    
    id = Column(Integer, primary_key=True)
    genesis_hash = Column(String(64), nullable=False)
    last_block_hash = Column(String(64), nullable=False)
    total_events_count = Column(Integer, default=0)
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    verification_status = Column(String(50), default="HASH_CHAIN_VALID") # HASH_CHAIN_VALID, INTEGRITY_ISSUE_DETECTED
