## Check-in: 2025-10-05

- Domains touched: Tooling & Automation (WSL filesystem), Engineering Execution (git hygiene)
- Level changes: Tooling & Automation → readiness +0.10 (still Learner)
- Evidence summary:
  - Guided safe migration from /mnt/c to ~/dev, covering backups, move mechanics, and mv vs tar/pv trade-offs.
  - User restated why .git metadata is volatile and how tar/pv rely on streaming data.
- Next focus / follow-up: Sweep for hard-coded Windows paths in hooks and automation; consider scripting an rsync wrapper for progress visibility.
- Notes: No tests scheduled; cooldown unchanged.
