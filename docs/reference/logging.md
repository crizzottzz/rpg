# Logging & Observability Architecture

Adapted from prior enterprise architecture experience.

---

## Core Mental Model

Logging has three distinct concerns:

1. **Log production** — application code emits log records
2. **Log routing** — handlers decide where logs go
3. **Log consumption** — outputs display or store logs

These concerns are decoupled. Adding a new output (file, database, external service) should never require changing application code.

---

## Python Logging Architecture

The app uses Python's built-in `logging` framework as the single log pipeline.

### How It Works

```
Application code
    ↓
  LogRecord
    ↓
  Logger chain (named logger → propagate → root)
    ↓
  Handlers attached to root
    ├── StreamHandler     → stdout/stderr (container-friendly)
    ├── SSELogHandler     → per-subscriber queues → /api/logs/stream
    ├── FileHandler       → log files (optional)
    └── (future handlers) → database, telemetry, etc.
```

### Key Rules

- Application code calls `logging.info()`, `logging.error()`, etc.
- Named loggers (e.g., `logging.getLogger("access")`) propagate to the root logger
- All outputs are attached as handlers on the root logger
- The root logger doesn't "read" stdout — stdout is just one possible destination via StreamHandler

---

## Handler Pattern

To add a new log output, implement a `logging.Handler` and attach it to the root logger during app initialization.

### Template

```python
import logging

def init_logging(app):
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Console output
    _attach_console(root)

    # File output (optional)
    _attach_file(root)

def _attach_console(root):
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        h = logging.StreamHandler()
        h.setLevel(logging.INFO)
        h.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
        ))
        root.addHandler(h)

def _attach_file(root):
    # Add RotatingFileHandler for persistent logs
    pass
```

### Rules

- Attach handlers once (check for duplicates with `isinstance`)
- Keep handler configuration close to attachment (formatter, level, filters)
- Call `init_logging(app)` during `create_app()`

---

## Structured Logging

For events that need more than a log line (audit trails, analytics), use a structured event pattern:

```python
def log_event(event_name: str, data: dict):
    """Emit a structured event for audit/analytics purposes."""
    logger = logging.getLogger("events")
    logger.info(event_name, extra={"event_data": data})
```

### Use Cases

- `request_received` — HTTP request details
- `login_success` / `login_failed` — auth events
- `entity_modified` — overlay creation/modification
- `campaign_created` — user actions

These events flow through the same handler pipeline. A custom handler can filter on logger name or extra fields to route them to specific sinks (database, audit file).

---

## Access Logging

HTTP access logs are generated via `before_request`/`after_request` hooks registered in `create_app()`. Every request is logged as:

```
INFO app.access: GET /api/campaigns 200 25ms
```

The access logger uses the named logger `app.access`, which propagates to root and appears in all handlers (console, SSE, future file handler).

The SSE stream endpoint itself (`/api/logs/stream`) is excluded from access logging to prevent feedback loops.

---

## Live Log Streaming (SSE)

`GET /api/logs/stream` provides a Server-Sent Events endpoint for real-time log viewing from a browser.

### How It Works

`SSELogHandler` is a `logging.Handler` subclass attached to the root logger. It maintains a list of per-subscriber `queue.Queue` instances. When a log record is emitted, it fans out the formatted message to all subscriber queues.

The SSE endpoint creates a subscriber queue, then yields messages as `data:` events. Heartbeats (`: heartbeat\n\n`) are sent every 30s to keep the connection alive.

### Authentication

Supports both `Authorization: Bearer <token>` header and `?token=<jwt>` query parameter. The query param fallback exists because the browser `EventSource` API does not support custom headers.

### Usage

```javascript
// Browser
const token = localStorage.getItem('access_token');
const es = new EventSource(`/api/logs/stream?token=${token}`);
es.onmessage = (e) => console.log(e.data);

// curl
curl -N "http://localhost:5000/api/logs/stream?token=<jwt>"
```

### Back-Pressure

Each subscriber queue is bounded (200 records). If a slow consumer fills its queue, the oldest record is dropped to make room for the newest.

---

## Guidelines

### Do

- Use named loggers: `logger = logging.getLogger(__name__)`
- Log at appropriate levels: DEBUG for dev detail, INFO for operational events, WARNING for recoverable issues, ERROR for failures
- Include context in log messages (user ID, entity ID, action)
- Use structured extra data for machine-parseable events

### Don't

- Don't use `print()` for operational logging — use `logging`
- Don't create custom fan-out systems — use Python's handler chain
- Don't log sensitive data (passwords, full tokens, PII beyond user ID)
- Don't make log handler emit() methods blocking — keep them fast

---

## Future Considerations

- Database handler for high-value events (WARNING+ or audit events)
- External observability integration (if the app moves to production)
- Request ID correlation across log entries
- Frontend log viewer page (consume SSE stream in a React component)
