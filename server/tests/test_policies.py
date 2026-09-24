"""
Tests for Policies API (Phase 4).
"""
import pytest


@pytest.mark.asyncio
async def test_get_and_update_policy(client):
    # 1. Register Parent
    parent_res = await client.post("/auth/register", json={
        "email": "policy_parent@test.com",
        "password": "Password123",
        "full_name": "الأب سلطان",
        "role": "parent",
        "whatsapp_phone": "966509988771",
    })
    assert parent_res.status_code == 201
    parent_token = parent_res.json()["access_token"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    # 2. Create Child Account
    child_res = await client.post("/auth/children", headers=parent_headers, json={
        "email": "child_sultan@test.com",
        "password": "ChildPassword123",
        "full_name": "سعد سلطان",
        "age": 10,
    })
    assert child_res.status_code == 201
    child_data = child_res.json()
    child_id = child_data["id"]

    # 3. Get Default Policy (Auto-created)
    get_res = await client.get(f"/policies/{child_id}", headers=parent_headers)
    assert get_res.status_code == 200
    policy = get_res.json()
    assert policy["child_id"] == child_id
    assert policy["block_violence"] is True
    assert policy["block_sexual"] is True
    assert policy["sensitivity_threshold"] == 0.75
    assert policy["screen_time_daily_limit_mins"] == 120

    # 4. Update Policy
    update_res = await client.put(
        f"/policies/{child_id}",
        headers=parent_headers,
        json={
            "age_level": 2,
            "block_violence": False,  # Allow violence for teen
            "sensitivity_threshold": 0.85,
            "blocked_apps": ["com.zhiliaoapp.musically", "com.instagram.android"],
            "custom_blacklist_urls": ["badsite.org"],
            "screen_time_daily_limit_mins": 90,
        },
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["age_level"] == 2
    assert updated["block_violence"] is False
    assert updated["sensitivity_threshold"] == 0.85
    assert "com.zhiliaoapp.musically" in updated["blocked_apps"]
    assert updated["screen_time_daily_limit_mins"] == 90

    # 5. Child account can read its own policy
    child_login = await client.post("/auth/login", json={
        "email": "child_sultan@test.com",
        "password": "ChildPassword123",
    })
    assert child_login.status_code == 200
    child_token = child_login.json()["access_token"]
    child_headers = {"Authorization": f"Bearer {child_token}"}

    child_get = await client.get(f"/policies/{child_id}", headers=child_headers)
    assert child_get.status_code == 200
    assert child_get.json()["screen_time_daily_limit_mins"] == 90


@pytest.mark.asyncio
async def test_unauthorized_policy_update(client):
    # Register Parent 1
    p1 = await client.post("/auth/register", json={
        "email": "p1@test.com",
        "password": "Password123",
        "full_name": "Parent 1",
    })
    token1 = p1.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # Register Parent 2
    p2 = await client.post("/auth/register", json={
        "email": "p2@test.com",
        "password": "Password123",
        "full_name": "Parent 2",
    })
    token2 = p2.json()["access_token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # Parent 1 creates child
    child_res = await client.post("/auth/children", headers=h1, json={
        "email": "child_p1@test.com",
        "password": "Password123",
        "full_name": "Child P1",
    })
    child_id = child_res.json()["id"]

    # Parent 2 tries to access/update Parent 1's child policy -> 403
    forbidden_get = await client.get(f"/policies/{child_id}", headers=h2)
    assert forbidden_get.status_code == 403

    forbidden_put = await client.put(
        f"/policies/{child_id}",
        headers=h2,
        json={"block_sexual": False},
    )
    assert forbidden_put.status_code == 403
