import os
import asyncio
import datetime
from fastapi import FastAPI, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db
import app.models
from app.models.auth import User
from app.models.organization import Mine
from app.models.workforce import Worker
from app.models.machinery import Machine
from app.models.contractors import Contractor
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction
from app.models.safety import Incident
from app.models.inspections import Inspection
from app.models.alerts import Notification
from app.auth.jwt import get_current_user

from app.routers import auth, field, mine, corporate, government, ai, audit, reports
from app.services.notification_service import event_subscribers

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI-Based Smart Governance & Compliance Monitoring Platform for Coal Mines"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file storage for uploads (evidence photos, documents, reports)
os.makedirs(settings.FILE_STORAGE_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.FILE_STORAGE_PATH), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(field.router, prefix=settings.API_PREFIX)
app.include_router(mine.router, prefix=settings.API_PREFIX)
app.include_router(corporate.router, prefix=settings.API_PREFIX)
app.include_router(government.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get(f"{settings.API_PREFIX}/events")
async def events_stream(request: Request):
    """Server-Sent Events (SSE) stream for real-time pushes (alerts, escalations, findings)"""
    async def event_generator():
        queue = asyncio.Queue()
        event_subscribers.append(queue)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat
                    yield f": keepalive\n\n"
        finally:
            if queue in event_subscribers:
                event_subscribers.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get(f"{settings.API_PREFIX}/notifications")
def get_user_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = sum(1 for n in notifs if not n.is_read)
    return {"unread_count": unread_count, "notifications": notifs}

@app.patch(f"{settings.API_PREFIX}/notifications/{{notif_id}}/read")
def mark_notification_read(notif_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@app.get(f"{settings.API_PREFIX}/search")
def global_search(q: str = Query(..., min_length=2), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """RBAC-aware global search across all core entities"""
    search_term = f"%{q}%"
    results = []
    
    # 1. Mines
    mines = db.query(Mine).filter(Mine.name.ilike(search_term) | Mine.code.ilike(search_term)).limit(5).all()
    for m in mines:
        results.append({"type": "MINE", "id": m.code, "title": m.name, "subtitle": f"{m.mine_type} • {m.status}", "link": f"/mine/dashboard"})
        
    # 2. Violations
    violations = db.query(Violation).filter(Violation.violation_id.ilike(search_term) | Violation.description.ilike(search_term)).limit(5).all()
    for v in violations:
        results.append({"type": "VIOLATION", "id": v.violation_id, "title": v.category, "subtitle": f"{v.severity} • {v.status}", "link": f"/mine/violations"})
        
    # 3. Corrective Actions
    actions = db.query(CorrectiveAction).filter(CorrectiveAction.action_id.ilike(search_term) | CorrectiveAction.description.ilike(search_term)).limit(5).all()
    for a in actions:
        results.append({"type": "ACTION", "id": a.action_id, "title": a.description[:40], "subtitle": f"Deadline: {a.deadline} • {a.status}", "link": f"/mine/corrective-actions"})
        
    # 4. Workers
    workers = db.query(Worker).filter(Worker.name.ilike(search_term) | Worker.worker_id.ilike(search_term)).limit(5).all()
    for w in workers:
        results.append({"type": "WORKER", "id": w.worker_id, "title": w.name, "subtitle": f"{w.role} • {w.department}", "link": f"/mine/workers"})
        
    # 5. Machines
    machines = db.query(Machine).filter(Machine.name.ilike(search_term) | Machine.machine_id.ilike(search_term)).limit(5).all()
    for m in machines:
        results.append({"type": "MACHINE", "id": m.machine_id, "title": m.name, "subtitle": f"{m.machine_type} • {m.status}", "link": f"/mine/machinery"})
        
    return results
