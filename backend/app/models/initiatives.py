import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class SafetyInitiative(Base):
    __tablename__ = "safety_initiatives"
    
    id = Column(Integer, primary_key=True, index=True)
    initiative_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. INIT-2026-004
    title = Column(String(255), nullable=False) # e.g. "Zero Electrical Hazard Campaign"
    description = Column(Text, nullable=False)
    
    scope = Column(String(50), default="ALL_MINES") # ALL_MINES, DIVISION, SELECTED_MINES
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    target_mine_ids = Column(JSON, nullable=True) # list of mine ids
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="ACTIVE") # ACTIVE, COMPLETED, ON_HOLD
    
    # Progress & KPIs
    inspections_target = Column(Integer, default=50)
    inspections_completed = Column(Integer, default=0)
    violations_resolved = Column(Integer, default=0)
    compliance_target_pct = Column(Float, default=95.0)
    
    lead_executive_name = Column(String(255), nullable=False)
    results_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    organization = relationship("Organization", backref="initiatives")

class TrainingProgram(Base):
    __tablename__ = "training_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. TRN-2026-001
    title = Column(String(255), nullable=False) # e.g. "High Voltage Electrical Safety Certification"
    category = Column(String(100), nullable=False) # Electrical, Blasting Safety, Underground Ventilation, PPE Protocols
    description = Column(Text, nullable=True)
    duration_hours = Column(Float, default=8.0)
    is_mandatory = Column(Boolean, default=True)
    validity_months = Column(Integer, default=12)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    participations = relationship("TrainingParticipation", backref="program", cascade="all, delete-orphan")

class TrainingParticipation(Base):
    __tablename__ = "training_participations"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("training_programs.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    
    scheduled_date = Column(Date, nullable=False)
    completion_date = Column(Date, nullable=True)
    status = Column(String(50), default="COMPLETED") # SCHEDULED, COMPLETED, ABSENT, FAILED
    score = Column(Float, default=90.0)
    certificate_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    worker = relationship("Worker", backref="training_history")
    mine = relationship("Mine", backref="training_records")
