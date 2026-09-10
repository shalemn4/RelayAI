import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.filter_compiler import FilterCompiler, FilterCompilerError
from backend.app.services.analytics_service import AnalyticsService
from backend.app.db.database import SessionLocal

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "operator@relayai.com",
        "password": "RelayOperator123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "operator@relayai.com"

def test_filter_compiler_valid():
    # Valid compound AST
    ast = {
        "id": "root",
        "operator": "AND",
        "conditions": [
            {"id": "c1", "field": "channel", "operator": "eq", "value": "sms"},
            {
                "id": "group1",
                "operator": "OR",
                "conditions": [
                    {"id": "c2", "field": "sentiment", "operator": "eq", "value": "negative"},
                    {"id": "c3", "field": "priority", "operator": "eq", "value": "urgent"}
                ]
            }
        ]
    }
    clause = FilterCompiler.compile_ast(ast)
    assert clause is not None

def test_filter_compiler_sql_injection_defense():
    # Attempting to inject unauthorized or malicious field names must raise an error
    malicious_ast = {
        "id": "hack",
        "operator": "AND",
        "conditions": [
            {"id": "h1", "field": "channel; DROP TABLE users; --", "operator": "eq", "value": "sms"}
        ]
    }
    with pytest.raises(FilterCompilerError):
        FilterCompiler.compile_ast(malicious_ast)

def test_list_conversations_with_ast_filter():
    import json
    ast = {
        "id": "test",
        "operator": "AND",
        "conditions": [
            {"id": "c1", "field": "channel", "operator": "eq", "value": "sms"}
        ]
    }
    response = client.get(f"/api/v1/conversations?filter_ast={json.dumps(ast)}")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    for item in data["items"]:
        assert item["channel"] == "sms"

def test_dynamic_analytics_overview():
    response = client.get("/api/v1/analytics/overview?period=7d")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "ai_acceptance_rate" in data["summary"]
    assert "conversations_count" in data["summary"]
    assert "channel_breakdown" in data
    assert len(data["channel_breakdown"]) >= 4

def test_ai_suggestion_and_takeover_flow():
    # 1. Fetch first conversation
    conv_resp = client.get("/api/v1/conversations?limit=1")
    conv_id = conv_resp.json()["items"][0]["id"]

    # 2. Request AI suggestion
    sug_resp = client.post(f"/api/v1/conversations/{conv_id}/ai-suggestion")
    assert sug_resp.status_code == 200
    sug = sug_resp.json()
    assert "text" in sug
    assert sug["confidence"] > 0.6
    assert len(sug["reasoning_steps"]) > 0

    # 3. Take over conversation
    takeover_resp = client.post(f"/api/v1/conversations/{conv_id}/takeover")
    assert takeover_resp.status_code == 200
    assert takeover_resp.json()["status"] == "human_assigned"

    # 4. Return to AI
    return_resp = client.post(f"/api/v1/conversations/{conv_id}/return-to-ai")
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "ai_active"
