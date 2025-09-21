#!/usr/bin/env python3
# v4 minimal: self-skipping generator
# - computes fast paths-hash from working tree
# - if meta/context_index.md already has same hash, exits
# - otherwise writes JSON + MD (folder-grouped, filesystem order)
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
from fnmatch import fnmatch
import fnmatch as _fn
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

DEFAULT_EXCLUDE_DIRS: List[str] = []

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


def git_ls_files(root: Path, raw: bool = False):
    try:
        out = subprocess.check_output(["git", "-C", str(root), "ls-files"], text=True)
        if raw:
            return [p for p in (ln.strip() for ln in out.splitlines()) if p]
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
    rp_rel = str(p.relative_to(root)).replace("\\", "/")
    return rp_rel.split("/", 1)[0] if "/" in rp_rel else "."


# ===== fast path set hashing (no file I/O) =====

def compile_globs(patterns: Iterable[str], case_sensitive: bool) -> List[re.Pattern]:
    flags = 0 if case_sensitive else re.IGNORECASE
    def to_regex(pat: str) -> re.Pattern:
        return re.compile(_fn.translate(pat), flags)
    return [to_regex(p) for p in patterns]


def iter_matching_paths_fast(root: Path, patterns: Iterable[str], exclude_globs: Iterable[str], name_only: bool, case_sensitive: bool) -> Iterable[str]:
    rels = git_ls_files(root, raw=True)
    if rels is None:
        rels = []
        for dirpath, _, filenames in os.walk(root):
            rel_base = os.path.relpath(dirpath, root).replace("\\", "/")
            for fn in filenames:
                rels.append((rel_base + "/" + fn) if rel_base != "." else fn)

    inc_res = compile_globs(patterns, case_sensitive)
    exc_res = compile_globs(exclude_globs, case_sensitive)

    for rp in rels:
        if exc_res and any(rx.fullmatch(rp) for rx in exc_res):
            continue
        base = rp.rsplit("/", 1)[-1]
        subject = base if name_only else rp
        if any(rx.fullmatch(subject) for rx in inc_res):
            yield rp


def paths_hash(root: Path, patterns: Iterable[str], exclude_globs: Iterable[str], name_only: bool, case_sensitive: bool) -> str:
    items = sorted(iter_matching_paths_fast(root, patterns, exclude_globs, name_only, case_sensitive))
    h = hashlib.sha1()
    for rp in items:
        h.update(rp.encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate context index for LLMs.")
    ap.add_argument("--root", default=".", help="Repo root (default: .)")
    ap.add_argument("--outdir", default="meta", help="Output directory (default: meta)")
    ap.add_argument("--patterns", nargs="*", default=DEFAULT_PATTERNS)

    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--name-only", dest="name_only", action="store_true")
    mode.add_argument("--path-match", dest="name_only", action="store_false")
    ap.set_defaults(name_only=True)

    ap.add_argument("--absolute", action="store_true")
    ap.add_argument("--exclude-dirs", nargs="*", default=DEFAULT_EXCLUDE_DIRS)
    ap.add_argument("--exclude-globs", nargs="*", default=DEFAULT_EXCLUDE_GLOBS)
    ap.add_argument("--case-sensitive", action="store_true")

    args = ap.parse_args()

    root = Path(args.root).resolve()
    outdir = root / args.outdir
    outdir.mkdir(parents=True, exist_ok=True)

    # compute fast path hash; if md exists and matches, skip work
    md_path = outdir / "context_index.md"
    json_path = outdir / "context_index.json"
    p_hash = paths_hash(root, args.patterns, args.exclude_globs, args.name_only, args.case_sensitive)

    if md_path.exists():
        try:
            with open(md_path, "r", encoding="utf-8", errors="ignore") as f:
                header = "".join([f.readline() for _ in range(24)])
            m = re.search(r"paths-hash:\s*`?([0-9a-fA-F]{40})`?", header)
            if m and m.group(1).lower() == p_hash:
                print("[skip] context_index is up to date (paths-hash matches)")
                return
        except Exception:
            pass

    # build entries (heavier path)
    entries: List[Dict[str, Any]] = []
    files = git_ls_files(root) or walk_filesystem(root, args.exclude_dirs)
    for p in files:
        if not p.is_file():
            continue
        rp = relpath_for(p, root, args.absolute)
        if args.exclude_globs and any(match_any_pattern(rp, [g], args.case_sensitive) for g in args.exclude_globs):
            continue
        subject = p.name if args.name_only else rp
        if match_any_pattern(subject, args.patterns, args.case_sensitive):
            try:
                size = p.stat().st_size
            except Exception:
                size = -1
            entries.append({
                "path": rp,
                "filename": p.name,
                "folder": first_folder_for(p, root),
                "kind": infer_kind(p.name),
                "lines": line_count(p),
                "bytes": size,
                "sha1": sha1_of_file(p),
            })

    entries.sort(key=lambda e: e["path"].lower())

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
        "paths_hash": p_hash,
        "counts": {k: len(v) for k, v in by_folder.items()},
        "files": entries,
        "by_folder": by_folder,
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# context index\n\n")
        gen = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        f.write(f"- generated: `{gen}`\n")
        f.write(f"- root: `{root.name}`\n")
        f.write(f"- match: `{'name-only' if args.name_only else 'path-match'}`\n")
        f.write(f"- case-sensitive: `{args.case_sensitive}`\n")
        f.write(f"- patterns: `{', '.join(args.patterns)}`\n")
        f.write(f"- exclude-dirs: `{', '.join(args.exclude_dirs)}`\n")
        f.write(f"- exclude-globs: `{', '.join(args.exclude_globs)}`\n")
        f.write(f"- paths-hash: `{p_hash}`\n")
        f.write("- totals: " + ", ".join(f"{k}={len(v)}" for k, v in sorted(by_folder.items())) + "\n\n")

        for folder in sorted(by_folder.keys(), key=lambda s: s.lower()):
            header = folder if folder != "." else "(root)"
            f.write(f"## {header}\n\n")
            for e in by_folder[folder]:
                f.write(f"- `{e['path']}`  (lines: {e['lines']}, sha1: {e['sha1'][:10]})\n")
            f.write("\n")

    print(f"[ok] wrote {json_path} and {md_path}")


if __name__ == "__main__":
    main()
