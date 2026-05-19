import os
import typing
import json
import logging

try:
    import requests
except Exception:
    requests = None

LOG = logging.getLogger(__name__)


def _get_api_key() -> typing.Optional[str]:
    return os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY") or os.getenv("OPENAI_API_KEY")


def grok_enabled() -> bool:
    value = os.getenv("ENABLE_GROK") or os.getenv("ENABLE_GROKAI")
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def grok_available() -> bool:
    return bool(_get_api_key()) and grok_enabled() and requests is not None


def _extract_text_from_response(data: typing.Any) -> typing.Optional[str]:
    if not data:
        return None
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        # common keys that might contain text
        for key in ("output", "output_text", "text", "response", "content", "result", "choices", "outputs"):
            if key in data:
                return _extract_text_from_response(data[key])
        # fallback: return first string value found
        for v in data.values():
            text = _extract_text_from_response(v)
            if text:
                return text
    if isinstance(data, list):
        for item in data:
            text = _extract_text_from_response(item)
            if text:
                return text
    return None


def generate_text(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 512,
    model_name: typing.Optional[str] = None,
) -> typing.Optional[str]:
    api_key = _get_api_key()
    if not api_key or requests is None:
        LOG.debug("Grok client unavailable: no requests or API key")
        return None

    model = model_name or os.getenv("GROK_QA_MODEL") or os.getenv("GROK_MODEL") or "grok-4.20-reasoning"
    url = os.getenv("GROK_API_URL") or "https://api.x.ai/v1/responses"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "input": prompt, "temperature": float(temperature)}

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=20)
        if resp.status_code >= 400:
            LOG.warning("Grok API returned status %s: %s", resp.status_code, resp.text)
            return None
        data = resp.json()
        # Try common shapes
        text = _extract_text_from_response(data)
        if text:
            return text.strip()
    except Exception as e:
        LOG.exception("Grok generate_text failed: %s", e)
        return None
    return None
