"""
Tests for Arabic text preprocessing pipeline (Phase 2).
"""
import pytest
from app.ai_engine.preprocessing import (
    preprocess_arabic,
    reduce_elongation,
    remove_tashkeel,
    remove_tatweel,
    normalize_arabic,
    normalize_leetspeak,
)


def test_remove_tashkeel():
    text_with_harakat = "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ"
    cleaned = remove_tashkeel(text_with_harakat)
    assert cleaned == "السلام عليكم ورحمة الله وبركاته"


def test_remove_tatweel():
    text_with_kashida = "مـــرحـــبـــا"
    cleaned = remove_tatweel(text_with_kashida)
    assert cleaned == "مرحبا"


def test_normalize_arabic_letters():
    # Alef variants
    assert normalize_arabic("أحمد") == "احمد"
    assert normalize_arabic("إبراهيم") == "ابراهيم"
    assert normalize_arabic("آمنة") == "امنه"

    # Taa Marbuta
    assert normalize_arabic("مدرسة") == "مدرسه"

    # Alif Maqsura
    assert normalize_arabic("على") == "علي"


def test_reduce_elongation():
    assert reduce_elongation("ههههههههههههه") == "هه"
    assert reduce_elongation("وااااااااو") == "وااو"
    assert reduce_elongation("كلاااااام") == "كلاام"


def test_normalize_leetspeak():
    # Arabizi 3 -> ع, 7 -> ح
    assert "ع" in normalize_leetspeak("ya 3rab")
    assert "ح" in normalize_leetspeak("7elwa")


def test_full_preprocessing_pipeline():
    raw = "يــــاااااا غَبِـــيّ يَااا حَيَـــوَانْ 3alaikooolom"
    processed = preprocess_arabic(raw)
    assert "ـ" not in processed  # No tatweel
    assert "َ" not in processed  # No fatha
    assert "ِ" not in processed  # No kasra
    assert "ياا غبي ياا حيوان" in processed
