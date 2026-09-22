import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ALT-2026-0044
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    
    category = Column(String(50), nullable=False) # SAFETY, ENVIRONMENTAL_BREACH, CRITICAL_VIOLATION, OVERDUE_ACTION, MACHINE_FAILURE
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    
    is_active = Column(Boolean, default=True, index=True)
    entity_type = Column(String(50), nullable=True) # VIOLATION, INCIDENT, MACHINE, SENSOR
    entity_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    mine = relationship("Mine", backref="alerts")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO") # ASSIGNMENT, REMINDER, CRITICAL_ALERT, ESCALATION, VERIFICATION_REQUEST
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    
    related_entity = Column(String(50), nullable=True) # INSPECTION, ACTION, VIOLATION, REGULATORY_ACTION
    related_id = Column(String(50), nullable=True)
    
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", backref="notifications")

class Escalation(Base):
    __tablename__ = "escalations"
    
    id = Column(Integer, primary_key=True, index=True)
    escalation_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ESC-2026-0012
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    
    source_type = Column(String(50), nullable=False) # CORRECTIVE_ACTION, VIOLATION, INCIDENT, ENVIRONMENTAL_BREACH
    source_id = Column(String(50), nullable=False)
    
    from_role = Column(String(50), nullable=False) # FIELD_SUPERVISOR, MINE_MANAGER
    to_role = Column(String(50), nullable=False) # MINE_MANAGER, CORPORATE_EXECUTIVE, GOVERNMENT_REGULATOR
    
    trigger_reason = Column(Text, nullable=False) # e.g. "Deadline exceeded by 48 hours for High Severity Electrical Violation"
    status = Column(String(50), default="TRIGGERED") # TRIGGERED, ACKNOWLEDGED, RESOLVED
    
    escalated_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    mine = relationship("Mine", backref="escalations")
