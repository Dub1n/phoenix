# Harness Timeout Investigation (Codex)

## Issue Overview

- Multiple long-running test commands appear to keep the Codex CLI session stuck in a `running…` state even after individual invocations report completion or timeout.
- Operators suspect the harness timeout (expected ~120s default) is not reliably terminating nested processes such as Jest test runners when they spawn child processes.
- Objective: document observed behavior, confirm the harness timeout parameters, and capture evidence for follow-up debugging.

## Environment Snapshot

- Repository: `/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault`
- Harness configuration: `approval_policy=never`, `sandbox_mode=danger-full-access`, shell defaults to `zsh` (commands run via `bash -lc`).
- Tests executed within the `Templum` workspace using `npm` + `jest`.

## Reproduction Attempts & Results

### 1. Baseline timeout experiments (`sleep`)

| Command     | Timeout             | Observed duration | Exit                              | Notes                                                        |
| ----------- | ------------------- | ----------------- | --------------------------------- | ------------------------------------------------------------ |
| `sleep 130` | `timeout_ms=130000` | 130s              | Harness timeout (`exit_code=124`) | Confirms we can raise ceiling above 120s when explicitly set |
| `sleep 130` | default             | 10s               | Harness timeout (`exit_code=124`) | Default cap in this environment is 10s, not 120s             |

### 2. Jest test run with explicit 30s timeout

- Command: `cd Templum && CI=1 npm test -- adapter-registry --detectOpenHandles`
- `timeout_ms=30000`
- Result: Jest exited on its own after ~15.5s (`exit_code=1`); harness did **not** trigger.
- Indicates the suite completes (with failures) before the 30s limit.

### 3. Jest runs with shorter timeouts and `time`

| Command                 | Timeout            | Harness behavior                                      | `time` output                                     |
| ----------------------- | ------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| `time CI=1 npm test \`  | `timeout_ms=5000`  | Harness killed process after ~15.0s (`exit_code=124`) | `time` wrapper output suppressed by timeout       |
| `-- adapter-registry \` | `timeout_ms=10000` | Harness killed process after ~15.0s (`exit_code=124`) | Same as above                                     |
| `--detectOpenHandles`   | `timeout_ms=20000` | Jest completed in ~12.7s (`exit_code=1`) before limit | `real 0m12.662s`, `user 0m2.206s`, `sys 0m0.953s` |

**Key takeaway:** harness appears to enforce a minimum effective timeout around 15s; any request below that still yields ~15s before termination.

### 4. Process table inspection

- Command: `ps -eo pid,ppid,etime,cmd | grep -E 'jest|CI=1 npm test' | grep -v grep`
- Output: dozens of `sh -c jest …` and `node …/jest.js …` processes with elapsed times ranging from minutes to hours.
- Many share a common parent PID (e.g., `278941`, `198187`, `356547`), suggesting earlier harness invocations left descendants running.
- Indicates the harness terminates only the shell it launched; descendant processes can survive and keep the command slot occupied from the user’s perspective.

## Observations & Hypotheses

- **Minimum timeout floor:** Requests for 5s/10s ended at ~15s, implying the harness imposes a lower bound independent of `timeout_ms`.
- **No global max detected:** Explicit 130s timeout honored, so upper bounds are flexible within reasonable ranges.
- **Zombie Jest processes:** Stale Jest instances persist after harness termination, supporting the user’s report that commands remain “running” even when Codex reports a timeout. These survivors likely hold file descriptors/stdout pipes open, delaying harness completion notifications in the TUI.
- **Nested process handling:** Harness likely sends a termination signal to the immediate child (shell), but not recursively to the entire process group. Jest’s child workers or watchers may continue executing, especially when launched via `npm`/`sh -c` wrappers.
- **Console buffering mismatch:** In tests where output flooded the console (e.g., long warning dumps), the user saw the TUI “running…” for longer than the reported duration, suggesting buffered data flush after process death further delays state updates.

## Gaps & Next Steps

1. **Confirm signal behavior:** Inspect harness source or logs to determine whether it uses `SIGTERM`/`SIGKILL` and whether it targets the process group; reproduce with a custom script that spawns grandchildren and traps signals.
2. **Mitigate lingering Jest processes:** Experiment with launching commands using `exec` (e.g., `node node_modules/.bin/jest …`) or wrapping in `bash -lc 'exec npm …'` so children share the same PID, enabling single-shot termination.
3. **Watchman/IPC handles:** The repeated `--detectOpenHandles` errors imply open sockets/child processes created by the test suite itself; addressing those leaks might shorten teardown times even without harness changes.
4. **CLI feedback:** Instrument the CLI to surface `exit_code=124` and elapsed time more prominently so operators can distinguish harness timeouts from genuine hangs.
5. **Cleanup script:** Provide cron or manual command to reap stale Jest processes (`pkill -f jest`) before running new tests to avoid compounded interference.

## Open Questions

- Does the harness support sending signals to the entire process group (e.g., using `setpgid` or `killpg`)? If so, why are grandchildren persisting? If not, should the CLI adopt a session wrapper to manage process groups explicitly?
- Could Node’s handling of `SIGTERM` lead Jest to linger unless it receives `SIGKILL` after a grace period? Observed elapsed times (>40 minutes) suggest the grace period may be absent.
- Is the 15s minimum tied to instrumentation overhead (e.g., additional logging or cleanup) or a safety buffer in the CLI to gather output before closing pipes?

## Recommendations for Future Diagnostics

- Build a dedicated repro script that spawns a process tree (`bash -> node -> child sleep`) to observe which children survive the harness timeout.
- Add logging hook (if possible) to capture harness PID cleanup and signal sequences.
- Coordinate with harness maintainers to review whether `setsid` or similar options can enforce group-wide termination.
- Document the observed 15s floor and zombie-process behavior in CLI onboarding materials so operators know to clean up with `pkill` when necessary.
