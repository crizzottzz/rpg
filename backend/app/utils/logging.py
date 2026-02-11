"""Logging initialization — configure Python logging handlers for the app."""

import logging
import os


def init_logging() -> None:
    """Set up root logger with console handler.

    Called once during create_app(). Attaches a StreamHandler to the root
    logger so all named loggers (via propagation) output to the console.

    Log level can be set via LOG_LEVEL env var (default: INFO).
    """
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    # Avoid duplicate handlers on repeated calls (e.g. test fixtures)
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        handler = logging.StreamHandler()
        handler.setLevel(level)
        handler.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        root.addHandler(handler)
