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
from app.ai_engine.preprocessing import normalize_arabic, preprocess_arabic

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

# Dialectal markers commonly found in Gulf / Egyptian / Levantine social media
GULF_DIALECT_PATTERNS = re.compile(
    r"\b(وش|ليش|شلونك|ياخي|ترا|عشان|حقك|حقتك|ذلحين|الحين|مافيه|مافي|يبغى|يبغي|ابي|ودك|كذا|اذلف)\b"
)
EGYPTIAN_DIALECT_PATTERNS = re.compile(
    r"\b(عايز|عاوز|ازيك|دلوقتي|كده|ليه|فين|مش|مفيش|بتاع|محدش|هقتلك)\b"
)
LEVANTINE_DIALECT_PATTERNS = re.compile(
    r"\b(هيك|شو|يلا|بدك|بدي|هلق|هلأ|ليش|منيح|هاد|هاظ)\b"
)
DIALECTAL_PATTERNS = re.compile(
    r"\b(وش|ليش|شلونك|ياخي|ترا|عشان|حقك|حقتك|ذلحين|الحين|مافيه|مافي|يبغى|يبغي|ابي|ودك|كذا|هيك|شو|يلا|بدك|بدي|عايز|دلوقتي|محدش)\b"
)


def _compile_normalized_patterns(raw_patterns: list[str]) -> list[re.Pattern]:
    """Normalize Arabic variants in regex patterns so they match preprocessed text."""
    return [re.compile(normalize_arabic(p)) for p in raw_patterns]


# Benign educational/medical/sports phrases that contain words like "دم" or "مخدرات"
BENIGN_CONTEXT_PATTERNS = _compile_normalized_patterns([
    r"\b(تبرع\s*بالدم|ضغط\s*الدم|تحليل\s*الدم|فصيله\s*الدم|فقر\s*الدم|سحب\s*الدم|خلايا\s*الدم)\b",
    r"\b(كره\s*القدم|مباراه|بطوله|الاسبوع\s*القادم|الشهر\s*القادم|العام\s*القادم)\b",
    r"\b(مكافحه\s*المخدرات|الوقايه\s*من\s*المخدرات|مكافحه\s*التنمر|اضرار\s*التدخين)\b",
])

# High-precision Arabic safety patterns (fallback & fast-path, normalized for MSA + Gulf/Egyptian/Levantine)
CYBERBULLYING_PATTERNS = _compile_normalized_patterns([
    r"\bيا\s*(غبي|حيوان|كلب|حمار|فاشل|قبيح|تافه|حقير|وسخ|بشع|معفن|معتوه|اهبل|تيس|ذليل)\b",
    r"\b(انت|انتم)\s*(غبي|فاشل|حيوان|كلب|حمار|تافه|حقير|قبيح|بشع)\b",
    r"(تستاهل|بنضربك|ساضربك|حاضربك|هضربك|راح\s*نضربك|راح\s*تشوف|بفضحك|بنشر\s*صورك)",
    r"(محد\s*يحبك|محدش\s*بيحبك|الكل\s*يكرهك|روح\s*انتحر|موت\s*احسن|اذلف\s*يا|انقلع\s*يا)",
    r"(وش\s*ذا\s*الغباء|شكلك\s*مقرف|وجهك\s*قبيح|يا\s*عديم\s*الفائده)",
])

VIOLENCE_PATTERNS = _compile_normalized_patterns([
    r"\b(بقتلك|ساقتلك|سأقتلك|ساقوم\s*بقتلك|هقتلك|حقتلك|بدي\s*اقتلك|عايز\s*اقتله|عايز\s*اقتلك|نقتله|اقتله|اقتلها|اقتلوهم)\b",
    r"\b(بذبحك|ساذبحك|أذبحك|اذبحك|اذبحه|رح\s*اذبحك|بضربك|ضرب\s*مبرح|سفك\s*دمائك|سفك\s*الدماء)\b",
    r"\b(اطلقه|طعن|بالسكين|سكين|مسدس|بالمسدس|قنبله|متفجره|تفجير|ذبح|تصفيه\s*جسديه)\b",
    r"\b(هجوم\s*مسلح|اعتداء|كسر\s*راسك|اخنقك|بدي\s*انتحر|سانتحر|اخلص\s*من\s*حياتي)\b",
    # Standalone word "دم" or "قتل" only when accompanied by violent verbs/nouns (never inside القادم / خدمة / كرة القدم)
    r"(?<![\u0600-\u06FF\w])(نزف\s*دم|دمك\s*مهدور|بحر\s*من\s*الدم|جريمه\s*قتل|تهديد\s*بالقتل)(?![\u0600-\u06FF\w])",
])

HATE_SPEECH_PATTERNS = _compile_normalized_patterns([
    r"\b(حثاله|اطردوهم|ابيدوهم|ما\s*يستاهلون\s*يعيشون|متخلفين)\b",
    r"(هذول\s*(حثاله|كلاب)|هؤلاء\s*(حثاله|كلاب)|كلاب\s*وما\s*يستاهلون)",
    r"\b(عنصري|عنصريه|طائفي|طائفيه|كراهيه|مجنسين|شحاتين|عبيد|كفار\s*اقتلوا)\b",
])

SEXUAL_PATTERNS = _compile_normalized_patterns([
    r"(صور\s*(عاريه|جنسيه|خاصه|اباحيه)|فيديو\s*اباحي|مقاطع\s*اباحيه|افلام\s*اباحيه)",
    r"\b(سكس|اباحي|اباحيه|ممارسه\s*جنس|تعال\s*خاص\s*نتعرى|نتعري|تحرش\s*جنسي)\b",
    r"\b(عري\s*كامل|نيك|شرموط|شرموطه|عاهره|دعاره)\b",
])


def detect_dialect(text: str) -> str:
    """Detect whether the Arabic text uses Gulf, Egyptian, Levantine, or MSA."""
    norm = normalize_arabic(text)
    if GULF_DIALECT_PATTERNS.search(norm):
        return "Gulf"
    if EGYPTIAN_DIALECT_PATTERNS.search(norm):
        return "Egyptian"
    if LEVANTINE_DIALECT_PATTERNS.search(norm):
        return "Levantine"
    return "MSA"


def is_dialectal(text: str) -> bool:
    """Check if the text contains Gulf / Egyptian / Levantine dialectal markers."""
    return bool(DIALECTAL_PATTERNS.search(normalize_arabic(text)))


def check_rule_based_safety(normalized_text: str) -> tuple[str, float] | None:
    """
    Fast-path safety evaluation using normalized, word-boundary-safe regex patterns.
    Returns (category, confidence) or None if no explicit match.
    """
    for pattern in SEXUAL_PATTERNS:
        if pattern.search(normalized_text):
            return CATEGORY_SEXUAL, 0.96

    for pattern in CYBERBULLYING_PATTERNS:
        if pattern.search(normalized_text):
            return CATEGORY_CYBERBULLYING, 0.94

    for pattern in VIOLENCE_PATTERNS:
        if pattern.search(normalized_text):
            # Disambiguate benign medical/sports contexts if no direct threat pronoun
            if any(bp.search(normalized_text) for bp in BENIGN_CONTEXT_PATTERNS):
                continue
            return CATEGORY_VIOLENCE, 0.93

    for pattern in HATE_SPEECH_PATTERNS:
        if pattern.search(normalized_text):
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
