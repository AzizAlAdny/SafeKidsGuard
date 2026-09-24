"""
Arabic Text Preprocessing Pipeline for Safe Kids Guard.
Normalizes text, strips diacritics/kashida, reduces elongation,
and normalizes Arabizi / leetspeak for accurate BERT classification.
"""
import re
import unicodedata

# Arabic Tashkeel (diacritics / harakat) regex
TASHKEEL_REGEX = re.compile(
    r"[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]"
)

# Arabic Tatweel (kashida)
TATWEEL_REGEX = re.compile(r"\u0640")

# Multiple consecutive punctuation/symbols
PUNCT_REGEX = re.compile(r"([!?.,;:\-_=+/\\|~`@#$%^&*()\[\]{}<>\"'\u060C\u061B\u061F])\1+")

# Arabizi / Leetspeak digit to Arabic letter mapping
LEETSPEAK_MAP = {
    "3": "ع",
    "7": "ح",
    "5": "خ",
    "2": "ء",
    "6": "ط",
    "8": "ق",
    "9": "ص",
}


def remove_tashkeel(text: str) -> str:
    """Strip all Arabic diacritical marks (harakat/tashkeel)."""
    return TASHKEEL_REGEX.sub("", text)


def remove_tatweel(text: str) -> str:
    """Remove Arabic kashida/tatweel character (ـ)."""
    return TATWEEL_REGEX.sub("", text)


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic character variants:
    - Alef variants (أ, إ, آ, ٱ) -> ا
    - Taa Marbuta (ة) -> ه
    - Yaa variants (ى) -> ي
    - Persian/Urdu variants (ك -> ك, ي -> ي)
    """
    text = re.sub(r"[إأآٱ]", "ا", text)
    text = re.sub(r"ة\b", "ه", text)  # Taa Marbuta at word boundary
    text = re.sub(r"ى\b", "ي", text)  # Alif Maqsura
    text = re.sub(r"ؤ", "و", text)
    text = re.sub(r"ئ", "ي", text)
    return text


def reduce_elongation(text: str) -> str:
    """
    Reduce repeated characters to maximum 2 occurrences.
    E.g. 'هههههههه' -> 'هه', 'واااااو' -> 'وااو'
    """
    return re.sub(r"(.)\1{2,}", r"\1\1", text)


def normalize_leetspeak(text: str) -> str:
    """
    Normalize Arabizi / Franco-Arabic number substitutions within words.
    E.g., 'ya 3rab' -> 'ya عراب'
    """
    # Replace numbers that are embedded inside Arabic/Latin words
    def replace_digit(match):
        word = match.group(0)
        for digit, char in LEETSPEAK_MAP.items():
            word = word.replace(digit, char)
        return word

    # Match words containing numbers alongside letters
    return re.sub(r"\b\w*\d+\w*\b", replace_digit, text)


def clean_spaces(text: str) -> str:
    """Collapse consecutive whitespace into a single space and strip."""
    return re.sub(r"\s+", " ", text).strip()


def preprocess_arabic(text: str) -> str:
    """
    Complete Arabic preprocessing pipeline:
    1. Unicode normalization (NFKC)
    2. Remove Tashkeel (harakat)
    3. Remove Tatweel (kashida)
    4. Normalize Arabic letter variants
    5. Reduce character elongation
    6. Normalize Arabizi numbers
    7. Clean excess whitespace
    """
    if not text:
        return ""

    # Step 1: Unicode Normalization
    text = unicodedata.normalize("NFKC", text)

    # Step 2: Remove diacritics
    text = remove_tashkeel(text)

    # Step 3: Remove kashida
    text = remove_tatweel(text)

    # Step 4: Normalize letters
    text = normalize_arabic(text)

    # Step 5: Reduce repeated letters
    text = reduce_elongation(text)

    # Step 6: Normalize Arabizi
    text = normalize_leetspeak(text)

    # Step 7: Collapse punctuation repetition (e.g. '????' -> '?')
    text = PUNCT_REGEX.sub(r"\1", text)

    # Step 8: Clean spaces
    return clean_spaces(text)
