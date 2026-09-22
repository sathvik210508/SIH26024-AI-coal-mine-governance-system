import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    metric_name = Column(String(100), nullable=False) # PM2.5, PM10, Methane (CH4), Carbon Monoxide (CO), Noise Level, Groundwater pH, Ambient Temp
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False) # ug/m3, %, ppm, dB, pH, C
    threshold_limit = Column(Float, nullable=False)
    is_breach = Column(Boolean, default=False, index=True)
    
    # Status: NORMAL, WARNING, CRITICAL
    status = Column(String(50), default="NORMAL")
    sensor_id = Column(String(100), nullable=True)
    location_details = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    action_taken = Column(Text, nullable=True)
    alert_generated = Column(Boolean, default=False)
    
    mine = relationship("Mine", backref="environmental_readings")
    zone = relationship("MineZone", backref="environmental_readings")
