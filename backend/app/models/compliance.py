import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class ComplianceItem(Base):
    __tablename__ = "compliance_items"
    
    id = Column(Integer, primary_key=True, index=True)
    compliance_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CMP-2026-003
    category = Column(String(100), nullable=False) # DGMS Regulations, Environmental Clearances, Explosives License, Labor Welfare, Mine Safety Rules
    statutory_body = Column(String(100), nullable=False) # DGMS, CPCB, SPCB, Ministry of Coal, PESO
    requirement = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    applicable_mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    responsible_person = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    
    frequency = Column(String(50), default="MONTHLY") # MONTHLY, QUARTERLY, HALF_YEARLY, ANNUAL, TRIENNIAL
    due_date = Column(Date, nullable=False)
    last_completed = Column(Date, nullable=True)
    next_due = Column(Date, nullable=False)
    
    # Statuses: UPCOMING, DUE_SOON, IN_PROGRESS, OVERDUE, COMPLETED, VERIFIED
    status = Column(String(50), default="UPCOMING", index=True)
    priority = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    
    evidence_file_path = Column(String(500), nullable=True)
    regulatory_reference = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="compliance_items")
    records = relationship("ComplianceRecord", backref="compliance_item", cascade="all, delete-orphan")

class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    compliance_item_id = Column(Integer, ForeignKey("compliance_items.id", ondelete="CASCADE"), nullable=False)
    period = Column(String(50), nullable=False) # e.g. "Q1-2026", "MAR-2026"
    submission_date = Column(Date, nullable=False)
    status = Column(String(50), default="SUBMITTED") # SUBMITTED, APPROVED, REJECTED, EXPIRED
    submitted_by = Column(String(255), nullable=False)
    verification_notes = Column(Text, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
