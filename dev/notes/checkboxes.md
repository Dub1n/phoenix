[ ] to-do / open: the standard, unfinished task.

[x] done / complete: the standard, finished task.

[~] in progress: partially complete, actively being worked on.

[-] cancelled / ~~wont-do~~: a task that is no longer relevant or has been dropped. combining this with strikethrough

[>] forwarded: the task has been moved to another list, document, or day.

[<] scheduled: the task has been scheduled for a future date or sometimes today's date

[?] question / blocked: the task requires more information or is blocked by something else.

[!] important / must-do: marks a task as a priority. an asterisk [*] is also sometimes used.

[o] event / appointment: sometimes used to denote a calendar event rather than a task.

[F] failure

[B] implemented-broken: core logic done but compilation/tests failing (requires structural fix)

[T] implemented-testing: compiles but needs functional validation

## templum-tracker-data

- [x] **complete** - Verified working (confirmed functional with real backend evidence)
- [~] **in-progress** - Under development (e.g. works with placeholder implementations)
- [-] **cancelled** - Task is no longer relevant or has been dropped
- [!] **priority** - Issue (e.g. Fake success: reported working but uses mocks/placeholders)
- [>] **forwarded** - Task has been moved to another location (e.g. different project)
- [<] **scheduled** - Not implemented (confirmed missing or completely placeholder)
- [?] **blocked** - the task requires more information or is blocked by something else
- [B] **implemented-broken** - Core logic done but build failures prevent verification
- [T] **implemented-testing** - Ccompiles but needs functional validation

## templum-active-tasks

- `[!]` = priority (do this next)
- `[n]` = sequence-order (do these in order after !)
- `[ ]` = pending
- `[~]` = in-progress  
- `[x]` = complete
- `[-]` = cancelled
- `[>]` = forwarded
- `[<]` = scheduled
- `[?]` = blocked/unknown
- `[B]` = implemented-broken: core logic done but compilation/tests failing (requires structural fix)
- `[T]` = implemented-testing: compiles but needs functional validation
