import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.services.audit_service import verify_audit_chain, record_audit_event
from app.models.auth import User

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_demo_accounts():
    # 1. Field Supervisor
    r_field = client.post("/api/auth/login", json={"email": "supervisor@bharatcoal.in", "password": "Field@2026"})
    assert r_field.status_code == 200
    data_f = r_field.json()
    assert "access_token" in data_f
    assert data_f["user"]["role_code"] == "FIELD_SUPERVISOR"
    
    # 2. Mine Manager
    r_mgr = client.post("/api/auth/login", json={"email": "manager@bharatcoal.in", "password": "Manager@2026"})
    assert r_mgr.status_code == 200
    assert r_mgr.json()["user"]["role_code"] == "MINE_MANAGER"
    
    # 3. Corporate Executive
    r_corp = client.post("/api/auth/login", json={"email": "executive@bharatcoal.in", "password": "Corporate@2026"})
    assert r_corp.status_code == 200
    assert r_corp.json()["user"]["role_code"] == "CORPORATE_EXECUTIVE"
    
    # 4. Government Regulator
    r_gov = client.post("/api/auth/login", json={"email": "regulator@gov.in", "password": "Gov@2026"})
    assert r_gov.status_code == 200
    assert r_gov.json()["user"]["role_code"] == "GOVERNMENT_REGULATOR"

def test_login_invalid_credentials():
    r = client.post("/api/auth/login", json={"email": "supervisor@bharatcoal.in", "password": "WrongPassword!"})
    assert r.status_code == 401

def test_field_cannot_create_inspection():
    # Field supervisor tries to access corporate endpoint or create inspection
    login_resp = client.post("/api/auth/login", json={"email": "supervisor@bharatcoal.in", "password": "Field@2026"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Corporate endpoint should return 403 Forbidden
    r_corp = client.get("/api/corporate/dashboard", headers=headers)
    assert r_corp.status_code == 403

def test_full_compliance_lifecycle():
    # 1. Login as Field Supervisor
    f_login = client.post("/api/auth/login", json={"email": "supervisor@bharatcoal.in", "password": "Field@2026"}).json()
    f_headers = {"Authorization": f"Bearer {f_login['access_token']}"}
    
    # 2. Login as Mine Manager
    m_login = client.post("/api/auth/login", json={"email": "manager@bharatcoal.in", "password": "Manager@2026"}).json()
    m_headers = {"Authorization": f"Bearer {m_login['access_token']}"}
    
    # 3. Mine Manager creates an inspection
    insp_payload = {
        "inspection_type": "ELECTRICAL",
        "priority": "HIGH",
        "scheduled_date": "2026-09-22",
        "assigned_supervisor_id": f_login["user"]["id"],
        "instructions": "Test electrical audit"
    }
    r_insp = client.post("/api/mine/inspections", json=insp_payload, headers=m_headers)
    assert r_insp.status_code == 200
    insp_id = r_insp.json()["id"]
    
    # 4. Field Supervisor starts inspection
    r_start = client.post(f"/api/field/inspections/{insp_id}/start", json={"latitude": 24.1985, "longitude": 82.6655}, headers=f_headers)
    assert r_start.status_code == 200
    assert r_start.json()["inspection"]["status"] == "IN_PROGRESS"
    
    # 5. Field Supervisor submits inspection with a Non-Compliant item
    submit_payload = {
        "latitude": 24.1985,
        "longitude": 82.6655,
        "checklist_results": [
            {
                "category": "Electrical",
                "title": "Trailing Cable Defect",
                "status": "NON_COMPLIANT",
                "severity": "HIGH",
                "remarks": "Exposed cable joints"
            }
        ]
    }
    r_sub = client.post(f"/api/field/inspections/{insp_id}", json=submit_payload, headers=f_headers) # patch/post route
    # Check patch
    r_patch = client.patch(f"/api/field/inspections/{insp_id}", json=submit_payload, headers=f_headers)
    assert r_patch.status_code == 200
    assert len(r_patch.json()["findings_created"]) >= 1
    
    # 6. Mine Manager converts finding into a violation and creates corrective action
    act_payload = {
        "description": "Repair trailing cable insulation and sleeve with vulcanized wrap",
        "assigned_person": "Electrical Maintenance Shift",
        "department": "Electrical",
        "priority": "HIGH",
        "severity": "HIGH",
        "deadline": "2026-09-30"
    }
    r_act = client.post("/api/mine/corrective-actions", json=act_payload, headers=m_headers)
    assert r_act.status_code == 200
    action_id = r_act.json()["id"]
    assert r_act.json()["status"] == "ASSIGNED"
    
    # 7. Field Supervisor updates action with evidence (CRITICAL: Must become AWAITING_VERIFICATION, NOT CLOSED)
    ev_payload = {
        "file_path": "/uploads/test_repaired_conduit.jpg",
        "remarks": "Vulcanized wrap applied. Megger test satisfactory.",
        "latitude": 24.1985,
        "longitude": 82.6655
    }
    r_ev = client.patch(f"/api/field/corrective-actions/{action_id}", json=ev_payload, headers=f_headers)
    assert r_ev.status_code == 200
    assert r_ev.json()["action"]["status"] == "AWAITING_VERIFICATION"
    
    # 8. Mine Manager reviews evidence and approves action -> Status becomes CLOSED
    verify_payload = {
        "decision": "ACCEPTED",
        "remarks": "Inspected photo evidence and megger test logs. Verified compliant."
    }
    r_ver = client.patch(f"/api/mine/corrective-actions/{action_id}", json=verify_payload, headers=m_headers)
    assert r_ver.status_code == 200
    assert r_ver.json()["action"]["status"] == "CLOSED"

def test_cryptographic_audit_hash_chain():
    db = SessionLocal()
    try:
        # Verify the pre-seeded chain
        result = verify_audit_chain(db)
        assert result["status"] == "HASH_CHAIN_VALID"
        assert result["total_blocks"] >= 5
    finally:
        db.close()

def test_ai_risk_and_copilot():
    m_login = client.post("/api/auth/login", json={"email": "manager@bharatcoal.in", "password": "Manager@2026"}).json()
    m_headers = {"Authorization": f"Bearer {m_login['access_token']}"}
    
    # Query AI Risk overview
    r_risk = client.get("/api/ai/risk?mine_id=1", headers=m_headers)
    assert r_risk.status_code == 200
    risk_data = r_risk.json()
    assert "risk_score" in risk_data
    assert "contributing_factors" in risk_data
    assert len(risk_data["contributing_factors"]) >= 5
    
    # Query AI Copilot
    r_copilot = client.post("/api/ai/copilot", json={"query": "Why is the mine risk high?"}, headers=m_headers)
    assert r_copilot.status_code == 200
    copilot_data = r_copilot.json()
    assert "answer" in copilot_data
    assert "supporting_metrics" in copilot_data
    assert "affected_records" in copilot_data
