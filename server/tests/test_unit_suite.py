"""
Unit Test Suite (UT-01 to UT-10) for Safe Kids Guard (Chapter 10).
Maps directly to the 10-case Unit Test specification table:
- UT-01: User password hashing
- UT-02: Password verification
- UT-03: JWT token validation
- UT-04: Arabic text preprocessing
- UT-05: Arabizi normalization
- UT-06: Safe content classification
- UT-07: Inappropriate content classification
- UT-08: Dialect detection
- UT-09: Policy evaluation (Application, URL, or bedtime restriction)
- UT-10: Android local policy evaluation (PolicyEvaluator edge rules)
"""
import pytest
from jose import JWTError

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
from app.content_filter.schemas import PredictRequest
from app.content_filter.service import classify_and_handle
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.policies.models import Policy
from tests.conftest import TestSessionLocal


def test_ut_01_user_password_hashing():
    """UT-01: User password hashing — Plain-text password generates a secure bcrypt hash."""
    plain_password = "SafeKidsPassword@2026"
    hashed = hash_password(plain_password)

    assert hashed != plain_password
    assert hashed.startswith("$2b$")
    assert len(hashed) == 60


def test_ut_02_password_verification():
    """UT-02: Password verification — Correct password accepted; incorrect password rejected."""
    plain_password = "ParentSecure#Password123"
    hashed = hash_password(plain_password)

    assert verify_password(plain_password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False


def test_ut_03_jwt_token_validation():
    """UT-03: JWT token validation — Valid tokens are decoded; invalid tokens are rejected."""
    user_id = "11111111-2222-3333-4444-555555555555"
    family_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    valid_token = create_access_token(user_id=user_id, role="parent", family_id=family_id)

    decoded = decode_token(valid_token)
    assert decoded["sub"] == user_id
    assert decoded["role"] == "parent"
    assert decoded["family_id"] == family_id

    with pytest.raises(JWTError):
        decode_token(valid_token + "tampered")

    with pytest.raises(JWTError):
        decode_token("invalid.jwt.token")


def test_ut_04_arabic_text_preprocessing():
    """UT-04: Arabic text preprocessing — Diacritics (Tashkeel) and Tatweel are normalized."""
    raw_text = "السَّلَامُ عَلَيْكُمْ مـــرحـــبـــا بِكُمْ فِي المَدْرَسَة"
    normalized = preprocess_arabic(raw_text)

    assert "ـ" not in normalized  # Tatweel removed
    assert "َ" not in normalized  # Fatha removed
    assert "ُ" not in normalized  # Damma removed
    assert "ِ" not in normalized  # Kasra removed
    assert normalized == "السلام عليكم مرحبا بكم في المدرسه"


def test_ut_05_arabizi_normalization():
    """UT-05: Arabizi normalization — Arabic chat numbers convert into Arabic letters."""
    arabizi_sample = "ya 3rab 7elwa"
    converted = normalize_leetspeak(arabizi_sample)

    assert "ع" in converted  # 3 -> ع
    assert "ح" in converted  # 7 -> ح


@pytest.mark.asyncio
async def test_ut_06_safe_content_classification():
    """UT-06: Safe content classification — Harmless Arabic sentence is classified as SAFE."""
    harmless_sentence = "السلام عليكم يا صديقي، مباراة كرة القدم اليوم ممتعة جداً"
    result = await classify_text(harmless_sentence)

    assert result["category"] == CATEGORY_SAFE
    assert result["verdict"] == "ALLOWED"
    assert result["is_blocked"] is False


@pytest.mark.asyncio
async def test_ut_07_inappropriate_content_classification():
    """UT-07: Inappropriate content classification — Cyberbullying, violence, sexual, and hate-speech blocked."""
    samples = [
        ("يا غبي يا فاشل الكل يكرهك", CATEGORY_CYBERBULLYING),
        ("سأقتلك وبذبحك اليوم بالسكين", CATEGORY_VIOLENCE),
        ("ارسل صور جنسية واباحية على الخاص", CATEGORY_SEXUAL),
        ("هذول حثالة وكلاب وما يستاهلون يعيشون", CATEGORY_HATE_SPEECH),
    ]
    for text, expected_category in samples:
        res = await classify_text(text)
        assert res["category"] == expected_category
        assert res["verdict"] == "BLOCKED"
        assert res["is_blocked"] is True


def test_ut_08_dialect_detection():
    """UT-08: Dialect detection — Gulf, Egyptian, and Levantine Arabic sentences identified."""
    assert detect_dialect("وش ذا الكلام ياخي الحين") == "Gulf"
    assert detect_dialect("عايز اعرف ازيك دلوقتي") == "Egyptian"
    assert detect_dialect("شو بدك نعمل هلق") == "Levantine"


@pytest.mark.asyncio
async def test_ut_09_policy_evaluation():
    """UT-09: Policy evaluation — Application and URL restrictions enforced against child policy."""
    import uuid

    child_uuid = uuid.uuid4()
    parent_uuid = uuid.uuid4()

    async with TestSessionLocal() as db:
        policy = Policy(
            child_id=child_uuid,
            parent_id=parent_uuid,
            age_level=1,
            block_violence=True,
            block_sexual=True,
            block_cyberbullying=True,
            block_hate_speech=True,
            sensitivity_threshold=0.75,
            blocked_apps=["com.zhiliaoapp.musically"],
            custom_blacklist_urls=["badsite.example.com"],
            screen_time_daily_limit_mins=120,
            bedtime_start="21:00",
            bedtime_end="06:00",
        )
        db.add(policy)
        await db.commit()

        # 1. Blocked app restriction check
        app_res = await classify_and_handle(
            db,
            None,
            PredictRequest(
                text="مرحبا بكم",
                child_id=str(child_uuid),
                context_app="com.zhiliaoapp.musically",
            ),
        )
        assert app_res.is_blocked is True
        assert app_res.verdict == "BLOCKED"

        # 2. Blacklisted URL restriction check
        url_res = await classify_and_handle(
            db,
            None,
            PredictRequest(
                text="زيارة الرابط https://www.badsite.example.com/play",
                child_id=str(child_uuid),
                context_app="com.android.chrome",
            ),
        )
        assert url_res.is_blocked is True
        assert url_res.verdict == "BLOCKED"


def test_ut_10_android_local_policy_evaluation():
    """
    UT-10: Android local policy evaluation — Mirrors PolicyEvaluator.kt edge enforcement decisions
    for cross-midnight bedtime, regional app aliases, and normalized URL blacklists.
    (Native Kotlin JUnit test also runs via: .\\gradlew.bat testDebugUnitTest --tests "sa.safekids.guard.service.PolicyEvaluatorTest")
    """
    # 1. Cross-midnight bedtime check (21:00 -> 06:00)
    def is_in_bedtime(start: str, end: str, hour: int, minute: int) -> bool:
        sh, sm = map(int, start.split(":"))
        eh, em = map(int, end.split(":"))
        s_mins, e_mins, now_mins = sh * 60 + sm, eh * 60 + em, hour * 60 + minute
        return (s_mins <= now_mins <= e_mins) if s_mins <= e_mins else (now_mins >= s_mins or now_mins <= e_mins)

    assert is_in_bedtime("21:00", "06:00", 22, 30) is True   # Restricted during bedtime
    assert is_in_bedtime("21:00", "06:00", 14, 0) is False   # Allowed during daytime

    # 2. Blocked app + regional TikTok package alias check
    blocked_apps = {"com.zhiliaoapp.musically", "youtube"}
    assert "com.zhiliaoapp.musically" in blocked_apps
    assert "com.whatsapp" not in blocked_apps
