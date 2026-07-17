# Lane 6m Validation Summary — 2025-10-14

## Command: npm run test:ci -- --runTestsByPath tests/core/observability-adapter.test.ts src/tests/backend/service-discovery.test.ts
- Runner: node scripts/run-with-timeout.mjs --timeout 60000 -- …
- Outcome: Jest suite completed in ~10.9s with all 25 assertions passing; coverage governance thresholds remained green.
- Note: Wrapper signalled timeout after 148s because the outer process kept the PID alive despite the suite finishing. Logs confirm success prior to timeout; no rerun per lane lead guidance.

## Command: npm run phase6-validation
- Runner: node scripts/run-with-timeout.mjs --timeout 180000 -- …
- Outcome: Completed successfully in ~7s. All Phase 6 workflows (pcl-to-haruspex, haruspex-to-templum, end-to-end-tdd, cross-interface-sync) passed with 100% cross-interface consistency.
- Artefacts: Console log captured in activity transcript; no additional report files emitted for this run.

Lane cleanup sweep executed via `npm run consolidate -- sweep 4 --lane 6m` (no matches required).
