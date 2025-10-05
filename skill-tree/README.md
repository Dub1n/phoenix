# Skill Tree System

A lightweight, agent-maintained skill tracker that lives alongside the codebase. It keeps a shared view of your current abilities, the evidence that backs each rating, and a journal of every check-in so you (and future helpers) can see how the journey evolves.

## Why This Exists

- Visualise progress with real-world role labels (Learner → Junior → Mid → Senior → Staff) instead of raw XP.
- Capture “proof” for each level: what you built, explained, or debugged.
- Surface momentum via readiness bars and cooldowns so you only face the next quiz when you’re genuinely ready.
- Keep a history of check-ins and achievements without wiring up an external service.

Everything is file-backed and portable: copy this folder plus the YAML state into any repo, skim this README, and the system is ready.

## Repository Layout

```filesystem
skill-tree/
├─ README.md          # This guide
├─ skill-tree.yaml    # Canonical state for all nodes
└─ skill-log/         # (Create on demand) dated check-in entries
```

Add `skill-tree/skill-log/` when you record the first session (one Markdown file per check-in).

## Role Ladder

Defined in `skill-tree.yaml → roles.ladder`:

| Id      | Label   | High-level Description                                            |
| ------- | ------- | ----------------------------------------------------------------- |
| learner | Learner | Building familiarity; needs step-by-step guidance.                |
| junior  | Junior  | Handles scoped tasks with guidance; recognises terminology.       |
| mid     | Mid     | Delivers features with light oversight; explains trade-offs.      |
| senior  | Senior  | Drives end-to-end solutions; teaches patterns and mitigates risk. |
| staff   | Staff   | Shapes cross-team architecture; anticipates systemic impact.      |

Agents promote/demote nodes against this ladder only after a focused evaluation.

## Node Schema (skill-tree.yaml)

Each node represents one domain or sub-domain. The hierarchy is capped at four levels (root → level-2 → level-3 → level-4) so the tree stays easy to scan.

```yaml
version: 0.1               # schema version
updated: YYYY-MM-DD         # last global edit
roles:
  ladder: …                 # shared level definitions
nodes:
  - id: node_async_patterns # stable identifier
    title: Node.js & Async Patterns
    parent: backend_implementation   # parent node id, null for roots
    level: learner          # learner|junior|mid|senior|staff
    readiness: 0.10         # 0–1 float approaching next evaluation
    test_cooldown: 0        # integer number of check-ins before retest allowed
    confidence: low         # low|medium|high (informal certainty signal)
    check_ins: 5            # total sessions logged via the CLI (-c)
    evidence: []            # bullet list of dated highlights
    last_test: null         # or map
    next_test_hint: "Explain event loop impacts on long-running watchers." # text prompt
    achievements: {}        # map of achievement_id -> boolean/metadata (rendered as [◆] when true)
    priority: false         # mark true to flag domains for focused lessons/tests
```

Example depth (maximum of four levels):

```nodetree
Engineering Execution
└─ Backend Implementation
   └─ Node.js & Async Patterns
      └─ Jest Watchers & Streaming HTTP
```

### Current top-level domains

- Engineering Execution
- Product & Delivery Leadership
- Quality & Testing Strategy
- DevOps & Platform Health
- Knowledge Flow & Communication

## Areas Covered Supplement (areas.yaml)

Use `skill-tree/areas.yaml` to capture micro-topics that are smaller than a full node. Each entry links to the parent node and carries a status flag so agents know whether the concept is new, familiar, or mastered.

```yaml
version: 0.1
statuses:                # shared legend
  - id: unseen
    label: Unseen
    description: No exposure yet.
  - id: encountered
    label: Encountered
    description: Touched briefly; would need guidance to revisit.
  - id: learning
    label: Learning
    description: Building understanding with support.
  - id: confident
    label: Confident
    description: Comfortable applying independently.
areas:
  - node: jest_watchers_streaming
    topics:
      - id: watch_mode_flake_diagnosis
        label: Watch mode flake diagnosis
        status: encountered
        last_covered: 2025-10-04
        note: Observed duplicate watcher issue; needs follow-up lesson.
        priority: false
      - id: streaming_response_cleanup
        label: Streaming response cleanup
        status: unseen
        priority: false
```

Agents should add or update topics whenever a session brushes a fine-grained detail that doesn’t warrant its own node. Keep notes short (one line max). Status values must use the legend above. Flip `priority: true` when the user is actively specialising in that topic so future lessons/tests favour it when relevant. Achievements render as `[◆]` once earned and `[ ]` otherwise; a legend is appended to the Markdown view.

### `last_test`

When populated:

```yaml
last_test:
  date: 2025-10-03
  outcome: fail            # pass|fail
  summary: Missed edge case for parallel runs.
```

### `achievements`

Keep achievement ids short and reuse them across nodes where the milestone makes sense:

```yaml
achievements:
  first_unit_test: true
  explained_scope_creep: 2025-10-02   # optional date metadata
```

## Check-in Template (skill-log)

Create a new Markdown file under `skill-tree/skill-log/` whenever you log a session, named e.g. `2025-10-04--jest-watch.md`.

```markdown
## Check-in: 2025-10-04

- Domains touched: Testing (jest watch guard), Architecture (session cache guard)
- Level changes: Testing → Mid (prev: Junior); Architecture → unchanged (Senior)
- Evidence summary:
  - Designed jest watch guard to prevent duplicate sessions.
  - Explained idempotency and cached session behaviour.
- Next focus / follow-up:
  - Draft checklist for smoke tests before next backend change.
- Notes: Spot quiz planned on isolating flaky watchers once cooldown clears.
```

## Agent Workflow (Portable Playbook)

1. **Detect learning**: If the session teaches a concept, unlocks a capability, or you request a skill-tree check-in, update `skill-tree/skill-tree.yaml` and create a log entry unless you explicitly defer.
2. **Update nodes**:
   - Pick every relevant node (create one if needed, wiring up `parent`).
   - Adjust `level`, `readiness`, `test_cooldown`, `confidence`, `evidence`, and `next_test_hint` per the rules below.
   - Keep the hierarchy within the four-level cap. If a new detail would exceed it, create a sibling branch or reorganise existing nodes instead of nesting deeper.
   - Append dated bullets to `evidence` in the form `YYYY-MM-DD: short detail`.
3. **Readiness & Cooldown**:
   - Increase `readiness` for solid progress (cap at `1.0`).
   - After a **promotion**, set `readiness = 0.1`, `test_cooldown = 1`, and write the success to `last_test`.
   - After a **failure**, set `test_cooldown = max(2, ceil(previous_readiness * 4))`, set `readiness = max(0.1, previous_readiness / 2 - 0.2)`, and document the gap in `evidence`.
   - Otherwise, decrement `test_cooldown` once per subsequent check-in until it reaches `0`.
4. **Testing**:
   - Only quiz a node if `readiness >= 1` and `test_cooldown == 0`.
   - Limit to one test per session. If multiple nodes are ready, note the rest in the log for follow-up.
5. **Concept checks**:
   - Sprinkle short comprehension questions. If missed, explain the answer, give a fill-in-the-blank recap (with a tiny word bank), have the user repeat it, and log the takeaway.
6. **Spotlight** *(for future renderers)*:
   - Optionally mark any standout solution as “solution of the day” in the log—render tools can surface the latest highlight.

## Maintenance Checklist

- [ ] Update `skill-tree/skill-tree.yaml` (respecting YAML syntax).
- [ ] Regenerate or append `skill-tree/skill-log/YYYY-MM-DD--topic.md`.
- [ ] Mention the skill tree update in your session summary so the user knows a snapshot exists.
- [ ] If nodes or achievements were added, ensure identifiers are short, lowercase, and unique.

## Rendering / Automation

### CLI helpers

- `npm run skill-tree:lookup -- <node-id>` — read-only snapshot.
- `npm run skill-tree:update -- --node <id> <ops...>` — single-call writer for node updates, topic tweaks, check-in tallies, and log creation (auto-renders the Markdown view unless `--skip-render`). Supports:
  - Readiness and level adjustments (`--readiness +0.1`, `--set-readiness 0.4`, `--level junior`).
  - Evidence, achievements, and hints (`--evidence "Built WSL migration plan"`, `--achievement first_watch_fix=true`, `--set-next-hint "Outline pv pipeline"`).
  - Topic management (`--topic-upsert id=wsl_migration,status=learning,note="Covered move"`).
  - Node lifecycle (`--create-node id=observability,title="Observability",parent=devops_platform`, `--set-title "Observability & Telemetry"`, `--set-parent devops_platform`, `--remove-node observability --cascade`).
  - Logging (`--log "- Domains touched: …" --log-slug tooling-automation`, `--log-file notes/check-in.md`).
  - Session tallies (`-c` once per session increments `check_ins`). Use `--dry-run` for previews.

The update CLI regenerates `skill-tree/skill-tree.md` by default; pass `--skip-render` when you only want to touch YAML/logs (e.g. in locked-down CI). You can still render manually when needed:

```bash
npm run render:skill-tree
```

The renderer parses `skill-tree/skill-tree.yaml`, computes summary metrics, and writes an updated `skill-tree/skill-tree.md` with readiness bars, last check-in info, and recent highlights.

Need a quick capability snapshot before summarising work? Use the lookup helper (`npm run skill-tree:lookup -- node_async_patterns`).

## Portability Tips

1. Copy `skill-tree/` into the new project.
2. Update the `roles.ladder` descriptions if the level definitions change.
3. Ensure `AGENTS.md` (or equivalent guidance) includes the “Skill Tree Maintenance” section so helpers know the playbook.
4. Keep `scripts/skill-tree/render.mjs` with the repo; copy it alongside this folder if you migrate to another project.

This README, the YAML schema, and the playbook give you everything you need to keep the system humming.

> codex resume 0199ab88-c4c8-7c23-a45b-938f0c70acde
