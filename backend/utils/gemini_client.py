import os

try:
    import google.generativeai as genai
except ImportError:
    genai = None


def _get_api_key() -> str | None:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")


def heavy_ai_enabled() -> bool:
    value = os.getenv("ENABLE_GEMINI")
    if value is None:
        return True
    return value.strip().lower() not in {"0", "false", "no", "off"}


def gemini_available() -> bool:
    return genai is not None and bool(_get_api_key()) and heavy_ai_enabled()


def _configure_model():
    api_key = _get_api_key()
    if not genai or not api_key:
        return None
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    return genai.GenerativeModel(model_name)


def generate_text(prompt: str, *, temperature: float = 0.2, max_output_tokens: int = 512) -> str | None:
    model = _configure_model()
    if model is None:
        return None
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )
    text = getattr(response, "text", None)
    if text:
        return text.strip()
    return None
