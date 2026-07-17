#!/usr/bin/env python3
"""
Minimal watcher: restarts rules_injector_server.py when *.py or *.mdc
files under src/ or .cursor/rules/ change.

Pure-Python, no third-party deps.
"""
import subprocess, sys, time, hashlib, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
WATCH_DIRS = [ROOT / "src", ROOT / ".cursor" / "rules"]
CMD = [sys.executable, str(ROOT / "src" / "rules_injector_server.py")]

def snapshot() -> str:
    """Return a hash of mtimes for watched files."""
    mtimes = []
    for d in WATCH_DIRS:
        for path in d.rglob("*"):
            if path.suffix in {".py", ".mdc"} and path.is_file():
                mtimes.append(str(path.stat().st_mtime_ns))
    return hashlib.md5(",".join(mtimes).encode()).hexdigest()

def main() -> None:
    current_hash = snapshot()
    while True:
        proc = subprocess.Popen(CMD)
        print("▶ rules_injector_server started (PID", proc.pid, ")")
        try:
            while proc.poll() is None:
                time.sleep(1)
                new_hash = snapshot()
                if new_hash != current_hash:
                    print("⟳ change detected, restarting…")
                    current_hash = new_hash
                    proc.terminate()
                    proc.wait(2)
        finally:
            if proc.poll() is None:
                proc.terminate()
            proc.wait()

if __name__ == "__main__":
    main()
