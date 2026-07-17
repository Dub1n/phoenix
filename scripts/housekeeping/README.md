# Repository Housekeeping

- `clean-build-artifacts.sh` removes generated build artifacts.
- `rclone-filters.txt` is the repository-wide filter set for rclone operations.
  Pass it with `rclone --filter-from scripts/housekeeping/rclone-filters.txt ...`
  when running from the repository root.
