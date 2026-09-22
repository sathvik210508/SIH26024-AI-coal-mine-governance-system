import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_corporate_endpoints():
    token = get_token("executive@bharatcoal.in", "Corporate@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Dashboard
    dash_res = client.get("/api/corporate/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "metrics" in dash_data
    assert dash_data["metrics"]["total_mines"] >= 6
    assert "high_risk_mines" in dash_data
    assert "recurring_patterns" in dash_data

    # Comparison Matrix
    comp_res = client.get("/api/corporate/comparison", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data) >= 6
    assert all("safety_index" in m for m in comp_data)
    assert all("compliance_score" in m for m in comp_data)

    # Issue Corporate Action
    act_res = client.post(
        "/api/corporate/actions",
        headers=headers,
        json={
            "mine_id": 1,
            "description": "Enterprise electrical overhaul mandate",
            "assigned_person": "Chief Safety Officer",
            "department": "Electrical & Mechanical",
            "priority": "HIGH",
            "severity": "HIGH",
        },
    )
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["source_type"] == "CORPORATE_DIRECTIVE"

def test_government_endpoints():
    token = get_token("regulator@gov.in", "Gov@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Dashboard
    dash_res = client.get("/api/government/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "metrics" in dash_data
    assert dash_data["metrics"]["registered_mines"] >= 6

    # National Risk Map
    risk_res = client.get("/api/government/risk-map", headers=headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert len(risk_data["mines"]) >= 6

    # Issue Statutory Directive
    dir_res = client.post(
        "/api/government/regulatory-actions",
        headers=headers,
        json={
            "mine_id": 1,
            "organization_id": 1,
            "action_type": "REGULATORY_DIRECTION",
            "description": "Mandatory DGMS Section 22/3 Compliance Directive",
            "deadline": "2026-10-15",
            "required_evidence": "Calibrated telemetry sensor readings and Mine Manager affidavit",
        },
    )
    assert dir_res.status_code == 200
    dir_data = dir_res.json()
    assert dir_data["action_id"].startswith("REG-2026-")

def test_report_generation():
    token = get_token("manager@bharatcoal.in", "Manager@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # PDF Report
    pdf_res = client.post(
        "/api/reports/generate",
        headers=headers,
        json={"report_type": "STATUTORY_MINE_COMPLIANCE", "file_format": "PDF"},
    )
    assert pdf_res.status_code == 200
    assert "download_url" in pdf_res.json()

    # Excel Report
    excel_res = client.post(
        "/api/reports/generate",
        headers=headers,
        json={"report_type": "STATUTORY_MINE_COMPLIANCE", "file_format": "EXCEL"},
    )
    assert excel_res.status_code == 200
    assert "download_url" in excel_res.json()
