#!/usr/bin/env python3
"""Validate documentation metadata and H1 structure.

Usage:
    meta/scripts/validate_frontmatter.py path/to/doc.md [more docs]

The script extracts the first YAML frontmatter block (between leading '---' markers),
normalises date/datetime types emitted by PyYAML, validates the result against
`meta/templates/schema/frontmatter.json`, and requires exactly one Markdown H1
outside fenced code blocks. Use `--schema` to point at a project-specific override.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict

import yaml
from jsonschema import Draft7Validator

DEFAULT_SCHEMA = Path(__file__).resolve().parents[1] / "templates" / "schema" / "frontmatter.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate YAML frontmatter blocks")
    parser.add_argument(
        "paths",
        nargs="+",
        help="Documentation files (Markdown) containing YAML frontmatter to validate",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help="Path to JSON schema (defaults to shared frontmatter schema)",
    )
    return parser.parse_args()


def extract_document(path: Path) -> tuple[Dict[str, Any], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: missing leading YAML frontmatter block")

    # Split on first two '---' occurrences to avoid consuming body content containing '---'.
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        raise ValueError(f"{path}: malformed frontmatter block")

    frontmatter_raw = parts[1]
    loaded = yaml.safe_load(frontmatter_raw) or {}
    if not isinstance(loaded, dict):
        raise ValueError(f"{path}: frontmatter must deserialize to a mapping")
    return loaded, parts[2]


def extract_h1s(markdown: str) -> list[str]:
    headings: list[str] = []
    fence: str | None = None

    for line in markdown.splitlines():
        stripped = line.lstrip()
        fence_match = re.match(r"^(```+|~~~+)", stripped)
        if fence_match:
            marker = fence_match.group(1)
            marker_kind = marker[0]
            if fence is None:
                fence = marker_kind
            elif fence == marker_kind:
                fence = None
            continue

        if fence is not None:
            continue

        heading_match = re.match(r"^#\s+(.+?)\s*$", line)
        if heading_match:
            headings.append(heading_match.group(1))

    return headings


def validate_heading(markdown: str, path: Path) -> None:
    headings = extract_h1s(markdown)
    if len(headings) != 1:
        raise ValueError(
            f"{path}: expected exactly one Markdown H1 outside fenced code blocks; found {len(headings)}"
        )


def warn_deprecated_fields(data: Dict[str, Any], path: Path) -> None:
    replacements = {
        "title": "the document H1",
        "name": "id",
    }
    for field, replacement in replacements.items():
        if field in data:
            print(f"! {path}: deprecated frontmatter field '{field}'; use {replacement}")


def normalise_types(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: normalise_types(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalise_types(v) for v in value]
    if isinstance(value, datetime):
        iso = value.isoformat()
        if iso.endswith("+00:00"):
            iso = iso[:-6] + "Z"
        return iso
    if isinstance(value, date):
        return value.isoformat()
    return value


def validate_frontmatter(data: Dict[str, Any], schema: Dict[str, Any], path: Path) -> None:
    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: e.path)
    if errors:
        formatted = "\n".join(
            f"  - {'/'.join(str(p) for p in error.path) or '<root>'}: {error.message}" for error in errors
        )
        raise ValueError(f"{path}: frontmatter validation failed\n{formatted}")


def main() -> None:
    args = parse_args()
    schema_path = args.schema.resolve()
    schema_data = json.loads(schema_path.read_text(encoding="utf-8"))

    failures = []
    for raw_path in args.paths:
        path = Path(raw_path)
        try:
            frontmatter, markdown = extract_document(path)
            normalised = normalise_types(frontmatter)
            warn_deprecated_fields(normalised, path)
            validate_frontmatter(normalised, schema_data, path)
            validate_heading(markdown, path)
            print(f"✓ {path}")
        except Exception as exc:  # noqa: BLE001 - surface full failure context
            failures.append((path, exc))
            print(f"✗ {path}: {exc}")

    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
