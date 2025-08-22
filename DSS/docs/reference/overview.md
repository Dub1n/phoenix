# 📚 Deep-Research Overview — Data SuperStructure (DSS)

---

## 1 · Why DSS?

> **Goal:** make any dataset / codebase feel *native* to an LLM—minimal prompt tokens, zero duplicated effort, and crystal-clear navigation for humans.
>
> **How:** store everything as plaintext (Markdown, code, JSON) plus light metadata so GitHub, Obsidian, Cursor **and** GPT all see the same structure.

### Core benefits

| Need           | DSS Answer                                         |
| -------------- | -------------------------------------------------- |
| *Fast recall*  | Summaries + tags keep prompts short.               |
| *Modularity*   | Each concept lives in its own file—no giant blobs. |
| *Human UX*     | GitHub renders; Obsidian graphs; Cursor searches.  |
| *Self-healing* | An LLM can update docs/links/canvas in one pass.   |

---

## 2 · Structural Rules 🏗️

1. **Logical segmentation** – split only when it saves context or mental load.
2. **Front-matter YAML** – tags, provides/requires, status.
3. **In-text links** – never paste the same explanation twice; link to it.
4. **Folder READMEs** – 2-sentence overview + file list.
5. **INDEX.md** – one-page map of the whole repo.
6. **Road-map** – simple Markdown Kanban/Gantt (`meta/roadmap.md`).
7. **Canvas** – JSON diagrams in `/canvas/` for instant architecture glance.

---

## 3 · Memory & Context Efficiency 🧠

* Layered info: README → summary docs → full code.
* Keep individual Markdown files < 3-4 K tokens; code files function-level where possible.
* DRY everywhere—duplication wastes tokens and breeds mis-sync docs.
* Retrieval-first naming (`auth.py`, not `chapter7.py`).
* Place the **most relevant snippet last** in prompts so transformers weight it higher.

---

## 4 · Metadata & Linking 🔗

```yaml
---
module: "auth"
provides: ["login_user", "logout_user"]
requires: ["database.py", "session.py"]
tags: [security, api]
status: stable
---
```

* Backlinks / *See-also* sections create a poor-man’s knowledge graph.
* `meta/update_links.py` → CI hook that breaks build on dead links.
* `meta/glossary.md` → alphabetical master list of concepts with links.

---

## 5 · LLM Automation Playbook 🤖  (`assistant.md`)

1. **Edit code** ⇒ patch YAML, docs, canvas, road-map, run link checker, commit.
2. **Write docs first** ⇒ generate stubs in `src/`, continue as above.
3. Commit message form: `feat: <thing> | docs+meta auto-update`.

Hook it via:

* *Pre-commit hook* (diff-based context to LLM)
* *Cursor* super-command `/sync-dss`
* *GitHub Action* nightly doc-rot check

---

## 6 · Suggested Template 🌳

```text
project/
├ README.md
├ INDEX.md
├ assistant.md           # bot instructions
├ data/                  # raw & processed
│  └ README.md
├ src/                   # code
│  └ README.md
├ docs/                  # long-form explanations
│  ├ architecture.md
│  └ api_reference.md
├ canvas/
│  └ architecture.canvas
├ meta/
│  ├ DSS_GUIDE.md        # human guide
│  ├ roadmap.md
│  ├ update_links.py
│  └ generate_docs.py
└ tests/
```

---

## 7 · Iteration Cycle 🔁

1. **Audit** – list files, token counts, pain-points.
2. **Map use-cases** – draft Q\&A you expect the LLM to solve.
3. **Refactor structure** – merge/split, add links, rename for clarity.
4. **Regenerate docs/canvas** – via automation.
5. **Test** – ask the LLM again; compare token cost & answer quality.
6. **Document the change** – update `meta/DSS_GUIDE.md`.

---

## 8 · Future Ideas 🚀

* Pipe plaintext graph into real graph DB (Neo4j) or embedding index.
* Auto-layout Canvas with hierarchical clustering.
* One-click “Onboard new dev” script that spits out custom cheat-sheet.

---

> *Everything here is intentionally lightweight.  Edit freely; the LLM will keep up as the structure evolves.*
