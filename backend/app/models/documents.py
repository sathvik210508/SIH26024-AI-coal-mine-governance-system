import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. DOC-2026-0081
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # CERTIFICATES, INSPECTION_REPORTS, APPROVAL_DOCS, COMPLIANCE_EVIDENCE, SAFETY_DOCS, CORRECTIVE_EVIDENCE, CONTRACTOR_DOCS, MACHINE_DOCS
    
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    
    current_version = Column(Integer, default=1)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    
    # Statuses: VALID, EXPIRING_SOON, EXPIRED, UNVERIFIED, REJECTED
    status = Column(String(50), default="VALID", index=True)
    is_missing = Column(Boolean, default=False)
    verification_status = Column(String(50), default="VERIFIED")
    verified_by = Column(String(255), nullable=True)
    
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    mine = relationship("Mine", backref="documents")
    uploader = relationship("User", backref="uploaded_documents")
    versions = relationship("DocumentVersion", backref="document", cascade="all, delete-orphan")
    ocr_data = relationship("DocumentOCRData", backref="document", uselist=False, cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    change_summary = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DocumentOCRData(Base):
    __tablename__ = "document_ocr_data"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=True)
    
    # Extracted fields from OCR
    doc_number = Column(String(100), nullable=True)
    extracted_issue_date = Column(Date, nullable=True)
    extracted_expiry_date = Column(Date, nullable=True)
    issuing_authority = Column(String(255), nullable=True)
    confidence_score = Column(Float, default=0.92) # 0.0 - 1.0
    
    # Manual correction audit
    is_manually_corrected = Column(Boolean, default=False)
    corrected_fields = Column(JSON, nullable=True) # {field: {old: val, new: val, reason: val}}
    corrected_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    corrected_at = Column(DateTime, nullable=True)
