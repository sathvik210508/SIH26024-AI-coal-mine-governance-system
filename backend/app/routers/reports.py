import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.reports import GeneratedReport
from app.auth.jwt import get_current_user
from app.services.reporting_service import generate_pdf_report, generate_excel_report
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/reports", tags=["Reporting Engine"])

class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    report_type: Optional[str] = None
    format: Optional[str] = None
    file_format: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

@router.get("")
def list_reports(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(GeneratedReport).order_by(GeneratedReport.id.desc()).all()

@router.post("/generate")
def request_report_generation(
    payload: ReportGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    final_title = payload.title or payload.report_type or "Official Mining Compliance Report"
    final_format = (payload.format or payload.file_format or "PDF").upper()

    if final_format == "EXCEL":
        report = generate_excel_report(
            db=db,
            report_title=final_title,
            portal_scope=user.role_code,
            filters=payload.filters or {},
            user_id=user.id
        )
    else:
        report = generate_pdf_report(
            db=db,
            report_title=final_title,
            portal_scope=user.role_code,
            filters=payload.filters or {},
            user_id=user.id
        )
        
    record_audit_event(
        db=db,
        user=user,
        entity_name="REPORT",
        entity_id=report.report_id,
        action="GENERATE_REPORT",
        metadata={"format": final_format, "title": final_title}
    )
    return {
        "id": report.id,
        "report_id": report.report_id,
        "title": report.title,
        "format": report.format,
        "status": report.status,
        "file_path": report.file_path,
        "download_url": f"/api/reports/{report.report_id}/download"
    }

@router.get("/{report_id}/download")
def download_report(report_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rep = db.query(GeneratedReport).filter(GeneratedReport.report_id == report_id).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
        
    rep.download_count += 1
    db.commit()
    
    media_type = "application/pdf" if rep.format == "PDF" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = os.path.basename(rep.file_path)
    return FileResponse(rep.file_path, media_type=media_type, filename=filename)
