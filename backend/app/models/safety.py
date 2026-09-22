import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class SafetyObservation(Base):
    __tablename__ = "safety_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. OBS-2026-0031
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    category = Column(String(100), nullable=False) # PPE Compliance, Unsafe Practices, Unsafe Conditions, Equipment/Machinery Safety, Electrical Hazards, Ventilation Issues, Fire Safety, Mine-Area Hazards, Other
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    location_details = Column(String(255), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    evidence_photo_url = Column(String(500), nullable=True)
    evidence_video_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, UNDER_REVIEW, ACTION_TAKEN, CLOSED
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="safety_observations")
    zone = relationship("MineZone", backref="safety_observations")
    reporter = relationship("User", backref="reported_observations")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. INC-2026-0042
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    incident_type = Column(String(100), nullable=False) # Accident, Injury, Near Miss, Fire, Equipment Failure, Environmental Incident, Dangerous Occurrence, Other
    incident_datetime = Column(DateTime, nullable=False)
    location_details = Column(String(255), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    people_involved = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    injury_details = Column(Text, nullable=True)
    equipment_involved = Column(String(255), nullable=True)
    
    evidence_photo_url = Column(String(500), nullable=True)
    evidence_video_url = Column(String(500), nullable=True)
    immediate_action = Column(Text, nullable=True)
    
    severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN") # OPEN, UNDER_INVESTIGATION, CORRECTIVE_ACTION, RESOLVED, CLOSED
    
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="incidents")
    zone = relationship("MineZone", backref="incidents")
    reporter = relationship("User", backref="reported_incidents")
    investigations = relationship("IncidentInvestigation", backref="incident", cascade="all, delete-orphan")

class IncidentInvestigation(Base):
    __tablename__ = "incident_investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. INV-2026-0010
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    
    investigating_authority = Column(String(100), nullable=False) # MINE_MANAGEMENT, CORPORATE_SAFETY, REGULATORY_DGMS
    lead_investigator_name = Column(String(255), nullable=False)
    investigator_team = Column(Text, nullable=True)
    
    start_date = Column(Date, nullable=False)
    closure_date = Column(Date, nullable=True)
    
    status = Column(String(50), default="OPEN") # OPEN, EVIDENCE_COLLECTION, ROOT_CAUSE_ANALYSIS, RECOMMENDATIONS, CLOSED
    findings = Column(Text, nullable=True)
    root_contributing_factors = Column(Text, nullable=True)
    preventive_recommendations = Column(Text, nullable=True)
    evidence_dossier_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class NearMiss(Base):
    __tablename__ = "near_misses"
    
    id = Column(Integer, primary_key=True, index=True)
    near_miss_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. NM-2026-0019
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    datetime_occurred = Column(DateTime, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    potential_severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    immediate_action_taken = Column(Text, nullable=True)
    
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="near_misses")
    zone = relationship("MineZone", backref="near_misses")
