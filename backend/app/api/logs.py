"""SSE endpoint and log viewer for live log streaming."""

import queue

import jwt as pyjwt
from flask import Blueprint, Response, current_app, request

from app.models.user import User
from app.utils.logging import sse_handler

logs_bp = Blueprint("logs", __name__)


def _authenticate_sse() -> User | None:
    """Authenticate via Authorization header or ?token= query param.

    EventSource doesn't support custom headers, so the query param
    fallback allows browser-native SSE connections.
    """
    token = None

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = request.args.get("token")

    if not token:
        return None

    try:
        payload = pyjwt.decode(
            token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
        )
        if payload.get("type") != "access":
            return None
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        return None

    return User.query.get(payload.get("sub"))


@logs_bp.route("/api/logs/stream")
def log_stream() -> Response | tuple[dict, int]:
    """
    Stream server logs via Server-Sent Events.

    Opens a persistent SSE connection that receives all log records
    (access logs, auth events, application logs) in real time.
    Heartbeats sent every 30s to keep the connection alive.

    Accepts authentication via Authorization header or ?token= query param
    (EventSource API does not support custom headers).

    ---
    tags:
      - Logs
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: token
        schema:
          type: string
        description: JWT access token (alternative to Authorization header)
    responses:
      200:
        description: SSE stream of log lines
        content:
          text/event-stream:
            schema:
              type: string
      401:
        description: Not authenticated
    """
    user = _authenticate_sse()
    if not user:
        return {"error": "Not authenticated"}, 401

    subscriber = sse_handler.subscribe()

    def generate():
        try:
            while True:
                try:
                    msg = subscriber.get(timeout=30)
                    yield f"data: {msg}\n\n"
                except queue.Empty:
                    # Heartbeat keeps the connection alive
                    yield ": heartbeat\n\n"
        except GeneratorExit:
            pass
        finally:
            sse_handler.unsubscribe(subscriber)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Log viewer — self-contained HTML page, no build step
# ---------------------------------------------------------------------------

_LOG_VIEWER_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RPG Platform — Live Logs</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace;
    background: #0d1117; color: #c9d1d9; height: 100vh;
    display: flex; flex-direction: column;
  }
  header {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 12px 16px; display: flex; align-items: center;
    gap: 12px; flex-wrap: wrap;
  }
  header h1 { font-size: 14px; font-weight: 600; color: #58a6ff; white-space: nowrap; }
  .status {
    font-size: 12px; padding: 2px 8px; border-radius: 12px;
    border: 1px solid #30363d;
  }
  .status.connected { color: #3fb950; border-color: #238636; }
  .status.disconnected { color: #f85149; border-color: #da3633; }
  .status.connecting { color: #d29922; border-color: #9e6a03; }
  .controls { margin-left: auto; display: flex; gap: 8px; }
  button {
    font-family: inherit; font-size: 12px; padding: 4px 12px;
    background: #21262d; color: #c9d1d9; border: 1px solid #30363d;
    border-radius: 6px; cursor: pointer;
  }
  button:hover { background: #30363d; }
  button.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }
  #login-bar {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 12px 16px; display: flex; gap: 8px; align-items: center;
  }
  #login-bar label { font-size: 12px; color: #8b949e; }
  #login-bar input {
    font-family: inherit; font-size: 12px; padding: 4px 8px;
    background: #0d1117; color: #c9d1d9; border: 1px solid #30363d;
    border-radius: 4px; flex: 1; max-width: 320px;
  }
  #log-container {
    flex: 1; overflow-y: auto; padding: 8px 16px;
    font-size: 13px; line-height: 1.6;
  }
  .log-line { white-space: pre-wrap; word-break: break-all; }
  .log-line.WARNING { color: #d29922; }
  .log-line.ERROR { color: #f85149; }
  .log-line.DEBUG { color: #8b949e; }
  .log-line.INFO { color: #c9d1d9; }
  .log-line .ts { color: #8b949e; }
  .log-line .logger { color: #58a6ff; }
  .count { font-size: 11px; color: #8b949e; }
  #empty {
    color: #484f58; font-size: 14px; padding: 40px 16px; text-align: center;
  }
  .filter-bar {
    padding: 8px 16px; background: #161b22; border-bottom: 1px solid #30363d;
    display: flex; gap: 8px; align-items: center; font-size: 12px;
  }
  .filter-bar input {
    font-family: inherit; font-size: 12px; padding: 4px 8px;
    background: #0d1117; color: #c9d1d9; border: 1px solid #30363d;
    border-radius: 4px; width: 200px;
  }
  .filter-bar label { color: #8b949e; }
</style>
</head>
<body>
  <header>
    <h1>Live Logs</h1>
    <span id="status" class="status disconnected">disconnected</span>
    <span id="line-count" class="count"></span>
    <div class="controls">
      <button id="btn-autoscroll" class="active" title="Auto-scroll to bottom">Auto-scroll</button>
      <button id="btn-pause" title="Pause/resume stream">Pause</button>
      <button id="btn-clear" title="Clear log display">Clear</button>
    </div>
  </header>

  <div id="login-bar">
    <label for="username">User</label>
    <input id="username" type="text" placeholder="username" value="dm">
    <label for="password">Pass</label>
    <input id="password" type="password" placeholder="password">
    <button id="btn-connect">Connect</button>
  </div>

  <div class="filter-bar">
    <label for="filter">Filter:</label>
    <input id="filter" type="text" placeholder="regex pattern...">
    <label><input type="checkbox" id="chk-werkzeug"> werkzeug</label>
    <label><input type="checkbox" id="chk-access" checked> access</label>
  </div>

  <div id="log-container">
    <div id="empty">Press Connect to start streaming logs.</div>
  </div>

<script>
(function() {
  const MAX_LINES = 2000;
  const container = document.getElementById('log-container');
  const emptyEl = document.getElementById('empty');
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('line-count');
  const filterInput = document.getElementById('filter');
  const chkWerkzeug = document.getElementById('chk-werkzeug');
  const chkAccess = document.getElementById('chk-access');
  const btnAutoscroll = document.getElementById('btn-autoscroll');
  const btnPause = document.getElementById('btn-pause');
  const btnClear = document.getElementById('btn-clear');
  const btnConnect = document.getElementById('btn-connect');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  let es = null;
  let token = null;
  let autoScroll = true;
  let paused = false;
  let lineCount = 0;
  let pauseBuffer = [];

  function setStatus(state) {
    statusEl.textContent = state;
    statusEl.className = 'status ' + state;
  }

  function addLine(text) {
    if (emptyEl.parentNode) emptyEl.remove();

    // Determine log level for coloring
    let level = 'INFO';
    const m = text.match(/\\] (DEBUG|INFO|WARNING|ERROR|CRITICAL) /);
    if (m) level = m[1];

    // Colorize parts
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/(\\[.*?\\])/, '<span class="ts">$1</span>')
      .replace(/ (\\S+):/, ' <span class="logger">$1</span>:');

    const div = document.createElement('div');
    div.className = 'log-line ' + level;
    div.innerHTML = html;
    container.appendChild(div);
    lineCount++;

    // Trim old lines
    while (container.children.length > MAX_LINES) {
      container.removeChild(container.firstChild);
      lineCount--;
    }

    countEl.textContent = lineCount + ' lines';

    if (autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function shouldShow(text) {
    if (!chkWerkzeug.checked && text.includes(' werkzeug:')) return false;
    if (!chkAccess.checked && text.includes(' app.access:')) return false;
    const pattern = filterInput.value.trim();
    if (pattern) {
      try { if (!new RegExp(pattern, 'i').test(text)) return false; }
      catch(e) { /* invalid regex, show all */ }
    }
    return true;
  }

  async function connect() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) return;

    setStatus('connecting');
    btnConnect.textContent = 'Connecting...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setStatus('disconnected');
        btnConnect.textContent = 'Connect';
        alert('Login failed: ' + res.status);
        return;
      }
      const data = await res.json();
      token = data.access_token;
    } catch (err) {
      setStatus('disconnected');
      btnConnect.textContent = 'Connect';
      alert('Login error: ' + err.message);
      return;
    }

    // Hide login bar
    document.getElementById('login-bar').style.display = 'none';
    startSSE();
  }

  function startSSE() {
    if (es) { es.close(); es = null; }
    setStatus('connecting');

    es = new EventSource('/api/logs/stream?token=' + encodeURIComponent(token));

    es.onopen = function() {
      setStatus('connected');
      btnConnect.textContent = 'Disconnect';
    };

    es.onmessage = function(e) {
      if (paused) {
        pauseBuffer.push(e.data);
        if (pauseBuffer.length > MAX_LINES) pauseBuffer.shift();
        countEl.textContent = lineCount + ' lines (+' + pauseBuffer.length + ' buffered)';
        return;
      }
      if (shouldShow(e.data)) addLine(e.data);
    };

    es.onerror = function() {
      setStatus('disconnected');
      // EventSource auto-reconnects, but if token expired we stop
      if (es.readyState === EventSource.CLOSED) {
        setStatus('disconnected');
      }
    };
  }

  function disconnect() {
    if (es) { es.close(); es = null; }
    setStatus('disconnected');
    document.getElementById('login-bar').style.display = 'flex';
    btnConnect.textContent = 'Connect';
    token = null;
  }

  // Controls
  btnConnect.addEventListener('click', function() {
    if (es) disconnect(); else connect();
  });

  passwordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') connect();
  });

  btnAutoscroll.addEventListener('click', function() {
    autoScroll = !autoScroll;
    btnAutoscroll.classList.toggle('active', autoScroll);
    if (autoScroll) container.scrollTop = container.scrollHeight;
  });

  btnPause.addEventListener('click', function() {
    paused = !paused;
    btnPause.classList.toggle('active', paused);
    btnPause.textContent = paused ? 'Resume' : 'Pause';
    if (!paused && pauseBuffer.length) {
      pauseBuffer.forEach(function(line) { if (shouldShow(line)) addLine(line); });
      pauseBuffer = [];
    }
  });

  btnClear.addEventListener('click', function() {
    container.innerHTML = '';
    lineCount = 0;
    countEl.textContent = '';
  });

  // Re-filter doesn't re-render existing lines (only affects incoming)
  // but user can clear + reconnect to apply new filters from scratch
})();
</script>
</body>
</html>
"""


@logs_bp.route("/api/logs")
def log_viewer() -> Response:
    """Serve the live log viewer page."""
    return Response(_LOG_VIEWER_HTML, mimetype="text/html")
