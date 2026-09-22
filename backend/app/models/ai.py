import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class AIRiskScore(Base):
    __tablename__ = "ai_risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    
    score = Column(Float, nullable=False) # 0.0 - 100.0
    risk_tier = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    
    # Explainable AI factors: [ { factor: "Critical Violations", weight: 30, impact: 28.5, count: 4, trend: "INCREASING" } ]
    contributing_factors = Column(JSON, nullable=False)
    summary_explanation = Column(Text, nullable=False)
    
    trend = Column(String(20), default="STABLE") # INCREASING, DECREASING, STABLE
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    mine = relationship("Mine", backref="ai_risk_scores")

class AIAnomaly(Base):
    __tablename__ = "ai_anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ANOM-2026-0007
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    category = Column(String(100), nullable=False) # INCIDENT_SPIKE, SAFETY_OBSERVATION_SURGE, GAS_EMISSION_ANOMALY, DOWNTIME_SPIKE
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    baseline_value = Column(Float, nullable=False)
    observed_value = Column(Float, nullable=False)
    deviation_percentage = Column(Float, nullable=False)
    severity = Column(String(20), default="HIGH")
    
    is_acknowledged = Column(Boolean, default=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="ai_anomalies")

class AIRecurringPattern(Base):
    __tablename__ = "ai_recurring_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    pattern_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. PAT-2026-0012
    category = Column(String(100), nullable=False) # Electrical Safety, Conveyor Belts, Haulage Berms, Dust Suppression
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    occurrence_count = Column(Integer, nullable=False)
    affected_mines_count = Column(Integer, nullable=False)
    affected_mines_data = Column(JSON, nullable=False) # [ { mine_id, mine_name, count } ]
    affected_zones_count = Column(Integer, default=1)
    
    trend = Column(String(50), default="INCREASING")
    evidence_summary = Column(Text, nullable=False)
    recommended_campaign = Column(String(255), nullable=True)
    
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. REC-2026-0021
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    justification = Column(Text, nullable=False)
    priority = Column(String(20), default="HIGH")
    
    # Advisory action payload (human must confirm)
    action_type = Column(String(100), nullable=False) # CREATE_INSPECTION, CONTRACTOR_AUDIT, PREVENTIVE_MAINTENANCE, REGULATORY_REVIEW
    action_payload = Column(JSON, nullable=True) # { template_code, priority, category, zone_id }
    
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="ai_recommendations")

class AIPrediction(Base):
    __tablename__ = "ai_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. PRED-2026-0033
    entity_type = Column(String(50), nullable=False) # MINE, MACHINE, CONTRACTOR
    entity_id = Column(String(50), nullable=False)
    entity_name = Column(String(255), nullable=False)
    
    metric_predicted = Column(String(100), nullable=False) # Maintenance Window, Compliance Decline, Incident Risk
    predicted_outcome = Column(String(255), nullable=False)
    timeframe = Column(String(100), nullable=False) # Within 7 days, Next 30 days
    confidence = Column(Float, default=0.88)
    
    basis_factors = Column(JSON, nullable=False)
    recommended_mitigation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
