import os

genai = None
_genai_import_attempted = False


def _get_genai():
    global genai, _genai_import_attempted
    if not _genai_import_attempted:
        _genai_import_attempted = True
        try:
            import google.generativeai as imported_genai
            genai = imported_genai
        except ImportError:
            genai = None
    return genai

import os
import typing
import importlib

_genai_impl = None
_genai_checked = False


def _detect_genai_impl():
    global _genai_impl, _genai_checked
    if _genai_checked:
        return _genai_impl
    _genai_checked = True
    # Prefer new `google.genai` package, fall back to `google.generativeai` if present
    try:
        genai_new = importlib.import_module("google.genai")
        _genai_impl = ("new", genai_new)
        return _genai_impl
    except Exception:
        pass
    try:
        genai_old = importlib.import_module("google.generativeai")
        _genai_impl = ("old", genai_old)
        return _genai_impl
    except Exception:
        _genai_impl = None
        return None


def _get_api_key() -> typing.Optional[str]:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("GENAI_API_KEY")


def heavy_ai_enabled() -> bool:
    value = os.getenv("ENABLE_GEMINI") or os.getenv("ENABLE_GENAI")
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def gemini_available() -> bool:
    return bool(_get_api_key()) and heavy_ai_enabled() and _detect_genai_impl() is not None


def _configure_named_model(model_name: typing.Optional[str] = None):
    impl = _detect_genai_impl()
    api_key = _get_api_key()
    if not impl or not api_key:
        return None
    kind, module = impl
    resolved_model = model_name or os.getenv("GEMINI_MODEL") or os.getenv("LLM_MODEL") or "text-bison-001"

    if kind == "new":
        # google.genai style
        try:
            # Client constructor may accept api_key or rely on env var
            client = module.Client(api_key=api_key) if hasattr(module, "Client") else module
            return ("new", client, resolved_model)
        except Exception:
            return None

    # old google.generativeai
    try:
        module.configure(api_key=api_key)
        model_obj = module.GenerativeModel(resolved_model)
        return ("old", module, model_obj)
    except Exception:
        return None


def generate_text(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 512,
    model_name: typing.Optional[str] = None,
) -> typing.Optional[str]:
    cfg = _configure_named_model(model_name)
    if not cfg:
        return None
    kind = cfg[0]
    try:
        if kind == "new":
            # ("new", client, model_name)
            _, client, model = cfg
            # client.generate_text returns object with .text or string
            try:
                resp = client.generate_text(model=model, input=prompt, temperature=temperature, max_output_tokens=max_output_tokens)
            except TypeError:
                # fallback parameter names
                resp = client.generate_text(model=model, prompt=prompt, temperature=temperature)

            text = None
            if hasattr(resp, "text"):
                text = resp.text
            elif isinstance(resp, dict):
                text = resp.get("output") or resp.get("content") or resp.get("text")
            elif isinstance(resp, str):
                text = resp
            return text.strip() if text else None

        # old API
        _, module, model_obj = cfg
        response = model_obj.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            },
        )
        text = getattr(response, "text", None)
        if text:
            return text.strip()
    except Exception:
        return None
    return None
