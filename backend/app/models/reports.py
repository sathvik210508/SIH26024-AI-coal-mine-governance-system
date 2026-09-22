import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class GeneratedReport(Base):
    __tablename__ = "generated_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. REP-2026-0042
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False) # MINE_SAFETY_SUMMARY, COMPLIANCE_AUDIT, INCIDENT_DOSSIER, CORPORATE_COMPARISON, REGULATORY_OVERVIEW
    
    portal_scope = Column(String(50), nullable=False) # FIELD, MINE, CORPORATE, GOVERNMENT
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    filters_applied = Column(JSON, nullable=True)
    format = Column(String(20), default="PDF") # PDF, EXCEL
    status = Column(String(50), default="COMPLETED") # PENDING, GENERATING, COMPLETED, FAILED
    
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    requested_by = relationship("User", backref="reports")
