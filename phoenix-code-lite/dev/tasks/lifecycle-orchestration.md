# Task: Lifecycle orchestration with gated transitions and signatures.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Lifecycle orchestration with gated transitions and signatures."

## Prerequisites
- [~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage). — Lifecycle gating must read the finalized traceability data to score stage readiness and artifact completeness.
- [ ] Regulatory metadata catalog (standards clauses, owners, timestamps) live in system. — Electronic signature enforcement depends on resolved approver roles pulled from the catalog.
- [ ] Validation System integration blocking promotions on failed checks. — Transition gating must execute validator verdicts before allowing promotions.

## Implementation Steps
### Unblocked Actions
- [ ] Capture lifecycle gating scenarios with Jest in `phoenix-code-lite/tests/qms/lifecycle-orchestrator.test.ts`, covering stage transitions, rejected promotions, dual-approver signatures, and persisted audit hashes before writing production code.
- [ ] Introduce lifecycle stage contracts in `phoenix-code-lite/src/qms/lifecycle/stage-definition.ts` using `zod` to codify stage IDs, entry/exit criteria, required signatures, validator hooks, and generated artefacts consumed by the orchestrator and tests.
- [ ] Implement `LifecycleSignatureLedger` in `phoenix-code-lite/src/qms/lifecycle/signature-ledger.ts` to persist electronic signatures, chain SHA-256 digests per transition, and reuse `AuditLogger`/`AuditCryptographyValidator` for integrity verification and audit emission.
- [ ] Build `LifecycleOrchestrator` in `phoenix-code-lite/src/qms/lifecycle/lifecycle-orchestrator.ts` that loads stage definitions, evaluates gating criteria against provided traceability snapshots, enforces signature requirements, and emits structured audit/metrics events through `AuditLogger` and `SessionManager`.
- [ ] Add workflow surfaces (`qms:lifecycle status|transition`) by registering commands in `phoenix-code-lite/src/commands/core-commands.ts` (or a dedicated QMS module) and wiring CLI parsing in `phoenix-code-lite/src/cli/args.ts` so engineers can inspect state, request transitions, and supply signer credentials.
- [ ] Extend `docs/current/architecture-spec.md` (Workflow Automation + Operational Considerations) with lifecycle orchestrator design notes, signature ledger flow, and gating checks required for regulated releases.

### Blocked Actions (pending `[~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage).`)
- [ ] Replace mocked traceability snapshots in orchestrator tests with the finalized data access layer once available, ensuring stage criteria query the real requirements/risk APIs without schema drift.

### Blocked Actions (pending `[ ] Regulatory metadata catalog (standards clauses, owners, timestamps) live in system.`)
- [ ] Wire `LifecycleSignatureLedger` to resolve approver roles and clause ownership from the catalog, enforcing dual-signature routing, expiry windows, and revocation checks using production metadata instead of fixtures.

### Blocked Actions (pending `[ ] Validation System integration blocking promotions on failed checks.`)
- [ ] Connect the orchestrator's validation hooks to the actual Validation System adapter so gate evaluations fail fast on outstanding findings and surface validator digests alongside signature events.

## Definition of Done
- Tests to run: `npm test -- tests/qms/lifecycle-orchestrator.test.ts`, `npm run build`, CLI smoke `node dist/unified-cli.js qms:lifecycle status`.
- Validation/commands: `node dist/unified-cli.js qms:lifecycle transition --stage verification --signer "<name>" --credential <path>` to exercise signature capture; rerun cryptographic checks via `npm test -- src/preparation/audit-cryptography-validator.test.ts` (or equivalent suite once added).
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/index/ARCHITECTURE-DIAGRAM.md` if lifecycle visuals change.

## References
- Progress entry: `docs/current/progress.md:13`
- Architecture spec: `docs/current/architecture-spec.md:31`, `docs/current/architecture-spec.md:42`
- Supporting code: `src/utils/audit-logger.ts`, `src/preparation/audit-cryptography-validator.ts`, `src/core/session-manager.ts`

## Current Status (2025-02-15)
- Implementation: no `src/qms/lifecycle/` directory, stage schemas, signature ledger, or CLI commands have been added; existing session manager and audit logger are unaware of lifecycle states or gated transitions.
- Tests executed: none — lifecycle orchestrator suites referenced in the plan are not present, and no mocks exercise signature flows or validator gating.
- Coverage snapshot: not applicable (orchestrator modules absent).
- Gaps blocking completion: awaiting traceability data access, regulatory catalog roles, Validation System adapters, and baseline tests to capture stage transitions and audit chaining.
