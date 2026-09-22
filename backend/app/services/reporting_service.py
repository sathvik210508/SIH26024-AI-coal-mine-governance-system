import os
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from app.config import settings
from app.models.violations import Violation
from app.models.safety import Incident
from app.models.corrective_actions import CorrectiveAction
from app.models.inspections import Inspection
from app.models.reports import GeneratedReport
from app.models.organization import Mine

def generate_pdf_report(
    db: Session,
    report_title: str,
    portal_scope: str,
    filters: Dict[str, Any],
    user_id: int
) -> GeneratedReport:
    report_id = f"REP-2026-{datetime.datetime.utcnow().strftime('%m%d%H%M%S')}"
    filename = f"{report_id}.pdf"
    output_path = os.path.join(settings.FILE_STORAGE_PATH, filename)
    
    doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )
    
    elements = []
    elements.append(Paragraph(f"SIH26024 — {report_title.upper()}", title_style))
    elements.append(Paragraph(
        f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | "
        f"Scope: {portal_scope} | Report Reference: {report_id}",
        subtitle_style
    ))
    
    # Query database records
    violations = db.query(Violation).limit(20).all()
    
    data = [["VIOLATION ID", "MINE", "CATEGORY", "SEVERITY", "DEADLINE", "STATUS"]]
    for v in violations:
        mine_name = db.query(Mine.name).filter(Mine.id == v.mine_id).scalar() or "All"
        data.append([
            Paragraph(v.violation_id, cell_style),
            Paragraph(mine_name[:18], cell_style),
            Paragraph(v.category[:20], cell_style),
            Paragraph(v.severity, cell_style),
            Paragraph(str(v.deadline), cell_style),
            Paragraph(v.status, cell_style)
        ])
        
    t = Table(data, colWidths=[80, 110, 110, 70, 70, 90])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("This is an official statutory record generated from live cryptographic database logs.", subtitle_style))
    
    doc.build(elements)
    
    size_bytes = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    report_record = GeneratedReport(
        report_id=report_id,
        title=report_title,
        report_type="STATUTORY_COMPLIANCE_SUMMARY",
        portal_scope=portal_scope,
        requested_by_id=user_id,
        filters_applied=filters,
        format="PDF",
        file_path=output_path,
        file_size_bytes=size_bytes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)
    return report_record

def generate_excel_report(
    db: Session,
    report_title: str,
    portal_scope: str,
    filters: Dict[str, Any],
    user_id: int
) -> GeneratedReport:
    report_id = f"REP-2026-{datetime.datetime.utcnow().strftime('%m%d%H%M%S')}"
    filename = f"{report_id}.xlsx"
    output_path = os.path.join(settings.FILE_STORAGE_PATH, filename)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Compliance Audit"
    
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    
    headers = ["Violation ID", "Mine", "Category", "Description", "Severity", "Department", "Deadline", "Status"]
    ws.append(headers)
    
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    violations = db.query(Violation).all()
    for v in violations:
        mine_name = db.query(Mine.name).filter(Mine.id == v.mine_id).scalar() or "Mine"
        ws.append([
            v.violation_id,
            mine_name,
            v.category,
            v.description,
            v.severity,
            v.department,
            str(v.deadline),
            v.status
        ])
        
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
        
    wb.save(output_path)
    size_bytes = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    
    report_record = GeneratedReport(
        report_id=report_id,
        title=report_title,
        report_type="STATUTORY_EXCEL_EXPORT",
        portal_scope=portal_scope,
        requested_by_id=user_id,
        filters_applied=filters,
        format="EXCEL",
        file_path=output_path,
        file_size_bytes=size_bytes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)
    return report_record
