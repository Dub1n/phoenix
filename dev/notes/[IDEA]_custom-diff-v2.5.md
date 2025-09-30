# Custom Diff Format — v2.5 (default for all future diffs/patches/edits)

---

## File headers

* **Small files:** If file **≤ 100 lines**, output the **entire file content** (full post-edit file).
* **Large files:** Use **v2.5 custom diff** per file. Multiple files allowed in one doc.

**Per-file header**:

* `@@ ./relative/path (lines=<N> newline=LF encoding=utf-8)` (+ optional `sha256_file=<hash>`).
* Paths are **repo-root relative**.

---

## Directives

* Directive lines start with `@ OPCODE ...`. Bodies end with a blank line.
* To include a literal directive/separator line, prefix with `\\@` (escaped).

### Replace op

* `@ REPLACE [inst=0|n] <old_start>-<old_end> -> <new_start>-<new_end> [scope=<lang>:<kind>:<name>] [sha256_old=<hash>]`

  * Body layout:

    * optional context above
    * `@ vvvvvv`  → **old begins below** (if absent, old starts at body top)
    * **OLD snippet**
    * `@ -----`   → separator
    * **NEW snippet**
    * `@ ^^^^^`   → **old ends above** (if absent, no trailing context)
    * optional context below
  * **inst semantics:** `inst=0` (default) = window must be **unique**; `inst=n` targets the **n‑th** match.

### Multi op

* `@ MULTI inst=[n1,n2,...] [scope=<...>] [mode=literal|regex] [case=sensitive|insensitive] [wordboundary=true|false] [normalize_newlines=true|false]`

  * Body is just **OLD**, `@ -----`, **NEW**.
  * Enumerate all matches; replace listed indices. Apply **right→left** to avoid shifting.

### Other ops

* `@ INSERT`, `@ DELETE`, `@ MOVE`, `@ CREATE`, `@ DELETE-FILE`, `@ RENAME`, `@ MODE`, `@ NOTE` — as in prior versions.

---

## Matching & application rules

* **Window uniqueness:** `inst=0` → must occur **exactly once**. `inst=n` → pick the n‑th occurrence.
* **Overlaps:** apply replacements right→left.
* **Idempotency:** if already equals NEW, op is a no‑op.
* **Normalization:** honor file’s declared newline/encoding.

---

## General expectations

* Prefer **`@ REPLACE`** for structured edits.
* Use **`@ MULTI`** for broad token/string renames.
* Include `scope=` when feasible.
* Multi‑file diffs allowed in one message.

---

## Agent Instructions (improved)

* If file **≤100 lines**, emit full new body.
* If file **>100 lines** but the edit touches **most of the file** or is a refactor spanning many regions, prefer a **whole‑file replacement op** instead of dozens of hunks. Use:

  * `@ REPLACE-FILE sha256_old=<hash>` followed by the new file body.
* Use `sha256_old` whenever possible to guard against drift (don't worry if you don't have the tooling for this).
* Always anchor windows with enough context to ensure uniqueness unless explicitly using `inst=`.
* If uncertain about safety, fall back to whole-file replacement with checksum.
* Never omit required markers (`@ vvvvvv`, `@ -----`, `@ ^^^^^`) when doing partial diffs.

This ensures the format works for both surgical edits and sweeping rewrites without breaking safety or clarity.
