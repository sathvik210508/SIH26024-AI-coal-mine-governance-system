import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Contractor(Base):
    __tablename__ = "contractors"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. CON-2026-01
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    department = Column(String(100), nullable=False) # Overburden Removal, Haulage, Electrical Installation, Drilling
    contract_start = Column(Date, nullable=False)
    contract_end = Column(Date, nullable=False)
    status = Column(String(50), default="ACTIVE") # ACTIVE, UNDER_REVIEW, RESTRICTED, SUSPENDED
    
    # Explainable Risk & Compliance Scores
    risk_score = Column(Float, default=18.0) # 0-100
    compliance_score = Column(Float, default=94.0) # 0-100
    risk_tier = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="contractors")
    workers = relationship("ContractorWorker", backref="contractor", cascade="all, delete-orphan")
    documents = relationship("ContractorDocument", backref="contractor", cascade="all, delete-orphan")
    risk_history = relationship("ContractorRiskScore", backref="contractor", cascade="all, delete-orphan")

class ContractorWorker(Base):
    __tablename__ = "contractor_workers"
    
    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    shift = Column(String(50), default="SHIFT_A")
    safety_certification_status = Column(String(50), default="VALID")
    training_status = Column(String(50), default="COMPLETED")
    document_status = Column(String(50), default="VERIFIED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContractorDocument(Base):
    __tablename__ = "contractor_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False) # Labor License, Insurance Policy, Safety Clearance, ESI/PF Registration
    document_number = Column(String(100), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="VALID") # VALID, EXPIRING_SOON, EXPIRED, MISSING
    verification_status = Column(String(50), default="VERIFIED") # VERIFIED, PENDING, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContractorRiskScore(Base):
    __tablename__ = "contractor_risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_tier = Column(String(20), nullable=False)
    contributing_factors = Column(JSON, nullable=True) # list of {factor, score_impact, details}
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)
