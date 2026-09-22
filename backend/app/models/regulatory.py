import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class RegulatoryAction(Base):
    __tablename__ = "regulatory_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. REG-2026-0019
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    source_violation_id = Column(Integer, ForeignKey("violations.id", ondelete="SET NULL"), nullable=True)
    source_incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    
    action_type = Column(String(100), nullable=False) # REGULATORY_DIRECTION, COMPLIANCE_NOTICE, CORRECTIVE_DIRECTIVE, INSPECTION_REQUIREMENT, SUSPENSION_NOTICE
    description = Column(Text, nullable=False)
    issued_by = Column(String(255), nullable=False) # Directorate General of Mines Safety (DGMS)
    issued_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    issue_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=False)
    
    # Statuses: ISSUED, ACKNOWLEDGED, IN_PROGRESS, OVERDUE, SUBMITTED_FOR_REVIEW, VERIFIED, CLOSED, ESCALATED
    status = Column(String(50), default="ISSUED", index=True)
    required_evidence = Column(Text, nullable=False)
    submitted_evidence_url = Column(String(500), nullable=True)
    
    verification_notes = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    closure_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="regulatory_actions")
    organization = relationship("Organization", backref="regulatory_actions")
    issuer = relationship("User", foreign_keys=[issued_by_user_id], backref="issued_regulatory_actions")
    verifier = relationship("User", foreign_keys=[verified_by_id], backref="verified_regulatory_actions")

class RegulatoryApplication(Base):
    __tablename__ = "regulatory_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. APP-2026-0008
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    application_type = Column(String(100), nullable=False) # EXPLOSIVE_STORAGE_LICENSE, DEEP_SEAM_EXTRACTION_PERMIT, TAILINGS_POND_EXPANSION, VENTILATION_CIRCUIT_CHANGE
    applicant_name = Column(String(255), nullable=False)
    applicant_designation = Column(String(100), nullable=False)
    submitted_date = Column(Date, default=datetime.date.today)
    
    documents_metadata = Column(JSON, nullable=True)
    description = Column(Text, nullable=False)
    
    # Review workflow: PENDING, UNDER_REVIEW, INFO_REQUESTED, APPROVED, REJECTED
    review_status = Column(String(50), default="PENDING", index=True)
    reviewer_name = Column(String(255), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    decision = Column(String(50), nullable=True) # APPROVED, REJECTED, CONDITIONAL
    decision_date = Column(Date, nullable=True)
    conditions = Column(Text, nullable=True)
    expiry_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="regulatory_applications")
    organization = relationship("Organization", backref="regulatory_applications")
    reviewer = relationship("User", backref="reviewed_applications")
