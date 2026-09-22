import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. VIO-2026-0089
    
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="SET NULL"), nullable=True)
    finding_id = Column(Integer, ForeignKey("inspection_findings.id", ondelete="SET NULL"), nullable=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True)
    
    category = Column(String(100), nullable=False) # Electrical Safety, Conveyor Guards, Ventilation, Haul Road, PPE, Blasting
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    
    location_details = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    evidence_photo_url = Column(String(500), nullable=True)
    
    responsible_person = Column(String(255), nullable=True)
    department = Column(String(100), nullable=False) # Maintenance, Electrical, Excavation, Safety
    deadline = Column(Date, nullable=False)
    
    # Statuses: OPEN, ASSIGNED, IN_REMEDIATION, PENDING_VERIFICATION, VERIFIED, CLOSED, ESCALATED
    status = Column(String(50), default="OPEN", index=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_count = Column(Integer, default=1)
    
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_remarks = Column(Text, nullable=True)
    closure_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="violations")
    zone = relationship("MineZone", backref="violations")
    inspection = relationship("Inspection", backref="violations")
    finding = relationship("InspectionFinding", backref="violations")
    contractor = relationship("Contractor", backref="violations")
    verified_by = relationship("User", backref="verified_violations")
    corrective_actions = relationship("CorrectiveAction", backref="violation", cascade="all, delete-orphan")
