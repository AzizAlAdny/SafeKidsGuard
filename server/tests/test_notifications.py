"""
Tests for Notification Preferences and WhatsApp Testing API (Phase 3).
"""
import pytest


@pytest.mark.asyncio
async def test_get_and_update_notification_preferences(client):
    # 1. Register Parent
    reg = await client.post("/auth/register", json={
        "email": "notif_parent@test.com",
        "password": "Password123",
        "full_name": "الأب عمر",
        "role": "parent",
        "whatsapp_phone": "966501112233",
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Preferences
    get_res = await client.get("/notifications/preferences", headers=headers)
    assert get_res.status_code == 200
    prefs = get_res.json()
    assert prefs["whatsapp_phone"] == "966501112233"
    assert prefs["whatsapp_enabled"] is True
    assert prefs["web_push_enabled"] is False

    # 3. Update Preferences
    update_res = await client.put(
        "/notifications/preferences",
        headers=headers,
        json={
            "whatsapp_phone": "0559988776",  # Local format should be converted to 966559988776
            "whatsapp_enabled": True,
            "web_push_token": "fcm_token_sample_12345",
            "web_push_enabled": True,
        },
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["whatsapp_phone"] == "966559988776"
    assert updated["web_push_enabled"] is True
    assert updated["web_push_token"] == "fcm_token_sample_12345"


@pytest.mark.asyncio
async def test_invalid_phone_in_preferences(client):
    reg = await client.post("/auth/register", json={
        "email": "invalid_phone_parent@test.com",
        "password": "Password123",
        "full_name": "الأب خالد",
        "role": "parent",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit invalid phone
    update_res = await client.put(
        "/notifications/preferences",
        headers=headers,
        json={"whatsapp_phone": "invalid_123"},
    )
    assert update_res.status_code == 422


@pytest.mark.asyncio
async def test_test_whatsapp_endpoint(client):
    reg = await client.post("/auth/register", json={
        "email": "test_wa_parent@test.com",
        "password": "Password123",
        "full_name": "الأب بدر",
        "role": "parent",
        "whatsapp_phone": "966501234567",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_res = await client.post("/notifications/test-whatsapp", headers=headers, json={})
    assert test_res.status_code == 200
    res_data = test_res.json()
    assert "phone" in res_data
    assert res_data["phone"] == "966501234567"
    assert "message" in res_data
