import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ACT-2026-0142
    
    source_type = Column(String(50), nullable=False) # VIOLATION, INCIDENT, INSPECTION, REGULATORY_DIRECTIVE
    violation_id = Column(Integer, ForeignKey("violations.id", ondelete="SET NULL"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="SET NULL"), nullable=True)
    
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(Text, nullable=False)
    assigned_person = Column(String(255), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    department = Column(String(100), nullable=False)
    
    priority = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    deadline = Column(Date, nullable=False)
    
    # Statuses: OPEN, ASSIGNED, IN_PROGRESS, AWAITING_VERIFICATION, COMPLETED, VERIFIED, CLOSED, OVERDUE, ESCALATED
    # CRITICAL: Evidence upload transitions to AWAITING_VERIFICATION. Evidence upload NEVER auto-closes an action!
    status = Column(String(50), default="ASSIGNED", index=True)
    requires_gov_verification = Column(Boolean, default=False)
    
    is_overdue = Column(Boolean, default=False)
    is_escalated = Column(Boolean, default=False)
    escalation_level = Column(String(50), nullable=True) # MINE_MANAGER, CORPORATE, REGULATOR
    
    completed_at = Column(DateTime, nullable=True)
    closure_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="corrective_actions")
    zone = relationship("MineZone", backref="corrective_actions")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id], backref="assigned_actions")
    evidence_items = relationship("CorrectiveActionEvidence", backref="action", cascade="all, delete-orphan")
    verifications = relationship("CorrectiveActionVerification", backref="action", cascade="all, delete-orphan")

class CorrectiveActionEvidence(Base):
    __tablename__ = "corrective_action_evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("corrective_actions.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="IMAGE") # IMAGE, VIDEO, DOCUMENT
    remarks = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    uploader = relationship("User", backref="uploaded_evidence")

class CorrectiveActionVerification(Base):
    __tablename__ = "corrective_action_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("corrective_actions.id", ondelete="CASCADE"), nullable=False)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_by_role = Column(String(50), nullable=False) # MINE_MANAGER, CORPORATE_EXECUTIVE, GOVERNMENT_REGULATOR
    
    decision = Column(String(50), nullable=False) # ACCEPTED, RETURNED_FOR_CORRECTION
    remarks = Column(Text, nullable=False)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    verifier = relationship("User", backref="action_verifications")
