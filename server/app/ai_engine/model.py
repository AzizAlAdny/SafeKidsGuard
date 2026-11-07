"""
AI model loader — lazy singletons for AraBERT v2 and CAMeLBERT.
Models are loaded once at startup via lifespan and reused across requests.
Supports both neural Transformers pipelines and high-speed heuristic fallbacks.
"""
import asyncio
import logging
import os
from typing import Any

from app.core.config import settings

# Prevent HuggingFace Transformers from spawning background safetensors auto-conversion downloads
os.environ.setdefault("DISABLE_SAFETENSORS_CONVERSION", "1")

logger = logging.getLogger(__name__)

# Lazy model singletons
_arabert_pipeline: Any = None
_camelbert_pipeline: Any = None
_models_loaded: bool = False


def _load_transformers_pipeline(model_name: str) -> Any:
    """Synchronous loader for HuggingFace Transformers pipeline."""
    try:
        from transformers import (
            AutoModelForSequenceClassification,
            AutoTokenizer,
            logging as hf_logging,
            pipeline,
        )
        hf_logging.set_verbosity_error()
        logger.info(f"Loading transformer model: {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        return pipeline("text-classification", model=model, tokenizer=tokenizer)
    except Exception as exc:
        logger.warning(
            f"Could not load HuggingFace model '{model_name}': {exc}. "
            "Falling back to high-speed heuristic safety rules."
        )
        return None


async def load_models() -> None:
    """
    Load Arabic NLP models at startup.
    Runs model loading in a background thread to prevent blocking the asyncio event loop.
    """
    global _arabert_pipeline, _camelbert_pipeline, _models_loaded

    if not settings.AI_ENABLE_TRANSFORMERS:
        logger.info(
            "AI Engine: Fast-path rule-based mode active (AI_ENABLE_TRANSFORMERS=False). "
            "Heuristic arbitration will be used."
        )
        _models_loaded = False
        return

    logger.info("AI Engine: Initializing AraBERT v2 & CAMeLBERT neural pipelines...")
    loop = asyncio.get_running_loop()

    try:
        _arabert_pipeline = await loop.run_in_executor(
            None, _load_transformers_pipeline, settings.ARABERT_MODEL_NAME
        )
        _camelbert_pipeline = await loop.run_in_executor(
            None, _load_transformers_pipeline, settings.CAMELBERT_MODEL_NAME
        )
        _models_loaded = (_arabert_pipeline is not None) or (_camelbert_pipeline is not None)
        if _models_loaded:
            logger.info("AI Engine: Arabic neural models loaded successfully.")
    except Exception as exc:
        logger.error(f"Error during AI model initialization: {exc}")
        _models_loaded = False


def get_arabert() -> Any:
    """Return the AraBERT v2 pipeline (MSA content classification)."""
    return _arabert_pipeline


def get_camelbert() -> Any:
    """Return the CAMeLBERT pipeline (dialectal Arabic classification)."""
    return _camelbert_pipeline


def is_models_loaded() -> bool:
    """Check if at least one neural model pipeline is active."""
    return _models_loaded
