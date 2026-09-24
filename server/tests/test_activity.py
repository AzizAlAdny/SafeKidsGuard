"""
Tests for Activity Log and Policy enforcement integration (Phase 4).
"""
import pytest


@pytest.mark.asyncio
async def test_activity_logging_and_policy_enforcement(client):
    # 1. Register Parent & Child
    parent_res = await client.post("/auth/register", json={
        "email": "act_parent@test.com",
        "password": "Password123",
        "full_name": "الأب فيصل",
        "role": "parent",
        "whatsapp_phone": "966503344556",
    })
    parent_token = parent_res.json()["access_token"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    child_res = await client.post("/auth/children", headers=parent_headers, json={
        "email": "act_child@test.com",
        "password": "ChildPassword123",
        "full_name": "بندر فيصل",
    })
    child_id = child_res.json()["id"]

    # 2. Predict with Violence content (Default Policy: block_violence is True)
    pred_res1 = await client.post("/classification/predict", json={
        "text": "سأقوم بقتلك وسفك دمائك بالسكين",
        "child_id": child_id,
        "context_app": "YouTube",
    })
    assert pred_res1.status_code == 200
    p1 = pred_res1.json()
    assert p1["category"] == "VIOLENCE"
    assert p1["is_blocked"] is True

    # 3. Query Activity Log: Event should be recorded with BLOCKED verdict
    act_res = await client.get("/activity", headers=parent_headers)
    assert act_res.status_code == 200
    activities = act_res.json()
    assert activities["total"] >= 1
    item = activities["items"][0]
    assert item["child_id"] == child_id
    assert item["category"] == "VIOLENCE"
    assert item["verdict"] == "BLOCKED"
    assert item["app_name"] == "YouTube"

    # 4. Now modify Policy to disable block_violence
    update_res = await client.put(
        f"/policies/{child_id}",
        headers=parent_headers,
        json={"block_violence": False},
    )
    assert update_res.status_code == 200

    # 5. Predict again with violence: policy should allow it now
    pred_res2 = await client.post("/classification/predict", json={
        "text": "سأقوم بقتلك وسفك دمائك بالسكين",
        "child_id": child_id,
        "context_app": "CallOfDuty",
    })
    assert pred_res2.status_code == 200
    p2 = pred_res2.json()
    assert p2["category"] == "VIOLENCE"
    assert p2["is_blocked"] is False
    assert p2["verdict"] == "ALLOWED"

    # 6. Check that activity log recorded the ALLOWED event too
    act_res2 = await client.get("/activity", headers=parent_headers)
    assert act_res2.status_code == 200
    activities2 = act_res2.json()
    assert activities2["total"] >= 2
    latest = activities2["items"][0]
    assert latest["verdict"] == "ALLOWED"
    assert latest["app_name"] == "CallOfDuty"
