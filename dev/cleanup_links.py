#!/usr/bin/env python3
import re
import sys
from pathlib import Path

TAG_RE = re.compile(r'<[^>]*?\/>\s*')              # remove <.../> and following spaces
PARENS_RE = re.compile(r'\([^()]*\)')              # ( ... ) with no nesting
BRACKETS_RE = re.compile(r'\[([^\[\]]*)\]')        # [ ... ] with no nesting
WS_RE = re.compile(r'[ \t]{2,}')                   # collapse extra spaces

def remove_parens_after_first(s: str) -> str:
    seen = 0
    def repl(m):
        nonlocal seen
        seen += 1
        return m.group(0) if seen == 1 else ''     # keep 1st (...), drop the rest
    return PARENS_RE.sub(repl, s)

def unwrap_brackets_after_first(s: str) -> str:
    seen = 0
    def repl(m):
        nonlocal seen
        seen += 1
        return m.group(0) if seen == 1 else m.group(1)  # keep 1st [..], unwrap the rest
    return BRACKETS_RE.sub(repl, s)

def process_line(line: str) -> str:
    line = TAG_RE.sub('', line)            # 1) drop <.../> and trailing spaces
    line = remove_parens_after_first(line) # 2a) remove (...) after first
    line = unwrap_brackets_after_first(line) # 2b) unwrap [...] after first
    line = WS_RE.sub(' ', line).rstrip()   # tidy spaces; keep leading (for list bullets)
    return line

def main():
    if len(sys.argv) not in (2, 3):
        print("usage: cleanup_links.py INPUT.md [OUTPUT.md]", file=sys.stderr)
        sys.exit(2)

    in_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) == 3 else None

    with in_path.open('r', encoding='utf-8') as f:
        lines = f.readlines()

    out_lines = [process_line(l) for l in lines]

    if out_path:
        out_path.write_text('\n'.join(out_lines) + ('\n' if lines and lines[-1].endswith('\n') else ''), encoding='utf-8')
    else:
        sys.stdout.write('\n'.join(out_lines))

if __name__ == "__main__":
    main()
