import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. WRK-2026-001
    name = Column(String(255), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True)
    
    department = Column(String(100), nullable=False) # Extraction, Electrical, Maintenance, Safety, Logistics
    role = Column(String(100), nullable=False) # Machine Operator, Electrician, Blasting Specialist, Helper, Driller
    shift = Column(String(50), default="SHIFT_A") # SHIFT_A (Morning), SHIFT_B (Evening), SHIFT_C (Night)
    status = Column(String(50), default="ACTIVE") # ACTIVE, ON_LEAVE, SUSPENDED, DEPLOYED
    
    training_status = Column(String(50), default="CERTIFIED") # CERTIFIED, REFRESHER_DUE, OVERDUE, IN_TRAINING
    certification_status = Column(String(50), default="VALID") # VALID, EXPIRING_SOON, EXPIRED
    safety_badge_level = Column(String(20), default="STANDARD")
    
    contact_phone = Column(String(50), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="workers")
    zone = relationship("MineZone", backref="workers")
    documents = relationship("WorkerDocument", backref="worker", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", backref="worker", cascade="all, delete-orphan")

class WorkerDocument(Base):
    __tablename__ = "worker_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False) # Safety Certification, Medical Fitness, ID Proof, Heavy Machinery License
    document_number = Column(String(100), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="VALID") # VALID, EXPIRING_SOON, EXPIRED, UNVERIFIED
    verified_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    date = Column(Date, default=datetime.date.today, index=True)
    shift = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False) # PRESENT, ABSENT, LATE, ON_LEAVE, SICK
    
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True)
    
    mine = relationship("Mine", backref="attendance_records")
    recorded_by = relationship("User", backref="recorded_attendances")
