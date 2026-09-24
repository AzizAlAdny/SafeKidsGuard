"""
Tests for Classification and Content Moderation Pipeline (Phase 2).
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.core.database import Base, get_db
from app.ai_engine.classifier import (
    CATEGORY_CYBERBULLYING,
    CATEGORY_HATE_SPEECH,
    CATEGORY_SAFE,
    CATEGORY_SEXUAL,
    CATEGORY_VIOLENCE,
    classify_text,
)

# Fixtures (client, setup_db, override_get_db) provided by conftest.py


# ── Unit Tests: Classifier ─────────────────────────────────

@pytest.mark.asyncio
async def test_classify_safe_content():
    text = "السلام عليكم يا أخي، كيف كان يومك في المدرسة؟"
    res = await classify_text(text)
    assert res["verdict"] == "ALLOWED"
    assert res["category"] == CATEGORY_SAFE
    assert res["is_blocked"] is False
    assert res["confidence"] >= 0.75


@pytest.mark.asyncio
async def test_classify_cyberbullying():
    text = "يا غبي يا فاشل ما تفهم شي ومحد يحبك"
    res = await classify_text(text)
    assert res["verdict"] == "BLOCKED"
    assert res["category"] == CATEGORY_CYBERBULLYING
    assert res["is_blocked"] is True
    assert res["confidence"] >= 0.75


@pytest.mark.asyncio
async def test_classify_violence():
    text = "بقتلك وبذبحك اليوم بالسكين"
    res = await classify_text(text)
    assert res["verdict"] == "BLOCKED"
    assert res["category"] == CATEGORY_VIOLENCE
    assert res["is_blocked"] is True


@pytest.mark.asyncio
async def test_classify_sexual_content():
    text = "ارسل صور جنسية واباحية على الخاص"
    res = await classify_text(text)
    assert res["verdict"] == "BLOCKED"
    assert res["category"] == CATEGORY_SEXUAL
    assert res["is_blocked"] is True


@pytest.mark.asyncio
async def test_classify_hate_speech():
    text = "هذول حثالة وكلاب وما يستاهلون يعيشون بيننا"
    res = await classify_text(text)
    assert res["verdict"] == "BLOCKED"
    assert res["category"] == CATEGORY_HATE_SPEECH
    assert res["is_blocked"] is True


# ── Integration Tests: API Endpoints ───────────────────────

@pytest.mark.asyncio
async def test_predict_endpoint_flow(client):
    # 1. Register Parent with WhatsApp
    parent_resp = await client.post("/auth/register", json={
        "email": "parent_mod@test.com",
        "password": "Password123",
        "full_name": "الأب سلطان",
        "role": "parent",
        "whatsapp_phone": "966551234567",
    })
    assert parent_resp.status_code == 201
    parent_token = parent_resp.json()["access_token"]

    # 2. Create Child Account
    child_resp = await client.post(
        "/auth/children",
        headers={"Authorization": f"Bearer {parent_token}"},
        json={
            "email": "child_mod@test.com",
            "password": "ChildPassword123",
            "full_name": "سلطان الصغير",
            "nickname": "سلطان",
        },
    )
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    # 3. Predict Safe Text
    safe_pred = await client.post("/classification/predict", json={
        "text": "مرحبا صديقي هل نلعب سوياً اليوم؟",
        "child_id": child_id,
        "context_app": "whatsapp",
    })
    assert safe_pred.status_code == 200
    assert safe_pred.json()["is_blocked"] is False
    assert safe_pred.json()["category"] == "SAFE"

    # 4. Predict Cyberbullying Threat
    threat_pred = await client.post("/classification/predict", json={
        "text": "يا غبي يا فاشل راح نضربك بكرة",
        "child_id": child_id,
        "context_app": "tiktok",
    })
    assert threat_pred.status_code == 200
    threat_data = threat_pred.json()
    assert threat_data["is_blocked"] is True
    assert threat_data["verdict"] == "BLOCKED"
    assert threat_data["category"] == "CYBERBULLYING"

    # 5. Fetch Parent Alerts List
    alerts_resp = await client.get("/alerts", headers={"Authorization": f"Bearer {parent_token}"})
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert len(alerts) >= 1
    assert alerts[0]["category"] == "CYBERBULLYING"
    assert alerts[0]["context_app"] == "tiktok"
