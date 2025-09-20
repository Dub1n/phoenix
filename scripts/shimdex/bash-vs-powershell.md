# Shell Command Comparison: Bash vs PowerShell (Codex CLI)

## Overview

Task automation in this workspace can run through either `bash -lc` or `powershell.exe -NoProfile`. Both are available, but they integrate differently with the Codex CLI / VS Code extension. Bash commands show up as “Explored files”, “Read …”, or “Edited …” entries, while PowerShell commands are logged generically as “Ran powershell.exe …”. This guide explains how I choose between shells and the trade-offs involved.

## Summary Matrix

| Operation | Default shell | Integration impact | Pros | Cons | When PowerShell wins |
|-----------|---------------|--------------------|------|------|----------------------|
| Directory listing (`ls`) | Bash | Timeline shows “Explored files” | Familiar output, quick | None | Need rich metadata (attributes, providers) |
| Directory listing (`Get-ChildItem`) | PowerShell | Generic log entry | .NET objects, filterable | Verbose | Attribute-heavy queries |
| Text search (`rg`) | Bash | Logged as “Read …” | Fast, glob-friendly | Requires ripgrep | Searching PS providers |
| Text search (`Select-String`) | PowerShell | Generic log entry | Emits objects | Slower on large trees | When piping to other cmdlets |
| Read file (`cat`) | Bash | “Read <file>” entry | Minimal quoting | No structured view | Quick previews |
| Read file (`Get-Content`) | PowerShell | Generic log entry | Encoding control | Verbose text | Structured manipulation |
| Overwrite file (here-doc) | Bash | “Edited …” with diff | Easy full rewrite | Must escape `'EOF'` marker | Multi-step .NET logic |
| Patch via Python (`python - <<'PY'`) | Bash | Diff retained | Precise edits, CRLF safe | Python snippet verbose | Prefer PS if .NET APIs easier |
| Structured data (`jq`, Python) | Bash | Tagged read/edit | Concise transforms | External tools required | |
| Structured data (`ConvertFrom-Json`) | PowerShell | Generic log entry | Native .NET objects | Requires PS pipeline | Complex data pipelines |
| Git/build commands | Bash | Clear “Ran bash …” entry | Standard workflow | None | Rarely needed |

## Choosing a shell

1. **Audit trail** – default to Bash when we want the VS Code timeline to categorise the action.
2. **Windows APIs** – switch to PowerShell for registry/COM/DSC or when we want .NET objects.
3. **Line endings** – strip CRLF or use Python (`encoding='utf-8-sig'`) for `.ps1`; PowerShell `Set-Content -Encoding UTF8` also works.
4. **Tooling** – Bash offers `rg`, `sed`, `jq`; PowerShell offers object pipelines.

## Command-type notes

### Directory listing

- Bash: `ls -al` → logged as “Explored files”.
- PowerShell: `Get-ChildItem` for provider-aware listings.

### Reading files

- Bash `cat file`: quick text dump.
- PowerShell `Get-Content file`: use when you need to manipulate lines or specify encoding.

### Editing files

- Bash here-doc: `cat <<'EOF' > file` for full rewrites.
- Bash + Python: targeted replacements while preserving BOM/CRLF.
- PowerShell: `Set-Content`, `Add-Content`, `.Replace()` when you already need .NET types.

### Searching

- Bash `rg pattern path`: lightning fast.
- PowerShell `Select-String`: returns objects (line, path) for further pipeline work.

### JSON/YAML

- Bash tooling (`jq`, Python): concise one-liners.
- PowerShell `ConvertFrom-Json` / `ConvertTo-Json`: rich object manipulation.

### Builds & tooling

- Either shell works; I stay in Bash to keep logs consistent unless I chain multiple PowerShell cmdlets.

## Pros & cons snapshot

### Bash

- **Pros**: VS Code-friendly audit trail, access to Unix tooling, simpler literal quoting.
- **Cons**: limited Windows API access; must manage CRLF carefully when editing PowerShell scripts.

### PowerShell

- **Pros**: .NET object pipeline, precise encoding control, direct access to Windows subsystems.
- **Cons**: timeline shows generic “Ran powershell.exe …”; quoting can be cumbersome; fewer Unix utilities.

## Best practices

- Default to Bash for navigation, searches, and text editing.
- Use Python-in-Bash for precise replacements while preserving encoding.
- Switch to PowerShell when Windows-native features or .NET objects are required.
- Mention edits in chat even when VS Code already shows the diff.

## Mental model

1. Start in Bash.
2. Swap to PowerShell when `.NET` objects or Windows APIs demand it.
3. Preserve encodings deliberately (Python or `Set-Content -Encoding`).
4. Keep shell usage aligned with the shim’s goal: Bash-first, PowerShell intentionally.
