import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class InspectionTemplate(Base):
    __tablename__ = "inspection_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False) # e.g. "Standard Electrical Pit Safety Inspection"
    inspection_type = Column(String(50), nullable=False) # SAFETY, PPE, MACHINERY, ELECTRICAL, FIRE, VENTILATION, ENVIRONMENT, MINE_AREA, REGULATORY
    description = Column(Text, nullable=True)
    frequency = Column(String(50), default="WEEKLY") # DAILY, WEEKLY, MONTHLY, QUARTERLY, AD_HOC
    regulatory_reference = Column(String(200), nullable=True) # e.g. "DGMS Circular No. 04 of 2024"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    items = relationship("InspectionItem", backref="template", cascade="all, delete-orphan")

class InspectionItem(Base):
    __tablename__ = "inspection_items"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("inspection_templates.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False) # PPE, Machinery, Electrical, Fire, Ventilation, Housekeeping, Mine Area Safety, Environment, Operational Safety, Regulatory Compliance
    item_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    requirement_description = Column(Text, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. INSP-2026-0042
    template_id = Column(Integer, ForeignKey("inspection_templates.id", ondelete="SET NULL"), nullable=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    inspection_type = Column(String(50), nullable=False) # SAFETY, PPE, MACHINERY, ELECTRICAL, FIRE, VENTILATION, ENVIRONMENT, REGULATORY
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    scheduled_date = Column(Date, nullable=False)
    
    created_by_role = Column(String(50), nullable=False) # MINE_MANAGER, CORPORATE_EXECUTIVE, GOVERNMENT_REGULATOR
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    instructions = Column(Text, nullable=True)
    regulatory_reference = Column(String(255), nullable=True)
    
    # Workflow status: ASSIGNED -> ACCEPTED -> IN_PROGRESS -> SUBMITTED -> REVIEWED
    status = Column(String(50), default="ASSIGNED", index=True)
    
    # Automated execution telemetry
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_comments = Column(Text, nullable=True)
    
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    
    checklist_results = Column(JSON, nullable=True) # list of items with status COMPLIANT, NON_COMPLIANT, N/A, remarks
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="inspections")
    zone = relationship("MineZone", backref="inspections")
    template = relationship("InspectionTemplate", backref="inspections")
    assigned_supervisor = relationship("User", foreign_keys=[assigned_supervisor_id], backref="assigned_inspections")
    creator = relationship("User", foreign_keys=[created_by_id], backref="created_inspections")
    findings = relationship("InspectionFinding", backref="inspection", cascade="all, delete-orphan")

class InspectionFinding(Base):
    __tablename__ = "inspection_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. FND-2026-0012
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    item_category = Column(String(100), nullable=False)
    item_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    evidence_photo_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    
    # Lifecycle conversion
    converted_to_violation_id = Column(Integer, nullable=True)
    converted_to_action_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="findings")
    zone = relationship("MineZone", backref="findings")
