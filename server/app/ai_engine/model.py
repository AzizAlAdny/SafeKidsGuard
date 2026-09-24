"""
AI model loader — lazy singletons for AraBERT v2 and CAMeLBERT.
Models are loaded once at startup via lifespan and reused across requests.
Phase 2 will add the full classification pipeline.
"""
import asyncio
import logging

logger = logging.getLogger(__name__)

# Lazy model singletons
_arabert_pipeline = None
_camelbert_pipeline = None


async def load_models() -> None:
    """
    Load both Arabic NLP models at startup.
    Runs model loading in a thread pool to avoid blocking the event loop.
    Phase 2 task: implement full fine-tuned model loading.
    """
    logger.info("AI models: stub mode (Phase 2 will load AraBERT v2 + CAMeLBERT)")
    # TODO (Phase 2): Implement actual model loading
    # loop = asyncio.get_event_loop()
    # global _arabert_pipeline, _camelbert_pipeline
    # _arabert_pipeline = await loop.run_in_executor(None, _load_arabert)
    # _camelbert_pipeline = await loop.run_in_executor(None, _load_camelbert)


def get_arabert():
    """Return the AraBERT v2 pipeline (MSA content classification)."""
    return _arabert_pipeline


def get_camelbert():
    """Return the CAMeLBERT pipeline (dialectal Arabic classification)."""
    return _camelbert_pipeline
