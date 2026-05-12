"""Multi-language support for Alexandria"""
import os
import asyncio
from .gemini_client import gemini_available, generate_text

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)",
    "ko": "Korean",
    "ru": "Russian",
    "ar": "Arabic",
    "hi": "Hindi"
}


async def translate_content(content: str, target_language: str) -> str:
    """
    Translate content to target language using Gemini
    
    Args:
        content: Text to translate
        target_language: Target language code (e.g., 'es', 'fr')
    
    Returns:
        Translated content
    """
    if target_language == "en":
        return content
    
    if target_language not in SUPPORTED_LANGUAGES:
        return content
    
    if not gemini_available():
        return content

    target_lang_name = SUPPORTED_LANGUAGES[target_language]
    prompt = f"""Translate the following text to {target_lang_name}. Keep the meaning and context intact. Only return the translated text, nothing else.\n\nText to translate:\n{content}"""

    try:
        # generate_text is sync; run it in a thread to keep async signature
        text = await asyncio.to_thread(generate_text, prompt, temperature=0.0, max_output_tokens=400)
        return text or content
    except Exception as e:
        print(f"Translation error: {e}")
        return content


async def generate_summary_in_language(summary: str, language: str) -> str:
    """
    Generate or translate a summary to the specified language
    
    Args:
        summary: The summary text
        language: Target language code
    
    Returns:
        Summary in target language
    """
    return await translate_content(summary, language)


def get_language_name(language_code: str) -> str:
    """Get full language name from code"""
    return SUPPORTED_LANGUAGES.get(language_code, "English")


def validate_language_code(language_code: str) -> bool:
    """Validate if language code is supported"""
    return language_code in SUPPORTED_LANGUAGES
