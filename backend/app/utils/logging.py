"""Logging initialization — console handler, SSE streaming handler, access log middleware."""

import logging
import os
import queue
import threading
import time

from flask import Flask, g, request


# ---------------------------------------------------------------------------
# SSE Log Handler — pushes formatted records to per-subscriber queues
# ---------------------------------------------------------------------------

class SSELogHandler(logging.Handler):
    """Logging handler that fans out records to SSE subscriber queues.

    Each subscriber gets its own bounded Queue. If a subscriber's queue is
    full the record is dropped for that subscriber (back-pressure).
    """

    def __init__(self, maxsize: int = 200) -> None:
        super().__init__()
        self._maxsize = maxsize
        self._subscribers: list[queue.Queue[str]] = []
        self._lock = threading.Lock()

    def emit(self, record: logging.LogRecord) -> None:
        msg = self.format(record)
        with self._lock:
            dead: list[queue.Queue[str]] = []
            for q in self._subscribers:
                try:
                    q.put_nowait(msg)
                except queue.Full:
                    # Drop oldest to make room
                    try:
                        q.get_nowait()
                        q.put_nowait(msg)
                    except queue.Empty:
                        dead.append(q)
            for q in dead:
                self._subscribers.remove(q)

    def subscribe(self) -> "queue.Queue[str]":
        """Create and return a new subscriber queue."""
        q: queue.Queue[str] = queue.Queue(maxsize=self._maxsize)
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: "queue.Queue[str]") -> None:
        """Remove a subscriber queue."""
        with self._lock:
            try:
                self._subscribers.remove(q)
            except ValueError:
                pass


# Module-level singleton — imported by the SSE endpoint blueprint
sse_handler = SSELogHandler()


# ---------------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------------

def init_logging() -> None:
    """Set up root logger with console + SSE handlers.

    Called once during create_app(). The SSE handler is always attached so
    subscribers can connect at any time.
    """
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    fmt = logging.Formatter(
        "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler (avoid duplicates on repeated calls)
    if not any(isinstance(h, logging.StreamHandler) and not isinstance(h, SSELogHandler)
               for h in root.handlers):
        console = logging.StreamHandler()
        console.setLevel(level)
        console.setFormatter(fmt)
        root.addHandler(console)

    # SSE handler (singleton — attach once)
    if sse_handler not in root.handlers:
        sse_handler.setLevel(level)
        sse_handler.setFormatter(fmt)
        root.addHandler(sse_handler)


# ---------------------------------------------------------------------------
# Access log middleware
# ---------------------------------------------------------------------------

_access_logger = logging.getLogger("app.access")


def register_access_logging(app: Flask) -> None:
    """Attach before/after request hooks for HTTP access logging.

    Logs one line per request: METHOD /path STATUS DURATIONms
    Skips the SSE log stream endpoint itself to avoid feedback loops.
    """

    @app.before_request
    def _start_timer() -> None:
        g.request_start = time.monotonic()

    @app.after_request
    def _log_request(response):  # type: ignore[no-untyped-def]
        # Skip logging the SSE stream itself (would create a feedback loop)
        if request.path == "/api/logs/stream":
            return response

        duration_ms = (time.monotonic() - getattr(g, "request_start", time.monotonic())) * 1000
        _access_logger.info(
            "%s %s %s %.0fms",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response
