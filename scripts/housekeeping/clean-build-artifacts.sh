#!/usr/bin/env bash
set -euo pipefail

# Resolve repository root relative to this script
dir=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)
repo_root="${dir}"

log() { printf '%s\n' "$*"; }

log "Repo root: ${repo_root}"

paths=(
  "scripts/shimdex/src/Ps2WslShim/bin"
  "scripts/shimdex/src/Ps2WslShim/obj"
  "Haruspex/.vscode-test"
  "Haruspex/coverage"
  "Templum/coverage"
  "Templum/dist"
  "Templum/tmp"
  "phoenix-code-lite/dist"
  "phoenix-code-lite/.phoenix-code-lite"
)

for rel in "${paths[@]}"; do
  target="${repo_root}/${rel}"
  if [ -d "${target}" ] || [ -f "${target}" ]; then
    log "Removing ${rel}"
    rm -rf -- "${target}"
  else
    log "Skipping ${rel} (not present)"
  fi
done

log "Done."
