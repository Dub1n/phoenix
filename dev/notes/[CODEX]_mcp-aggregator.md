# codex-pool aggregator — architecture spec

## purpose

accept a single **batch** request with N codex subtasks, dispatch them to a **pool of `codex mcp` servers** (separate processes/labels), wait for all to complete, and return an aggregated result. fan-out happens inside the aggregator; the calling agent makes **one** MCP call.

## references (why this design is sound)

* codex exposes `codex` and `codex-reply` as MCP tools; `prompt` is required, other knobs optional.
* fastmcp gives you a server framework, an MCP **Client**, and built-ins for **proxying** and **composition** (good for talking to multiple downstream servers).
* the OpenAI MCP tool can produce **multiple tool calls per turn** (batching is legit); whether they’re parallel depends on the orchestrator — here, the aggregator becomes that orchestrator.

---

## components

1. **Aggregator (this service)** — FastMCP server (Python), one public tool:

   * `codex_pool.batch(tasks: Task[]) -> BatchResult`
   * optional: `codex_pool.reply_batch(replies: Reply[])` to continue sessions.

2. **Workers** — your existing `codex mcp` processes:

   * stdio transport, each with a **unique label** (`codex2`, `codex3`, …).
   * each worker handles **one long session at a time** (treat as capacity=1).

3. **Client layer** — FastMCP `Client` instances, one per worker, maintained and reused (keep-alive).

---

## tool interface (MCP schema)

### request

```json
{
  "tasks": [
    {
      "prompt": "init a minimal vite+react+ts app; list created files only",
      "cwd": "/work/frontend",
      "sandbox": "workspace-write",       // default: "read-only"
      "approval-policy": "never",         // default: "never"
      "model": "o4-mini",                 // optional
      "profile": "frontend",              // optional
      "base-instructions": "...",         // optional
      "config": {                         // optional passthrough overrides
        "rollout_mode": "disabled"
      },
      "preferred_server": "codex3",       // optional hint
      "timeout_sec": 600                  // optional per-task wall clock
    }
  ]
}
```

### response

```json
{
  "results": [
    {
      "task_index": 0,
      "server_label": "codex3",
      "conversationId": "uuid-or-id",
      "status": "ok",                     // "ok" | "error" | "timeout"
      "output": "... raw tool output ...",
      "duration_ms": 183422
    }
  ],
  "errors": [
    {
      "task_index": 2,
      "server_label": "codex5",
      "status": "timeout",
      "message": "deadline exceeded at 600s"
    }
  ]
}
```

> notes
> • `config` is the same override bag Codex accepts (mirrors `~/.codex/config.toml`).
> • explicit top-level fields (`sandbox`, `approval-policy`, etc.) are passed as proper codex args; only non-surfaced keys go in `config`.

---

## dispatch algorithm

* **worker model:** each `codex mcp` process = a worker with capacity 1.
* **routing:**

  1. if `preferred_server` present and idle → assign.
  2. otherwise **least-busy** (idle first; else shortest queue).
  3. optional strategy: simple **round-robin** across idle workers, then queue.
* **execution:** spawn all assigned calls with `asyncio.gather` and **per-task** timeouts; forward `{prompt, cwd, sandbox, approval-policy, model, profile, base-instructions, config}` into the downstream tool call `name="codex"`.
* **session map:** keep `conversationId → server_label` to support `reply_batch` later (each reply routes to the original worker and calls `codex-reply`).

---

## timeouts & reliability

* **outer timeout:** `timeout_sec` per task at the aggregator (actual cancellation).
* **no approvals:** default `"approval-policy":"never"` so no hidden prompts stall.
* **logging:** set env `RUST_LOG=codex_core=info` for each worker process so you can read failures in stderr or `~/.codex/log/codex-tui.log`.
* **retry policy:** on `error` (not timeout), one **quick retry** with a shorter prompt (configurable).
* **backpressure:** if all workers are busy, queue tasks; respond when **all** are done (synchronous boundary).

---

## security defaults

* default `sandbox: "read-only"`; only elevate when caller asks.
* never override caller’s `cwd` silently; validate existence.
* optional allowlist for `cwd` roots.

---

## minimal flow (sequence)

```diagram
Agent ──mcp.call codex_pool.batch(tasks[...])──▶ Aggregator
Aggregator ──(parallel) call codexN.codex(args)──▶ Worker N  (stdio MCP)
Aggregator ◀────────────── tool outputs ────────── Worker N
Aggregator ──returns aggregated results──────────▶ Agent
```

---

## implementation sketch (FastMCP)

> this is just the shape; you can wire it in a few hours.

```python
# server.py
from fastmcp import FastMCP, Client, Context
import asyncio, os, time

mcp = FastMCP("codex-pool")

# configure your workers here
WORKERS = ["codex2", "codex3", "codex4", "codex5"]
clients = {}
locks = {}
session_owner = {}  # conversationId -> server_label

async def ensure_clients():
    for label in WORKERS:
        if label not in clients:
            # stdio: launch "codex mcp" for each worker label via your own supervisor,
            # or rely on PATH if already managed; fastmcp Client can attach by command too.
            clients[label] = Client({"mcpServers": {label: {"command": "codex", "args": ["mcp"]}}})
            locks[label] = asyncio.Semaphore(1)
    # open all
    await asyncio.gather(*[c.__aenter__() for c in clients.values()])

@mcp.tool
async def batch(tasks: list[dict], ctx: Context):
    await ensure_clients()

    async def run_one(i, task):
        # choose server
        label = task.get("preferred_server") or min(WORKERS, key=lambda l: locks[l]._value)
        args = {
            k: v for k, v in task.items()
            if k in ("prompt","cwd","sandbox","approval-policy","model","profile","base-instructions","config")
        }
        timeout = task.get("timeout_sec", 600)
        t0 = time.time()

        async with locks[label]:  # capacity=1 per worker
            try:
                coro = clients[label].call_tool(f"{label}_codex", args)  # tool name may be "codex" with server scoping
                res = await asyncio.wait_for(coro, timeout=timeout)
                out = res.content[0].text if res.content else ""
                # try to parse conversationId from out if codex returns one
                conv_id = None
                # ...extract...
                if conv_id:
                    session_owner[conv_id] = label
                return {"task_index": i, "server_label": label, "status": "ok",
                        "output": out, "conversationId": conv_id,
                        "duration_ms": int((time.time()-t0)*1000)}
            except asyncio.TimeoutError:
                return {"task_index": i, "server_label": label, "status": "timeout",
                        "message": f"deadline exceeded at {timeout}s"}
            except Exception as e:
                return {"task_index": i, "server_label": label, "status": "error",
                        "message": str(e)}

    results = await asyncio.gather(*(run_one(i, t) for i, t in enumerate(tasks)))
    return {"results": results, "errors": [r for r in results if r["status"] != "ok"]}

# optional: reply_batch using session_owner[...] + "codex-reply"

if __name__ == "__main__":
    mcp.run()  # stdio; or mcp.run(transport="sse", host="127.0.0.1", port=8000)
```

> fastmcp supports **clients**, stdio/SSE transports, and proxy patterns; you can also mount/import servers if you later collapse this into your stelae stack.

---

## acceptance checklist

* send `codex_pool.batch` with 2+ tasks → both run on different workers; aggregator returns a single combined payload after **both** finish.
* per-task `timeout_sec` cancels only that task; others continue.
* default approval/sandbox applied; no invisible approvals hang runs.
* logs show which worker handled which task; failures include messages.
* optional: `reply_batch` continues the right session based on `conversationId`.

---

## future niceties (optional)

* **round-robin + health checks**; auto-eject a sick worker.
* **metrics**: moving average duration per worker → smarter load balancing.
* **SSE front**: `mcp.run(transport="sse")` to publish a URL for ChatGPT connectors later.
* **capacity>1 workers**: if you later wrap `codex mcp` in containers with pooling, bump the semaphore.

that’s the whole picture. if you want, i can turn the sketch into a drop-in FastMCP app with a minimal test harness so you can hammer it locally before folding into stelae.
