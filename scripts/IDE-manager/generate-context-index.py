#!/usr/bin/env python3
# v5: also emit a markdown file with raw.githubusercontent URLs
# - keeps fast path hash skip, but only skips if BOTH md files already match
# - auto-detects owner/repo/branch from git; override with --raw-base/--raw-branch
# - zero deps; Python 3.8+

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
from typing import Iterable, List, Dict, Any, Optional, Tuple

DEFAULT_PATTERNS: List[str] = [
    "README.md","README*.md","*readme*.md",
    "architecture.md","architecture*.md","*architecture*.md",
    "dev.md","dev*.md","*dev*.md",
    "index.md","INDEX.md","*index*.md",
]
DEFAULT_EXCLUDE_DIRS: List[str] = []
DEFAULT_EXCLUDE_GLOBS: List[str] = [
    ".git/*",".venv/*",".idea/*",".vscode/*",".claude/*",".continue/*",".cursor/*",
    "build/*","DSS/*","docs/*","prompts/*",
    "**/node_modules/*","**/target/*","**/dist/*",
    "**/validation-results/**","**/fixes/**",
    "**/terminal-completer/*","**/markdown-formatter/*","**/refactor_protocol/*",
    "**/01-roadmap/*","**/Claude-Code/*","**/architecture-specialist.md",
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

def writeln(f, s: str = "") -> None:
    """Write a line ensuring a single trailing newline."""
    # Avoid double newlines if caller already included \n
    if s.endswith("\n"):
        f.write(s)
    else:
        f.write(s + "\n")

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

# ===== fast path hashing =====
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

# ===== git origin parsing for raw base =====
def git_current_branch(root: Path) -> Optional[str]:
    try:
        out = subprocess.check_output(["git", "-C", str(root), "rev-parse", "--abbrev-ref", "HEAD"], text=True).strip()
        return out if out else None
    except Exception:
        return None

def git_origin_url(root: Path) -> Optional[str]:
    for remote in ("origin",):
        try:
            out = subprocess.check_output(["git", "-C", str(root), "remote", "get-url", remote], text=True).strip()
            if out:
                return out
        except Exception:
            pass
    return None

def parse_github_owner_repo(remote_url: str) -> Optional[Tuple[str, str]]:
    # handles:
    # - https://github.com/Owner/Repo.git
    # - https://github.com/Owner/Repo
    # - git@github.com:Owner/Repo.git
    m = re.search(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^/.]+)", remote_url)
    if m:
        return m.group("owner"), m.group("repo")
    return None

def build_raw_base(root: Path, override_base: Optional[str], override_branch: Optional[str]) -> Optional[str]:
    if override_base:
        return override_base.rstrip("/")
    origin = git_origin_url(root)
    if not origin:
        return None
    parsed = parse_github_owner_repo(origin)
    if not parsed:
        return None
    owner, repo = parsed
    branch = override_branch or git_current_branch(root) or "main"
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}".rstrip("/")

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
    # new: raw link output controls
    ap.add_argument("--raw-md-name", default="context_index_raw.md", help="Filename for raw-links markdown (default: context_index_raw.md)")
    ap.add_argument("--raw-base", default=None, help="Override raw base URL, e.g. https://raw.githubusercontent.com/Owner/Repo/branch")
    ap.add_argument("--raw-branch", default=None, help="Override branch for raw base if auto-detected")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    outdir = root / args.outdir
    outdir.mkdir(parents=True, exist_ok=True)

    md_path = outdir / "context_index.md"
    json_path = outdir / "context_index.json"
    raw_md_path = outdir / args.raw_md_name

    # fast-hash skip: only skip if both md files already match this hash
    p_hash = paths_hash(root, args.patterns, args.exclude_globs, args.name_only, args.case_sensitive)
    def header_hash(path: Path) -> Optional[str]:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                header = "".join([f.readline() for _ in range(32)])
            m = re.search(r"paths-hash:\s*`?([0-9a-fA-F]{40})`?", header)
            return m.group(1).lower() if m else None
        except Exception:
            return None

    if md_path.exists() and raw_md_path.exists():
        h1, h2 = header_hash(md_path), header_hash(raw_md_path)
        if h1 == p_hash and h2 == p_hash:
            print("[skip] context_index outputs are up to date (paths-hash matches)")
            return

    # collect entries
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

    # write JSON + standard MD
    with open(json_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, indent=2)

    with open(md_path, "w", encoding="utf-8", newline="\n") as f:
        writeln(f, "# context index")
        writeln(f)  # blank line after H1
        writeln(f, f"- generated: `{meta['generated_at']}`")
        writeln(f, f"- root: `{root.name}`")
        writeln(f, f"- match: `{'name-only' if args.name_only else 'path-match'}`")
        writeln(f, f"- case-sensitive: `{args.case_sensitive}`")
        writeln(f, f"- patterns: `{', '.join(args.patterns)}`")
        writeln(f, f"- exclude-dirs: `{', '.join(args.exclude_dirs)}`")
        writeln(f, f"- exclude-globs: `{', '.join(args.exclude_globs)}`")
        writeln(f, f"- paths-hash: `{p_hash}`")
        writeln(f, "- totals: " + ", ".join(f"{k}={len(v)}" for k, v in sorted(by_folder.items())))
        writeln(f)  # blank line after header block
        for folder in sorted(by_folder.keys(), key=lambda s: s.lower()):
            header = folder if folder != "." else "(root)"
            writeln(f, f"## {header}")
            writeln(f)  # blank line after section header
            for e in by_folder[folder]:
                writeln(f, f"- `{e['path']}` (lines: {e['lines']}, sha1: {e['sha1'][:10]})")
            writeln(f)  # blank line between sections

    # write RAW-URL markdown
    raw_base = build_raw_base(root, args.raw_base, args.raw_branch)
    with open(raw_md_path, "w", encoding="utf-8", newline="\n") as f:
        writeln(f, "# context index (raw links)")
        writeln(f)  # blank line after H1
        writeln(f, f"- generated: `{meta['generated_at']}`")
        writeln(f, f"- root: `{root.name}`")
        writeln(f, f"- paths-hash: `{p_hash}`")
        if raw_base:
            writeln(f, f"- raw-base: `{raw_base}`")
        else:
            writeln(f, "> NOTE: Could not auto-detect GitHub raw base. Provide `--raw-base https://raw.githubusercontent.com/<owner>/<repo>/<branch>`")
        writeln(f)  # blank line after header block
        for folder in sorted(by_folder.keys(), key=lambda s: s.lower()):
            header = folder if folder != "." else "(root)"
            writeln(f, f"## {header}")
            writeln(f)  # blank line before the list
            for e in by_folder[folder]:
                if raw_base:
                    url = f"{raw_base}/{e['path']}"
                    writeln(f, url)              # bare URL, one per line
                else:
                    writeln(f, e['path'])        # bare relative path
            writeln(f)  # blank line between sections


    print(f"[ok] wrote {json_path}, {md_path}, and {raw_md_path}")

if __name__ == "__main__":
    main()
