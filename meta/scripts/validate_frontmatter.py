#!/usr/bin/env python3
"""Validate documentation frontmatter against the shared schema.

Usage:
    meta/scripts/validate_frontmatter.py path/to/doc.md [more docs]

The script extracts the first YAML frontmatter block (between leading '---' markers),
normalises date/datetime types emitted by PyYAML, and validates the result against
`meta/templates/schema/frontmatter.json` by default. Use `--schema` to point at a
project-specific override.
"""

from __future__ import annotations

import argparse
import json
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


def extract_frontmatter(path: Path) -> Dict[str, Any]:
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
    return loaded


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
            frontmatter = extract_frontmatter(path)
            normalised = normalise_types(frontmatter)
            validate_frontmatter(normalised, schema_data, path)
            print(f"✓ {path}")
        except Exception as exc:  # noqa: BLE001 - surface full failure context
            failures.append((path, exc))
            print(f"✗ {path}: {exc}")

    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
