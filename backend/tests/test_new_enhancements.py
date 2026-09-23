import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_header(email: str, password: str):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_early_warnings_endpoint():
    headers = get_auth_header("manager@bharatcoal.in", "Manager@2026")
    res = client.get("/api/ai/early-warnings?mine_id=1", headers=headers)
    assert res.status_code == 200
    warnings = res.json()
    assert isinstance(warnings, list)
    assert len(warnings) > 0
    w = warnings[0]
    assert "risk_score" in w
    assert "risk_level" in w
    assert "title" in w
    assert "recommended_action" in w

def test_compliance_lifecycle_endpoint():
    headers = get_auth_header("manager@bharatcoal.in", "Manager@2026")
    res = client.get("/api/mine/compliance/lifecycle/action/1", headers=headers)
    assert res.status_code == 200
    lifecycle = res.json()
    assert "lifecycle_timeline" in lifecycle
    assert len(lifecycle["lifecycle_timeline"]) == 10
    assert "current_step" in lifecycle
    assert "issue_details" in lifecycle
    stage_8 = [s for s in lifecycle["lifecycle_timeline"] if s["step"] == 8][0]
    assert "AI Evidence Verification" in stage_8["title"]

def test_traceability_dag_endpoint():
    headers = get_auth_header("manager@bharatcoal.in", "Manager@2026")
    res = client.get("/api/mine/compliance/traceability/REG-2026-0019", headers=headers)
    assert res.status_code == 200
    dag = res.json()
    assert "regulation" in dag
    assert "violation" in dag

def test_contractor_profile_endpoint():
    headers = get_auth_header("manager@bharatcoal.in", "Manager@2026")
    res = client.get("/api/mine/contractors/1/profile", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert "contractor" in profile
    assert profile["contractor"]["company_name"] is not None
    assert "compliance_score" in profile["compliance_profile"]

def test_corporate_insights_endpoint():
    headers = get_auth_header("executive@bharatcoal.in", "Corporate@2026")
    res = client.get("/api/corporate/comparison/insights", headers=headers)
    assert res.status_code == 200
    insights = res.json()
    assert "portfolio_summary" in insights
    assert "disparity_gap_compliance" in insights
    assert len(insights["insights"]) > 0

def test_multi_criteria_report_pdf():
    headers = get_auth_header("regulator@gov.in", "Gov@2026")
    res = client.post("/api/reports/generate", json={
        "report_type": "STATUTORY_COMPLIANCE_SUMMARY",
        "file_format": "PDF",
        "mine_id": 1,
        "status": "OPEN",
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert "download_url" in data
