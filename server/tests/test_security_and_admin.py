"""
Comprehensive Security, RBAC, Device Pairing, Arabic NLP Regression, and Admin Tests.
Verifies Phases 1-6 of the Safe Kids Guard Implementation Plan.
"""
import pytest
from sqlalchemy import select

from app.ai_engine.classifier import (
    CATEGORY_CYBERBULLYING,
    CATEGORY_HATE_SPEECH,
    CATEGORY_SAFE,
    CATEGORY_SEXUAL,
    CATEGORY_VIOLENCE,
    classify_text,
    detect_dialect,
)
from app.ai_engine.preprocessing import normalize_leetspeak, preprocess_arabic
from app.auth.models import User
from app.core.security import decode_token, hash_password, verify_password
from tests.conftest import TestSessionLocal


# ── 1. Unit Tests: Security & Arabic Preprocessing (UT-01 to UT-03) ──────────

def test_ut01_long_arabic_password_not_truncated():
    """UT-01: Passwords exceeding 72 UTF-8 bytes must not silently truncate."""
    base_pwd = "كلمة_مرور_عربية_طويلة_جداً_تتجاوز_اثنين_وسبعين_بايت_1234567890!@#"
    modified_pwd = "كلمة_مرور_عربية_طويلة_جداً_تتجاوز_اثنين_وسبعين_بايت_1234567890!@$"
    assert len(base_pwd.encode("utf-8")) > 72

    hashed = hash_password(base_pwd)
    assert verify_password(base_pwd, hashed) is True
    assert verify_password(modified_pwd, hashed) is False


def test_ut02_leetspeak_preserves_pure_numbers():
    """UT-02: Pure numbers like '2026' and '75' must not be corrupted into Arabic letters."""
    text = "عام 2026 الساعة 75 و 3a2el"
    processed = normalize_leetspeak(text)
    assert "2026" in processed
    assert "75" in processed
    assert "ع" in processed


def test_ut03_html_stripping_in_preprocess():
    """UT-03: HTML and script tags must be stripped during Arabic preprocessing."""
    raw = "<div>مرحباً <script>alert(1)</script>بكم في المدرسة</div>"
    cleaned = preprocess_arabic(raw)
    assert "<div" not in cleaned
    assert "<script" not in cleaned
    assert "alert" not in cleaned
    assert "مرحبا بكم في المدرسه" in cleaned


# ── 2. Arabic NLP False-Positive & Dialect Accuracy Tests (NLP-01 & NLP-02) ──

@pytest.mark.asyncio
async def test_nlp01_false_positive_regression_on_dam_words():
    """
    NLP-01: Benign Arabic sentences containing the substring 'دم' (e.g., كرة القدم, القادم, خدمة, استخدام, دمية)
    or benign medical contexts (تبرع بالدم) must NEVER be misclassified as VIOLENCE.
    """
    benign_sentences = [
        "مباراة كرة القدم اليوم ممتعة جداً",
        "الأسبوع القادم سنذهب في رحلة مدرسية",
        "خدمة العملاء في المكتبة ممتازة",
        "دمية جميلة للأطفال الصغار",
        "استخدام الحاسوب للتعلم البرمجة مفيد",
        "حملة التبرع بالدم في المستشفى الجامعي",
        "الوقاية ومكافحة المخدرات واجب وطني",
    ]
    for sentence in benign_sentences:
        res = await classify_text(sentence)
        assert res["category"] == CATEGORY_SAFE, f"False positive on: {sentence} -> {res}"
        assert res["is_blocked"] is False


@pytest.mark.asyncio
async def test_nlp02_normalized_and_dialectal_threats():
    """
    NLP-02: Normalized threats (أ/إ/آ, ة) and regional dialects (Gulf, Egyptian, Levantine)
    must be accurately detected with >= 85% accuracy.
    """
    threat_cases = [
        ("سأقتلك بالسكين اليوم", CATEGORY_VIOLENCE),
        ("طريقة صنع قنبلة متفجرة", CATEGORY_VIOLENCE),
        ("عايز اقتله بالمسدس دلوقتي", CATEGORY_VIOLENCE),
        ("بدي انتحر واخلص من حياتي", CATEGORY_VIOLENCE),
        ("محتوى كراهية وعنصرية مقيت", CATEGORY_HATE_SPEECH),
        ("يا غبي يا فاشل الكل يكرهك", CATEGORY_CYBERBULLYING),
        ("وش ذا الغباء انت فاشل ومحد يحبك", CATEGORY_CYBERBULLYING),
        ("ارسل مقاطع إباحية وصور عارية", CATEGORY_SEXUAL),
    ]
    for text, expected_category in threat_cases:
        res = await classify_text(text)
        assert res["category"] == expected_category, f"Mismatch on '{text}': got {res['category']}"
        assert res["is_blocked"] is True
        assert res["confidence"] >= 0.75

    # Verify dialect detection helper
    assert detect_dialect("وش ذا الكلام ياخي الحين") == "Gulf"
    assert detect_dialect("عايز اعرف ازيك دلوقتي") == "Egyptian"
    assert detect_dialect("شو بدك نعمل هلق") == "Levantine"


# ── 3. Device Pairing, JWT Claims & Logout Revocation (IT-01 & SEC-01) ───────

@pytest.mark.asyncio
async def test_it01_device_pairing_and_unpair_flow(client):
    """IT-01: End-to-end 6-digit PIN generation, device pairing, JWT family_id claim, and protected unpairing."""
    # 1. Register Parent
    reg = await client.post("/auth/register", json={
        "email": "pair_parent@test.com",
        "password": "ParentStrongPassword123",
        "full_name": "الأب تركي",
    })
    assert reg.status_code == 201
    parent_token = reg.json()["access_token"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    # Verify parent JWT contains family_id
    parent_claims = decode_token(parent_token)
    assert parent_claims.get("family_id") is not None

    # 2. Create Child Account (even without explicit email/password, as Dashboard supports)
    child_res = await client.post("/auth/children", headers=parent_headers, json={
        "full_name": "نواف تركي",
        "nickname": "نواف",
    })
    assert child_res.status_code == 201
    child_id = child_res.json()["id"]

    # 3. Generate 6-digit Pairing PIN
    pin_res = await client.post(f"/auth/children/{child_id}/pairing-pin", headers=parent_headers)
    assert pin_res.status_code == 200
    pin_data = pin_res.json()
    assert len(pin_data["pairing_pin"]) == 6
    formatted_pin = pin_data["formatted_pin"]

    # 4. Pair Android Device using formatted PIN
    pair_res = await client.post("/auth/pair-device", json={"pairing_pin": formatted_pin})
    assert pair_res.status_code == 200
    paired = pair_res.json()
    assert paired["child_id"] == child_id
    child_token = paired["access_token"]
    child_headers = {"Authorization": f"Bearer {child_token}"}

    # 5. Reusing the consumed one-time PIN must fail with 401
    reuse_res = await client.post("/auth/pair-device", json={"pairing_pin": formatted_pin})
    assert reuse_res.status_code == 401

    # 6. Unpairing with wrong parent password must fail with 401
    bad_unpair = await client.post(
        "/auth/unpair-device",
        headers=child_headers,
        json={"parent_password": "WrongPassword"},
    )
    assert bad_unpair.status_code == 401

    # 7. Unpairing with valid parent password succeeds
    good_unpair = await client.post(
        "/auth/unpair-device",
        headers=child_headers,
        json={"parent_password": "ParentStrongPassword123"},
    )
    assert good_unpair.status_code == 200


@pytest.mark.asyncio
async def test_sec01_logout_revokes_refresh_token(client):
    """SEC-01: Calling POST /auth/logout revokes the refresh token."""
    reg = await client.post("/auth/register", json={
        "email": "logout_parent@test.com",
        "password": "Password123",
        "full_name": "خالد",
    })
    access_token = reg.json()["access_token"]
    refresh_token = reg.json()["refresh_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    logout_res = await client.post("/auth/logout", headers=headers, json={"refresh_token": refresh_token})
    assert logout_res.status_code == 200

    refresh_res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 401


# ── 4. Auth, IDOR Prevention & Policy URL Blacklist (AZ-01, AZ-02, IT-03) ────

@pytest.mark.asyncio
async def test_az01_az02_idor_and_unauthenticated_protection(client):
    """
    AZ-01 & AZ-02:
    - Unauthenticated calls to /classification/predict must be rejected (401/403).
    - Parent A cannot classify or inject activity for Parent B's child (403 Forbidden).
    - Child accounts cannot access GET /activity or GET /reports/summary (403 Forbidden).
    """
    # Unauthenticated predict -> 401/403
    unauth = await client.post("/classification/predict", json={
        "text": "مرحباً",
        "child_id": "00000000-0000-0000-0000-000000000001",
    })
    assert unauth.status_code in (401, 403)

    # Register Parent A and Parent B
    pa = await client.post("/auth/register", json={
        "email": "parent_a@test.com",
        "password": "Password123",
        "full_name": "Parent A",
    })
    token_a = pa.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    pb = await client.post("/auth/register", json={
        "email": "parent_b@test.com",
        "password": "Password123",
        "full_name": "Parent B",
    })
    token_b = pb.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Parent B creates a child
    child_b_res = await client.post("/auth/children", headers=headers_b, json={
        "email": "child_b@test.com",
        "password": "ChildPassword123",
        "full_name": "Child B",
    })
    child_b_id = child_b_res.json()["id"]

    # Parent A attempts to classify content for Child B -> 403 Forbidden
    idor_predict = await client.post("/classification/predict", headers=headers_a, json={
        "text": "يا غبي",
        "child_id": child_b_id,
    })
    assert idor_predict.status_code == 403

    # Parent A attempts to inject activity for Child B -> 403 Forbidden
    idor_activity = await client.post("/activity", headers=headers_a, json={
        "child_id": child_b_id,
        "content_snippet": "Injected",
        "category": "SAFE",
        "confidence": 0.99,
        "verdict": "ALLOWED",
    })
    assert idor_activity.status_code == 403

    # Child B logs in and attempts to view parent reports/activity -> 403 Forbidden
    child_login = await client.post("/auth/login", json={
        "email": "child_b@test.com",
        "password": "ChildPassword123",
    })
    child_b_headers = {"Authorization": f"Bearer {child_login.json()['access_token']}"}

    assert (await client.get("/activity", headers=child_b_headers)).status_code == 403
    assert (await client.get("/reports/summary", headers=child_b_headers)).status_code == 403


@pytest.mark.asyncio
async def test_it03_custom_blacklist_url_and_child_appeal(client):
    """IT-03 & UC-C5: Custom blacklisted URLs are blocked and child can submit an access appeal."""
    reg = await client.post("/auth/register", json={
        "email": "url_parent@test.com",
        "password": "Password123",
        "full_name": "الأب ناصر",
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    child_res = await client.post("/auth/children", headers=headers, json={
        "email": "url_child@test.com",
        "password": "ChildPassword123",
        "full_name": "ريان ناصر",
    })
    child_id = child_res.json()["id"]

    # Configure blacklisted URL in policy
    await client.put(f"/policies/{child_id}", headers=headers, json={
        "custom_blacklist_urls": ["badsite.example.com"],
    })

    # Predict benign text containing blacklisted URL -> BLOCKED
    pred = await client.post("/classification/predict", headers=headers, json={
        "text": "تصفح الموقع https://badsite.example.com/games الآن",
        "child_id": child_id,
        "context_app": "com.android.chrome",
    })
    assert pred.status_code == 200
    pred_data = pred.json()
    assert pred_data["is_blocked"] is True
    assert pred_data["verdict"] == "BLOCKED"
    assert "badsite.example.com" in (pred_data["block_reason"] or "")

    # Child submits "Request Access" appeal (UC-C5)
    appeal_res = await client.post("/alerts/request-access", headers=headers, json={
        "child_id": child_id,
        "alert_id": pred_data["alert_id"],
        "reason": "أحتاج هذا الموقع للواجب المدرسي",
        "context_app": "com.android.chrome",
    })
    assert appeal_res.status_code == 200
    assert appeal_res.json()["review_status"] == "ACCESS_REQUESTED"


# ── 5. Administrator Module End-to-End Tests (AZ-03 & Phase 5) ───────────────

@pytest.mark.asyncio
async def test_az03_admin_module_full_lifecycle(client):
    """AZ-03 & Phase 5: Admin can manage users, view AI metrics, review flagged content, and update settings."""
    # 1. Register a normal parent and an admin user
    parent_reg = await client.post("/auth/register", json={
        "email": "normal_parent@test.com",
        "password": "Password123",
        "full_name": "ولي أمر عادي",
    })
    parent_token = parent_reg.json()["access_token"]
    parent_id = parent_reg.json()["user"]["id"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    # Normal parent cannot access /admin/users -> 403
    forbidden_admin = await client.get("/admin/users", headers=parent_headers)
    assert forbidden_admin.status_code == 403

    # Create a child and generate a flagged alert
    child_res = await client.post("/auth/children", headers=parent_headers, json={
        "full_name": "طفل التجربة",
    })
    child_id = child_res.json()["id"]

    pred_res = await client.post("/classification/predict", headers=parent_headers, json={
        "text": "يا غبي يا فاشل الكل يكرهك",
        "child_id": child_id,
        "context_app": "tiktok",
    })
    alert_id = pred_res.json()["alert_id"]

    # Register admin account and elevate role in DB
    admin_reg = await client.post("/auth/register", json={
        "email": "sysadmin@safekids.sa",
        "password": "AdminPassword123",
        "full_name": "مدير النظام",
    })
    admin_id = admin_reg.json()["user"]["id"]

    async with TestSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "sysadmin@safekids.sa"))
        admin_user = res.scalar_one()
        admin_user.role = "admin"
        await session.commit()

    admin_login = await client.post("/auth/login", json={
        "email": "sysadmin@safekids.sa",
        "password": "AdminPassword123",
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # 2. Admin lists users (FR10)
    users_res = await client.get("/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 3

    # 3. Admin updates child policy directly (VULN-07 fix verification)
    admin_pol = await client.put(
        f"/policies/{child_id}",
        headers=admin_headers,
        json={"screen_time_daily_limit_mins": 60},
    )
    assert admin_pol.status_code == 200
    assert admin_pol.json()["screen_time_daily_limit_mins"] == 60

    # 4. Admin fetches AI metrics (FR11, FR13)
    metrics_res = await client.get("/admin/ai-metrics", headers=admin_headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_predictions"] >= 1
    assert metrics["total_blocked"] >= 1

    # 5. Admin reviews flagged alert and marks as APPROVED_FALSE_POSITIVE (UC-A4)
    flagged_res = await client.get("/admin/flagged", headers=admin_headers)
    assert flagged_res.status_code == 200
    assert len(flagged_res.json()) >= 1

    review_res = await client.patch(
        f"/admin/flagged/{alert_id}",
        headers=admin_headers,
        json={"review_status": "APPROVED_FALSE_POSITIVE"},
    )
    assert review_res.status_code == 200
    assert review_res.json()["review_status"] == "APPROVED_FALSE_POSITIVE"
    assert review_res.json()["verdict"] == "ALLOWED"

    # 6. Admin updates system settings (FR12, UC-A6)
    settings_res = await client.put(
        "/admin/settings",
        headers=admin_headers,
        json={"ai_confidence_threshold": 0.80},
    )
    assert settings_res.status_code == 200
    assert settings_res.json()["ai_confidence_threshold"] == 0.80
    # Restore default threshold
    await client.put("/admin/settings", headers=admin_headers, json={"ai_confidence_threshold": 0.75})

    # 7. Admin deactivates parent user and verifies deactivated user cannot access API
    deact_res = await client.patch(
        f"/admin/users/{parent_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    blocked_me = await client.get("/auth/me", headers=parent_headers)
    assert blocked_me.status_code == 403
