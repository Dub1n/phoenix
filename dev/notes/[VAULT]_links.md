## Links

C:\Users\gabri\.claude\commands\pr\task.md
C:\Users\gabri\.claude\commands\pr\validate.md
C:\Users\gabri\.claude\commands\pr\document.md

`source ~/.venv/bin/activate`

invoke commands as ["bash","-lc",…]

## Stelae Startup

source ~/.venvs/stelae-bridge/bin/activate
`pm2 start ecosystem.config.js`

## Apply clipboard diffs

./dev/stelae/scripts/apply-clipboard-diff.sh

(from the /gabri/dev/stelae/scripts/apply-clipboard-diff.sh folder)

## Config Path Expansion (*move this*)

````markdown
# ADR: Config Path Expansion for `stelae`

**Status:** Proposed  
**Date:** 2025-09-24  
**Context:** Phase 2 setup of `stelae` MCP stack

---

## Problem

The `mcp-proxy` requires absolute paths in `proxy.json`.  
Developers naturally want to write configs like:

\```json
{
  "command": "rust-mcp-filesystem",
  "args": ["--root", "~/dev/stelae"]
}
\````

or

\```json
{
  "args": ["--root", "$HOME/dev/stelae"]
}
\```

But neither `~` nor `$HOME` expand in raw JSON, because the proxy does not invoke a shell.
This creates a tension between:

* **Portability** — want configs to survive across machines/users.
* **Cleanliness** — want configs to remain human-friendly (`~/…` instead of `/home/gabri/…`).
* **Simplicity** — want minimal moving parts, not a fragile pipeline.

---

## Issues Being Addressed

* **Absolute paths are brittle**: configs tied to `/home/gabri/…` break for other users.
* **Lack of shell expansion**: JSON has no native support for `~` or `$HOME`.
* **Maintenance overhead**: need to decide whether to introduce wrappers, preprocessors, or templating.

These are *minor issues* (configs work fine with absolutes), but smoothing them helps portability and reduces foot-guns later.

---

## Considered Options

### 1. Do Nothing

* **Config**: hardcode `/home/gabri/dev/stelae`.
* **Pros**: simplest, no extra tools.
* **Cons**: unportable, clutters diffs if users differ.

---

### 2. Wrapper Script (Runtime Expansion)

* **Approach**: add a small launcher (`expand-exec` or `exec-home`) that expands `~`/`$HOME` at runtime.
* **Pros**: keeps `proxy.json` portable (`$HOME/dev/stelae` works).
* **Cons**: adds an indirection layer; tiny startup overhead.

---

### 3. Preprocessing with `envsubst`

* **Approach**: maintain `proxy.json.tmpl` with `$HOME`, expand into `proxy.json` before launch.
* **Pros**: robust, fast (<2 ms), uses a well-known tool (`gettext-base`).
* **Cons**: introduces an extra step (`envsubst`) or wrapper around launch.

---

### 4. Preprocessing with `jq`

* **Approach**: walk JSON, replace `~/…` with `$HOME/…`.
* **Pros**: lets configs keep the *tilde* form (`~/dev/stelae`).
* **Cons**: requires jq; adds a preprocessing step; still not “live”.

---

### 5. Symlink / Fixed Path

* **Approach**: symlink a stable path (e.g. `/opt/stelae-root`) to the actual user directory.
* **Pros**: avoids expansion; config always points to `/opt/stelae-root`.
* **Cons**: requires setup per machine; less obvious where files really live.

---

## Decision

**Deferred.**
For now, configs will use absolute paths during Phase 2 bring-up.
This keeps the setup simple while stelae stabilises.

Portability / path-expansion can be revisited once:

* multiple users/machines are involved, or
* configs become annoying to maintain due to absolute paths.

---

## Consequences

* Short term: configs are “ugly but stable.”
* Long term: we may adopt `envsubst` (option 3) or wrapper scripts (option 2) if portability pain grows.
* The decision to defer avoids premature complexity but documents the trade-offs for future contributors.

---

## Notes

* If adopting **option 3**, install size is \~1–2 MB (`gettext-base`) and runtime overhead is negligible.
* If adopting **option 2**, wrapper scripts add only \~1–5 ms on startup; runtime latency is zero.
* Both can be wired into a `Makefile` or `proxy-start` script later.
```
