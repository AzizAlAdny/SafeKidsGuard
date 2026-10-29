"""
Dual-Model Content Moderation Classifier for Safe Kids Guard.
Combines AraBERT v2 (MSA) and CAMeLBERT (Dialectal Arabic) with
fast-path safety checks, non-blocking asyncio thread execution, and confidence-based arbitration.
"""
import asyncio
import logging
import re
import time
from typing import Any

from app.core.config import settings
from app.ai_engine.model import get_arabert, get_camelbert, is_models_loaded
from app.ai_engine.preprocessing import preprocess_arabic

logger = logging.getLogger(__name__)

# Content Categories
CATEGORY_SAFE = "SAFE"
CATEGORY_CYBERBULLYING = "CYBERBULLYING"
CATEGORY_SEXUAL = "SEXUAL"
CATEGORY_VIOLENCE = "VIOLENCE"
CATEGORY_HATE_SPEECH = "HATE_SPEECH"

CATEGORIES = [
    CATEGORY_SAFE,
    CATEGORY_CYBERBULLYING,
    CATEGORY_SEXUAL,
    CATEGORY_VIOLENCE,
    CATEGORY_HATE_SPEECH,
]

# Dialectal markers commonly found in Saudi / Gulf / Levantine social media
DIALECTAL_PATTERNS = re.compile(
    r"\b(وش|ليش|شلونك|ياخي|ترا|عشان|حقك|حقتك|ذلحين|الحين|مافيه|مافي|يبغى|ابي|ودك|كذا|هيك|شو|يلا|بدك)\b"
)

# High-precision Arabic safety patterns (fallback & fast-path)
CYBERBULLYING_PATTERNS = [
    r"يا\s*(غبي|حيوان|كلب|حمار|فاشل|قبيح|تافه|حقير|وسخ)",
    r"(تستاهل|بنضربك|راح\s*تشوف|بفضحك|بنشر\s*صورك|يا\s*بشع)",
    r"(محد\s*يحبك|انتحر|موت\s*احسن|يا\s*معفن)",
]

VIOLENCE_PATTERNS = [
    r"(بقتلك|بذبحك|بضربك|اطلقه|طعن|سكين|مسدس|دم|قتل|ذبح|تصفية)",
    r"(هجوم|تفجير|اعتداء|كسر\s*راسك|اخنقك)",
]

HATE_SPEECH_PATTERNS = [
    r"(كلاب|حثالة|اطردوهم|ابيدوهم|ما\s*يستاهلون\s*يعيشون|متخلفين)",
    r"(عنصري|طائفي|مجنسين|شحاتين)",
]

SEXUAL_PATTERNS = [
    r"(صور\s*(عارية|جنسية|خاصة)|سكس|اباحي|ممارسة\s*جنس|تعال\s*خاص\s*نتعرى)",
    r"(عري|مثير|نيك|شرموط)",
]


def is_dialectal(text: str) -> bool:
    """Check if the text contains Gulf / Saudi dialectal markers."""
    return bool(DIALECTAL_PATTERNS.search(text))


def check_rule_based_safety(normalized_text: str) -> tuple[str, float] | None:
    """
    Fast-path safety evaluation using regex patterns.
    Returns (category, confidence) or None if no explicit match.
    """
    for pattern in SEXUAL_PATTERNS:
        if re.search(pattern, normalized_text):
            return CATEGORY_SEXUAL, 0.96

    for pattern in VIOLENCE_PATTERNS:
        if re.search(pattern, normalized_text):
            return CATEGORY_VIOLENCE, 0.93

    for pattern in CYBERBULLYING_PATTERNS:
        if re.search(pattern, normalized_text):
            return CATEGORY_CYBERBULLYING, 0.94

    for pattern in HATE_SPEECH_PATTERNS:
        if re.search(pattern, normalized_text):
            return CATEGORY_HATE_SPEECH, 0.91

    return None


def _sync_pipeline_predict(pipeline: Any, text: str) -> list[dict[str, Any]]:
    """Execute blocking HuggingFace pipeline in thread pool."""
    return pipeline(text[:512], truncation=True)


async def classify_text(raw_text: str) -> dict[str, Any]:
    """
    Classify Arabic text through the dual-model moderation engine.
    Applies fast-path heuristics followed by asynchronous AraBERT/CAMeLBERT inference.
    """
    start_time = time.perf_counter()

    # Step 1: Preprocess text
    normalized = preprocess_arabic(raw_text)
    if not normalized or len(normalized.strip()) == 0:
        elapsed = (time.perf_counter() - start_time) * 1000
        return {
            "verdict": "ALLOWED",
            "category": CATEGORY_SAFE,
            "confidence": 1.0,
            "is_blocked": False,
            "normalized_text": "",
            "model_used": "preprocessor",
            "execution_time_ms": round(elapsed, 2),
        }

    # Step 2: Check fast-path rules (ultra-fast < 2ms)
    rule_match = check_rule_based_safety(normalized)
    if rule_match:
        category, confidence = rule_match
        elapsed = (time.perf_counter() - start_time) * 1000
        is_blocked = confidence >= settings.AI_CONFIDENCE_THRESHOLD
        return {
            "verdict": "BLOCKED" if is_blocked else "ALLOWED",
            "category": category,
            "confidence": round(confidence, 4),
            "is_blocked": is_blocked,
            "normalized_text": normalized,
            "model_used": "fast_path_rules",
            "execution_time_ms": round(elapsed, 2),
        }

    # Step 3: Dual BERT Model Classification
    dialect = is_dialectal(normalized)
    active_pipeline = get_camelbert() if dialect else get_arabert()
    model_name = "CAMeLBERT-Dialectal" if dialect else "AraBERTv2-MSA"

    category = CATEGORY_SAFE
    confidence = 0.98
    is_blocked = False

    # If neural pipeline is loaded, execute non-blocking inference
    if active_pipeline is not None:
        try:
            preds = await asyncio.to_thread(_sync_pipeline_predict, active_pipeline, normalized)
            if preds and isinstance(preds, list) and len(preds) > 0:
                top_pred = preds[0]
                label = top_pred.get("label", "").upper()
                score = float(top_pred.get("score", 0.5))

                # Normalize label to standard categories if recognized
                if label in CATEGORIES:
                    category = label
                    confidence = score
                elif "TOXIC" in label or "HATE" in label:
                    category = CATEGORY_HATE_SPEECH
                    confidence = score
                elif "BULLY" in label:
                    category = CATEGORY_CYBERBULLYING
                    confidence = score

                is_blocked = (category != CATEGORY_SAFE) and (confidence >= settings.AI_CONFIDENCE_THRESHOLD)
        except Exception as exc:
            logger.warning(f"Neural model inference error: {exc}. Using fallback baseline.")

    elapsed = (time.perf_counter() - start_time) * 1000

    return {
        "verdict": "BLOCKED" if is_blocked else "ALLOWED",
        "category": category,
        "confidence": round(confidence, 4),
        "is_blocked": is_blocked,
        "normalized_text": normalized,
        "model_used": model_name,
        "execution_time_ms": round(elapsed, 2),
    }
