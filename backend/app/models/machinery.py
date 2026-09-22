import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. EX-204, DRAG-01
    name = Column(String(255), nullable=False)
    machine_type = Column(String(100), nullable=False) # Dumper, Excavator, Continuous Miner, Dragline, Conveyor System, Ventilation Fan
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default="OPERATIONAL") # OPERATIONAL, WARNING, MAINTENANCE_DUE, UNDER_MAINTENANCE, CRITICAL, OFFLINE
    operating_hours = Column(Float, default=0.0)
    last_maintenance = Column(Date, nullable=True)
    next_maintenance = Column(Date, nullable=True)
    maintenance_status = Column(String(50), default="UP_TO_DATE") # UP_TO_DATE, DUE_SOON, OVERDUE, IN_PROGRESS
    risk_status = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    # Predictive maintenance telemetry / metrics
    vibration_level = Column(Float, default=1.2) # mm/s
    temperature_celsius = Column(Float, default=68.0)
    oil_pressure_psi = Column(Float, default=45.0)
    failure_history_count = Column(Integer, default=0)
    predicted_maintenance_window = Column(String(100), nullable=True) # e.g. "Within 5 days (High Bearing Temp)"
    recommended_action = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="machines")
    zone = relationship("MineZone", backref="machines")
    maintenance_records = relationship("MachineMaintenance", backref="machine", cascade="all, delete-orphan")
    documents = relationship("MachineDocument", backref="machine", cascade="all, delete-orphan")

class MachineMaintenance(Base):
    __tablename__ = "machine_maintenance"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    maintenance_type = Column(String(100), nullable=False) # PREVENTIVE, CORRECTIVE, OVERHAUL, SENSOR_CALIBRATION
    scheduled_date = Column(Date, nullable=False)
    completion_date = Column(Date, nullable=True)
    technician_name = Column(String(255), nullable=True)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED, DELAYED
    findings = Column(Text, nullable=True)
    parts_replaced = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MachineDocument(Base):
    __tablename__ = "machine_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False) # Safety Certificate, Emission Test, Fitness Certificate, OEM Manual
    document_number = Column(String(100), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="VALID") # VALID, EXPIRING_SOON, EXPIRED, MISSING
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProductionRecord(Base):
    __tablename__ = "production_records"
    
    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today, index=True)
    shift = Column(String(50), default="SHIFT_A")
    target_tonnage = Column(Float, nullable=False)
    actual_tonnage = Column(Float, nullable=False)
    variance_tonnage = Column(Float, nullable=False)
    overburden_removed_m3 = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="production_records")
