---
date-created: 2025-09-16T150000Z
last-updated: 2025-09-16T150000Z
name: validation-async-utils
description: Shared execution helpers for the validation system that wrap Templum AsyncUtils to eliminate bespoke timeout logic.
status: established
category: validation-core
use-when:
  - Validator code needs to enforce execution timeouts or retries
  - Command runners should share consistent async behaviour
  - Reusing Templum AsyncUtils inside validation scripts is preferred over duplicating logic
keywords:
  - async-utils
  - timeout-management
  - validation
  - command-runner
  - promise-utilities
prerequisites:
  - templum-async-utils
  - validation-scope-utils
related-patterns:
  - async-utils
  - resilience-utils
  - validator-command-runner
---

### Validation Execution Timeout Helper

**Problem**: Architecture and feature validators maintained bespoke `setTimeout` wrappers to guard long-running analyses and command spawns. The duplication diverged from the centralised async patterns defined in `Templum/src/utils/async-utils.ts`, made timeout behaviour inconsistent, and complicated future validator work.

**Solution**: Introduce `scripts/validation/src/core/execution-utils.js`, a thin module that re-exports `AsyncUtils.withTimeout`. Validators now depend on a single helper for timeout enforcement, matching the behaviour used across the wider Templum codebase.

```js
// scripts/validation/src/core/execution-utils.js
import { withTimeout as templumWithTimeout } from '../../../../Templum/src/utils/async-utils.ts';

export const withTimeout = templumWithTimeout;
export default { withTimeout };
```

#### Usage Patterns

- **Architecture Validator** converts its inline timeout wrapper to call `withTimeout`, returning consistent failure metadata when an operation throws or exceeds the limit.
- **Feature Validator** wraps its spawned test commands in a promise passed to `withTimeout`, killing the child process on timeout and avoiding manual timer bookkeeping.
- Future validators or orchestration utilities should import `withTimeout` from `../core/execution-utils.js` rather than crafting bespoke timers.

```js
import { withTimeout } from '../core/execution-utils.js';

const timeoutError = new Error(`Command timed out after ${timeout}ms`);
const result = await withTimeout(commandPromise, timeout, timeoutError);
```

#### Migration Checklist

- [x] Replace local `setTimeout`/`Promise.race` helpers with `withTimeout`.
- [x] Ensure timeout rejections are translated into validator-friendly error results.
- [x] Clean up spawned resources (child processes, intervals) when the timeout triggers.
- [ ] Extend the helper with additional async utilities (e.g. retries) when required by future validators.

#### Impact

- Eliminates duplicated timeout logic across validators.
- Aligns validation system async behaviour with the established Templum async utilities.
- Simplifies future validator development by standardising execution helpers.
