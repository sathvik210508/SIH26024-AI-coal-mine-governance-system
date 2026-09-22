import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    headquarters = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    compliance_score = Column(Float, default=100.0)
    safety_rating = Column(String(20), default="A")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    subsidiaries = relationship("Subsidiary", backref="organization", cascade="all, delete-orphan")
    mines = relationship("Mine", backref="organization")

class Subsidiary(Base):
    __tablename__ = "subsidiaries"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    division = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mines = relationship("Mine", backref="subsidiary")

class Region(Base):
    __tablename__ = "regions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    jurisdiction_code = Column(String(100), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mines = relationship("Mine", backref="region")

class Mine(Base):
    __tablename__ = "mines"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    subsidiary_id = Column(Integer, ForeignKey("subsidiaries.id", ondelete="SET NULL"), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="SET NULL"), nullable=True)
    
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    mine_type = Column(String(50), nullable=False) # OPEN_CAST, UNDERGROUND, MIXED
    operator_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="OPERATIONAL") # OPERATIONAL, UNDER_REVIEW, CRITICAL_WATCH, SUSPENDED
    
    manager_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    # Geographic coordinates & geometry
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True) # Polygon coordinates
    
    # Real-time / computed metrics
    compliance_score = Column(Float, default=92.5)
    risk_score = Column(Float, default=24.0)
    risk_tier = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    zones = relationship("MineZone", backref="mine", cascade="all, delete-orphan")

class MineZone(Base):
    __tablename__ = "mine_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    zone_type = Column(String(50), nullable=False) # PIT, CONVEYOR, BLASTING, HAUL_ROAD, WORKSHOP, STORAGE, RESTRICTED
    risk_tier = Column(String(20), default="LOW")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    polygon_geojson = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
