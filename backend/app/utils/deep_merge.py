def deep_merge(base: dict, overlay: dict) -> dict:
    """Deep merge overlay into base, returning a new dict.
    Overlay values take precedence. Nested dicts are merged recursively."""
    result = base.copy()
    for key, value in overlay.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result
