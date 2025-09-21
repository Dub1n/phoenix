#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
from fnmatch import fnmatch
from pathlib import Path
from typing import Iterable, List, Dict, Any

DEFAULT_PATTERNS: List[str] = [
    "README.md",
    "README*.md",
    "*readme*.md",
    "architecture.md",
    "architecture*.md",
    "*architecture*.md",
    "dev.md",
    "dev*.md",
    "*dev*.md",
    "index.md",
    "INDEX.md",
    "*index*.md",
]

DEFAULT_EXCLUDE_DIRS: List[str] = [
]

DEFAULT_EXCLUDE_GLOBS: List[str] = [
    ".git/*",
    ".venv/*",
    ".idea/*",
    ".vscode/*",
    ".claude/*",
    ".continue/*",
    ".cursor/*",
    "build/*",
    "DSS/*",
    "docs/*",
    "prompts/*",
    "**/node_modules/*",
    "**/target/*",
    "**/dist/*",
    "**/validation-results/**",
    "**/fixes/**",
    "**/terminal-completer/*",
    "**/markdown-formatter/*",
    "**/refactor_protocol/*",
    "**/01-roadmap/*",
    "**/Claude-Code/*",
    "**/architecture-specialist.md",
]

KIND_RULES = [
    (r"(?i)\breadme\b", "readme"),
    (r"(?i)\barchitecture\b", "architecture"),
    (r"(?i)\bdev(|elop.*)\b", "dev"),
    (r"(?i)\bindex\b", "index"),
]

def infer_kind(name: str) -> str:
    for pat, kind in KIND_RULES:
        if re.search(pat, name):
            return kind
    return "other"


def sha1_of_file(p: Path) -> str:
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def line_count(p: Path) -> int:
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return -1


def git_ls_files(root: Path) -> List[Path] | None:
    try:
        out = subprocess.check_output(["git", "-C", str(root), "ls-files"], text=True)
        return [root / p.strip() for p in out.splitlines() if p.strip()]
    except Exception:
        return None


def walk_filesystem(root: Path, exclude_dir_globs: Iterable[str]) -> List[Path]:
    files: List[Path] = []
    exclude_dir_globs = list(exclude_dir_globs)
    for dirpath, dirnames, filenames in os.walk(root):
        rel_dirpath = os.path.relpath(dirpath, root).replace("\\", "/")
        pruned = []
        for d in list(dirnames):
            full_rel = os.path.join(rel_dirpath, d).replace("\\", "/")
            if any(fnmatch(full_rel.lower(), pat.lower()) for pat in exclude_dir_globs):
                continue
            pruned.append(d)
        dirnames[:] = pruned
        for fn in filenames:
            files.append(Path(dirpath) / fn)
    return files


def match_any_pattern(subject: str, patterns: Iterable[str], case_sensitive: bool = False) -> bool:
    subj = subject.replace("\\", "/")
    if not case_sensitive:
        subj = subj.lower()
    for pat in patterns:
        pat_cmp = pat if case_sensitive else pat.lower()
        if fnmatch(subj, pat_cmp):
            return True
    return False


def relpath_for(p: Path, root: Path, absolute: bool) -> str:
    return str(p.resolve()) if absolute else str(p.relative_to(root)).replace("\\", "/")


def first_folder_for(p: Path, root: Path) -> str:
    """Return the first path segment relative to root, or "." if at repo root."""
    rp_rel = str(p.relative_to(root)).replace("\\", "/")
    return rp_rel.split("/", 1)[0] if "/" in rp_rel else "."


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate context index for LLMs.")
    ap.add_argument("--root", default=".", help="Repo root (default: .)")
    ap.add_argument("--outdir", default="meta", help="Output directory (default: meta)")
    ap.add_argument("--patterns", nargs="*", default=DEFAULT_PATTERNS)

    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--name-only", dest="name_only", action="store_true")
    mode.add_argument("--path-match", dest="name_only", action="store_false")
    ap.set_defaults(name_only=True)

    ap.add_argument("--json-only", action="store_true")
    ap.add_argument("--md-only", action="store_true")
    ap.add_argument("--absolute", action="store_true")
    ap.add_argument("--exclude-dirs", nargs="*", default=DEFAULT_EXCLUDE_DIRS)
    ap.add_argument("--exclude-globs", nargs="*", default=DEFAULT_EXCLUDE_GLOBS)
    ap.add_argument("--case-sensitive", action="store_true")

    args = ap.parse_args()

    root = Path(args.root).resolve()
    outdir = root / args.outdir
    outdir.mkdir(parents=True, exist_ok=True)

    files = git_ls_files(root) or walk_filesystem(root, args.exclude_dirs)

    entries: List[Dict[str, Any]] = []
    for p in files:
        if not p.is_file():
            continue
        rp = relpath_for(p, root, args.absolute)
        # exclude by glob against the (possibly absolute) rp string
        if args.exclude_globs and any(match_any_pattern(rp, [g], args.case_sensitive) for g in args.exclude_globs):
            continue
        subject = p.name if args.name_only else rp
        if match_any_pattern(subject, args.patterns, args.case_sensitive):
            try:
                size = p.stat().st_size
            except Exception:
                size = -1
            entry = {
                "path": rp,
                "filename": p.name,
                "folder": first_folder_for(p, root),
                "kind": infer_kind(p.name),  # kept for metadata, not used as the primary grouping
                "lines": line_count(p),
                "bytes": size,
                "sha1": sha1_of_file(p),
            }
            entries.append(entry)

    # sort in standard filesystem order (lexicographic by relative path)
    entries.sort(key=lambda e: e["path"].lower())

    # group by first folder component
    by_folder: Dict[str, List[Dict[str, Any]]] = {}
    for e in entries:
        by_folder.setdefault(e["folder"], []).append(e)

    meta = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "root": root.name,
        "patterns": args.patterns,
        "match_mode": "name-only" if args.name_only else "path-match",
        "exclude_dirs": args.exclude_dirs,
        "exclude_globs": args.exclude_globs,
        "case_sensitive": args.case_sensitive,
        "counts": {k: len(v) for k, v in by_folder.items()},
        "files": entries,
        "by_folder": by_folder,
    }

    json_path = outdir / "context_index.json"
    md_path = outdir / "context_index.md"

    if not args.md_only:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
    if not args.json_only:
        with open(md_path, "w", encoding="utf-8") as f:
            f.write("# context index\n\n")
            f.write(f"- generated: `{meta['generated_at']}`\n")
            f.write(f"- root: `{meta['root']}`\n")
            f.write(f"- match: `{meta['match_mode']}`\n")
            f.write(f"- case-sensitive: `{meta['case_sensitive']}`\n")
            f.write(f"- patterns: `{', '.join(args.patterns)}`\n")
            f.write(f"- exclude-dirs: `{', '.join(args.exclude_dirs)}`\n")
            f.write(f"- exclude-globs: `{', '.join(args.exclude_globs)}`\n")
            f.write("- totals: " + ", ".join(f"{k}={len(v)}" for k, v in sorted(by_folder.items())) + "\n\n")

            for folder in sorted(by_folder.keys(), key=lambda s: s.lower()):
                header = folder if folder != "." else "(root)"
                f.write(f"## {header}\n\n")
                for e in by_folder[folder]:
                    f.write(f"- `{e['path']}`  (lines: {e['lines']}, sha1: {e['sha1'][:10]})\n")
                f.write("\n")

    print(
        f"[ok] wrote {json_path if not args.md_only else '(json skipped)'} and {md_path if not args.json_only else '(md skipped)'}"
    )


if __name__ == "__main__":
    main()
