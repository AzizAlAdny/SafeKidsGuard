"""
Tests for Reports and PDF Export (Phase 5).
"""
import pytest


@pytest.mark.asyncio
async def test_reports_summary_and_pdf_export(client):
    # 1. Register Parent & Child
    parent_res = await client.post("/auth/register", json={
        "email": "report_parent@test.com",
        "password": "Password123",
        "full_name": "الأب ماجد",
        "role": "parent",
        "whatsapp_phone": "966507788990",
    })
    parent_token = parent_res.json()["access_token"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    child_res = await client.post("/auth/children", headers=parent_headers, json={
        "email": "report_child@test.com",
        "password": "ChildPassword123",
        "full_name": "طارق ماجد",
    })
    child_id = child_res.json()["id"]

    # 2. Generate activity events (1 safe, 1 blocked)
    await client.post("/classification/predict", json={
        "text": "مرحباً يا صديقي كيف حالك اليوم والواجب المدرسي",
        "child_id": child_id,
        "context_app": "WhatsApp",
    })
    await client.post("/classification/predict", json={
        "text": "أنت غبي يا كلب وحيوان وسأضربك في المدرسة",
        "child_id": child_id,
        "context_app": "TikTok",
    })

    # 3. Fetch Report Summary
    sum_res = await client.get("/reports/summary?days=7", headers=parent_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["total_events"] == 2
    assert summary["blocked_events"] == 1
    assert summary["allowed_events"] == 1
    assert summary["safety_score"] == 50.0
    assert len(summary["threat_breakdown"]) >= 1
    assert summary["threat_breakdown"][0]["category"] == "CYBERBULLYING"

    # 4. Fetch PDF Export
    pdf_res = await client.get("/reports/export-pdf?days=7", headers=parent_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert b"%PDF-" in pdf_res.content[:10]  # Valid PDF binary signature
