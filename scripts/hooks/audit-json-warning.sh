#!/usr/bin/env bash
set -euo pipefail

warning_shown=0

mapfile -t new_files < <(git diff --cached --name-only --diff-filter=A)

if (( ${#new_files[@]} == 0 )); then
  exit 0
fi

for file in "${new_files[@]}"; do
  # Ignore files removed from staging between hook invocation and check
  if ! git ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
    continue
  fi

  case "${file,,}" in
    *.json|*.jsonl)
      ;;
    *)
      continue
      ;;
  esac

  if [[ "${file,,}" == *audit* ]] || grep -qi "audit" -- "$file" 2>/dev/null; then
    if (( warning_shown == 0 )); then
      printf '\n[pre-commit] Warning: Detected JSON files related to audits.\n' >&2
      warning_shown=1
    fi
    printf '  • %s\n' "$file" >&2
  fi
done

if (( warning_shown == 1 )); then
  printf 'Consider excluding large audit logs from git to keep history lean.\n\n' >&2
fi

exit 0
