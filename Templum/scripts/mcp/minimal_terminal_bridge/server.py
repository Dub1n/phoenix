from __future__ import annotations

import asyncio
import contextlib
from collections import deque
import logging
import os
import shlex
import signal
import time
from dataclasses import dataclass, field
from functools import wraps
from pathlib import Path
from typing import Deque, Dict, Optional, Tuple

from fastmcp import FastMCP
from ptyprocess import PtyProcessUnicode
from typing_extensions import TypedDict

LOG = logging.getLogger("templum.mcp.bridge")
logging.basicConfig(level=logging.INFO)

mcp = FastMCP("Templum CLI Bridge")

ROOT_DIR = Path(__file__).resolve().parents[3]
CLI_ENTRY = ROOT_DIR / "dist" / "src" / "cli-entry.js"
DEFAULT_COMMAND = ("node", str(CLI_ENTRY))
BUFFER_LIMIT = 32_768  # chars retained per buffer
IDLE_TIMEOUT_SECONDS = 15 * 60
SNAPSHOT_HISTORY_LIMIT = 20
SNAPSHOT_TOLERANCE = 1.0  # seconds
DIFF_CHAR_LIMIT = 8_000


class InputPayload(TypedDict, total=False):
    type: str
    sequence: str
    value: str


def strip_ansi(value: str) -> str:
    """Remove ANSI escape codes from terminal output."""
    import re

    ansi_escape = re.compile(r"\x1B[@-_][0-?]*[ -/]*[@-~]")
    return ansi_escape.sub("", value)


@dataclass
class PTYSession:
    session_id: str
    process: PtyProcessUnicode
    raw_buffer: str = ""
    clean_buffer: str = ""
    last_activity: float = field(default_factory=time.monotonic)
    _reader_task: Optional[asyncio.Task] = None
    _closed: bool = False
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    _snapshots: Deque[Tuple[float, str, str]] = field(
        default_factory=lambda: deque(maxlen=SNAPSHOT_HISTORY_LIMIT)
    )

    async def start_reader(self) -> None:
        loop = asyncio.get_running_loop()
        self._reader_task = loop.create_task(self._read_output())
        LOG.info("PTY reader started for %s (pid=%s)", self.session_id, self.process.pid)

    async def _read_output(self) -> None:
        while not self._closed:
            try:
                chunk = await asyncio.to_thread(self.process.read, 1024)
            except EOFError:
                LOG.info("PTY session %s reached EOF", self.session_id)
                break
            except Exception as exc:  # pragma: no cover - safety net
                LOG.exception("Unexpected error reading PTY %s: %s", self.session_id, exc)
                break

            if not chunk:
                await asyncio.sleep(0.01)
                continue

            async with self._lock:
                self.raw_buffer = (self.raw_buffer + chunk)[-BUFFER_LIMIT:]
                self.clean_buffer = (self.clean_buffer + strip_ansi(chunk))[-BUFFER_LIMIT:]
                self.last_activity = time.monotonic()

        self._closed = True

    async def send(self, data: str) -> None:
        async with self._lock:
            await asyncio.to_thread(self.process.write, data)
            self.last_activity = time.monotonic()

    async def snapshot(self, *, record: bool = True) -> dict:
        async with self._lock:
            raw = self.raw_buffer
            clean = self.clean_buffer
            last = self.last_activity
            alive = self.process.isalive()
            timestamp = time.time()
            if record:
                self._snapshots.append((timestamp, raw, clean))

        return {
            "alive": alive,
            "raw": raw,
            "clean": clean,
            "lastActivity": last,
            "timestamp": timestamp,
        }

    async def diff_since(self, since: float) -> Optional[dict]:
        async with self._lock:
            reference: Optional[Tuple[float, str, str]] = None
            for ts, raw, clean in reversed(self._snapshots):
                if ts <= since + SNAPSHOT_TOLERANCE:
                    reference = (ts, raw, clean)
                    break

            if reference is None:
                return None

            current_raw = self.raw_buffer
            current_clean = self.clean_buffer

        ref_ts, ref_raw, ref_clean = reference
        return {
            "since": ref_ts,
            "clean": _build_diff(ref_clean, current_clean),
            "raw": _build_diff(ref_raw, current_raw),
        }

    async def terminate(self) -> None:
        if self._closed:
            return

        LOG.info("Terminating PTY session %s", self.session_id)
        self._closed = True

        try:
            self.process.sendeof()
        except Exception:
            pass

        if self.process.isalive():
            try:
                self.process.kill(signal.SIGTERM)
            except Exception:
                pass

        if self.process.isalive():
            try:
                self.process.kill(signal.SIGKILL)
            except Exception:
                pass

        if self._reader_task:
            self._reader_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._reader_task


class SessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, PTYSession] = {}
        self._lock = asyncio.Lock()
        self._reaper_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        loop = asyncio.get_running_loop()
        if self._reaper_task is None:
            self._reaper_task = loop.create_task(self._reap_idle_sessions())

    async def create(
        self, session_id: str, command: Optional[str] = None
    ) -> PTYSession:
        async with self._lock:
            if session_id in self._sessions:
                raise ValueError(f"Session '{session_id}' already exists")

            if command is None and not CLI_ENTRY.exists():
                raise FileNotFoundError(
                    "Templum CLI build artefact missing (dist/src/cli-entry.js). "
                    "Run `npm run build` inside Templum before creating sessions."
                )

            cmd_parts = shlex.split(command) if command else list(DEFAULT_COMMAND)
            LOG.info("Spawning PTY session %s with command: %s", session_id, cmd_parts)

            env = os.environ.copy()
            env.setdefault("TERM", "xterm-256color")

            process = PtyProcessUnicode.spawn(
                cmd_parts,
                env=env,
                cwd=str(ROOT_DIR),
                dimensions=(40, 160),
                echo=False,
            )

            session = PTYSession(session_id=session_id, process=process)
            await session.start_reader()
            self._sessions[session_id] = session

        # Capture initial snapshot outside the store lock to avoid blocking other callers.
        await session.snapshot(record=True)
        return session

    async def get(self, session_id: str) -> PTYSession:
        async with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                raise KeyError(f"Session '{session_id}' not found")
            return session

    async def destroy(self, session_id: str) -> bool:
        async with self._lock:
            session = self._sessions.pop(session_id, None)

        if not session:
            return False

        await session.terminate()
        return True

    async def _reap_idle_sessions(self) -> None:
        try:
            while True:
                now = time.monotonic()
                stale: Dict[str, PTYSession] = {}
                async with self._lock:
                    for sid, session in list(self._sessions.items()):
                        if now - session.last_activity > IDLE_TIMEOUT_SECONDS:
                            stale[sid] = self._sessions.pop(sid)
                for sid, session in stale.items():
                    LOG.info("Reaping idle session %s", sid)
                    await session.terminate()
                await asyncio.sleep(30)
        except asyncio.CancelledError:  # pragma: no cover - background task
            return


store = SessionStore()


def ensure_started(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        await store.start()
        return await func(*args, **kwargs)

    return wrapper


@mcp.tool()
@ensure_started
async def create_session(session_id: str, command: Optional[str] = None) -> dict:
    """Create a PTY session running the Templum CLI."""
    session = await store.create(session_id=session_id, command=command)
    return {
        "sessionId": session.session_id,
        "pid": session.process.pid,
        "startedAt": time.time(),
        "command": command or " ".join(DEFAULT_COMMAND),
    }


@mcp.tool()
@ensure_started
async def send_input(
    session_id: str, input: InputPayload, since: Optional[float] = None
) -> dict:
    """Send key or text input to the PTY session and return the latest buffers."""
    if "type" not in input:
        raise ValueError("input.type is required")

    session = await store.get(session_id)

    payload_type = input["type"]
    if payload_type == "key":
        sequence = input.get("sequence")
        if not sequence:
            raise ValueError("input.sequence is required for key payloads")
        await session.send(sequence)
    elif payload_type == "text":
        value = input.get("value")
        if value is None:
            raise ValueError("input.value is required for text payloads")
        await session.send(value)
    else:
        raise ValueError(f"Unsupported input type '{payload_type}'")

    snapshot = await session.snapshot(record=True)
    snapshot.update({"sessionId": session_id, "success": True})

    if since is not None:
        diff = await session.diff_since(since)
        if diff:
            snapshot["diff"] = diff

    return snapshot


@mcp.tool()
@ensure_started
async def get_state(
    session_id: str, since: Optional[float] = None, record: bool = True
) -> dict:
    """Return the latest PTY buffers without sending additional input."""
    session = await store.get(session_id)
    snapshot = await session.snapshot(record=record)
    snapshot.update({"sessionId": session_id})

    if since is not None:
        diff = await session.diff_since(since)
        if diff:
            snapshot["diff"] = diff

    return snapshot


@mcp.tool()
@ensure_started
async def destroy_session(session_id: str) -> dict:
    """Terminate the PTY session."""
    destroyed = await store.destroy(session_id)
    return {"sessionId": session_id, "destroyed": destroyed}


def _build_diff(before: str, after: str) -> dict:
    from difflib import unified_diff

    diff_lines = unified_diff(
        before.splitlines(), after.splitlines(), lineterm="", fromfile="before", tofile="after"
    )
    diff_text = "\n".join(diff_lines)
    truncated = False

    if len(diff_text) > DIFF_CHAR_LIMIT:
        diff_text = diff_text[:DIFF_CHAR_LIMIT] + "\n...diff truncated..."
        truncated = True

    return {"text": diff_text, "truncated": truncated}


if __name__ == "__main__":
    mcp.run()
