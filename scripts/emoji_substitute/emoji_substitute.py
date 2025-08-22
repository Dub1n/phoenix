#!/usr/bin/env python3
"""
Emoji to Unicode Character Replacer
Replaces common emojis used in coding with monospace-friendly Unicode characters.
"""

import re
import sys
import os
import argparse
from pathlib import Path

# Emoji to Unicode mapping for coding contexts
EMOJI_REPLACEMENTS = {
    # Success/Check marks
    '✅': '✓',      # Check mark button → Check mark
    '☑️': '✓',      # Check box with check → Check mark
    '✔️': '✓',      # Check mark → Check mark
    
    # Errors/Cross marks
    '❌': '✗',      # Cross mark → Multiplication x
    '❎': '⊞',      # Cross mark button → Box with cross
    '✖️': '✗',      # Heavy multiplication x → Multiplication x
    '🚫': '⊘',      # Prohibited → Circled Division Slash
    
    # Warning/Caution
    '⚠️': '⚠',      # Warning → Warning sign (removes variation selector)
    '🚨': '⚡',      # Police car light → Exclamation mark
    
    # Information/Notes
    'ℹ️': 'i',      # Information → lowercase i
    '💡': '*',      # Light bulb → Asterisk
    '📝': '⋇',      # Memo → Division Times
    '📋': '⋇',      # Clipboard → Division Times
    '📌': '⊙',      # Pushpin → Circled dot
    '📊': '◊',      # Bar chart → White diamond
    
    # Progress/Status
    '🔥': '*',      # Fire → Asterisk
    '⭐': '*',      # Star → Asterisk
    '🌟': '*',      # Glowing star → Asterisk
    '💯': '%',      # Hundred points → Percent
    '🎯': '⊕',      # Direct hit → White circle
    
    # Actions/Tools
    '🔧': '◦',      # Wrench → White bullet
    '⚙️': '⌘',      # Gear → Looped square
    '🛠️': '◦',      # Hammer and wrench → White bullet
    '🔨': '◦',      # Hammer → White bullet
    '🔍': '⌕',      # Magnifying glass → Magnifying glass
    '🔎': '⌕',      # Magnifying glass tilted right → Magnifying glass
    
    # Navigation/Direction
    '➡️': '→',      # Right arrow → Rightwards arrow
    '⬅️': '←',      # Left arrow → Leftwards arrow
    '⬆️': '↑',      # Up arrow → Upwards arrow
    '⬇️': '↓',      # Down arrow → Downwards arrow
    '↗️': '↗',      # Up-right arrow → North east arrow
    '↘️': '↘',      # Down-right arrow → South east arrow
    '↙️': '↙',      # Down-left arrow → South west arrow
    '↖️': '↖',      # Up-left arrow → North west arrow
    '🔄': '⇔',      # Anticlockwise arrows → Left-right arrow
    '🔁': '⇔',      # Clockwise arrows → Left-right arrow
    '🔃': '⇔',      # Clockwise arrows → Left-right arrow
    '⏸️': '‖',      # Pause button → Double vertical line
    '▶️': '▶',      # Play button → Play button
    
    # Files/Code
    '📁': '⚇',      # File folder → White small square
    '📂': '⍥',      # Open file folder → Black small square
    '📄': '□',      # Page facing up → White square
    '📃': '□',      # Page with curl → White square with rounded corners
    '💾': '□',      # Floppy disk → White square
    '💿': '○',      # Optical disk → White circle

    # Time/Schedule
    '⏰': '⋯',      # Alarm clock → Ellipsis
    '⏱️': '⋯',      # Stopwatch → Ellipsis
    '⌚': '⋯',      # Watch → Ellipsis
    '🕐': '⋯',      # One o'clock → Ellipsis
    
    # Communication
    '💬': '"',      # Speech balloon → Quotation mark
    '💭': '`',      # Thought balloon → Grave accent
    '📢': '!',      # Loudspeaker → Exclamation mark
    '📣': '!',      # Megaphone → Exclamation mark
    
    # Misc common in coding contexts
    '🎉': '*',      # Party popper → Asterisk
    '🚀': '^',      # Rocket → Circumflex accent
    '💥': '*',      # Collision → Asterisk
    '🔔': '◊',      # Bell → White diamond
    '🔕': '◊',      # Bell with slash → White diamond
    '👍': '+',      # Thumbs up → Plus
    '👎': '-',      # Thumbs down → Minus
    '🆕': '⊕',      # NEW button → N
    '🆔': 'ID',     # ID button → ID
    '🆗': 'OK',      # OK button → OK
    '🔗': '∞',      # Link → Infinity (represents connection)
    '🛡️': '⊜',      # Shield → Circled equals
    '🔒': '⑄',      # Lock and key → OCR belt buckle
    '🔐': '⑄',      # Lock → OCR belt buckle
    '📦': '⌺',      # Package → APL functional symbol quad diamond
    '🏗️': '⊛',      # Building → APL functional symbol quad diamond

    # Misc in general
    '🏛️': '⌂',      # Palace → White circle with two dots
    '🧪': '⊎',      # Test tube → Right half black circle
    '🧠': '⏼',      # Brain → On/Off switch
    '✨': '⑇',      # Sparkles → OCR amount of check
    '🖥️': '⌨',      # Computer → Keyboard
    '📈': '⋰',      # Upwards trend → Up and right ellipsis
}

# Expand mapping to include common variation selector sequences
VARIATION_SELECTOR_16 = "\uFE0F"
VARIATION_SELECTOR_15 = "\uFE0E"

def _build_expanded_mapping(base_map: dict[str, str]) -> dict[str, str]:
    expanded: dict[str, str] = dict(base_map)
    # Add VS16 variants for keys that don't already include it
    for emoji, replacement in list(base_map.items()):
        if VARIATION_SELECTOR_16 not in emoji:
            expanded[emoji + VARIATION_SELECTOR_16] = replacement
        if VARIATION_SELECTOR_15 not in emoji:
            expanded[emoji + VARIATION_SELECTOR_15] = replacement
    # Also strip stray VS16 if present in text
    expanded[VARIATION_SELECTOR_16] = ""
    expanded[VARIATION_SELECTOR_15] = ""
    return expanded

EMOJI_REPLACEMENTS_EXPANDED = _build_expanded_mapping(EMOJI_REPLACEMENTS)

# other characters for potential future use
# |⍥|⚇|⊍|⋮|⋯|⋱|±|🜏|

def replace_emojis_in_text(text):
    """Replace emojis in text with Unicode equivalents."""
    # Normalize by stripping variation selectors first to maximize matches
    result = text.replace(VARIATION_SELECTOR_16, "").replace(VARIATION_SELECTOR_15, "")
    replacements_made = []
    
    for emoji, replacement in EMOJI_REPLACEMENTS_EXPANDED.items():
        if emoji in result:
            result = result.replace(emoji, replacement)
            replacements_made.append(f"{emoji} → {replacement}")
    
    return result, replacements_made

def process_file(file_path, dry_run=False, verbose=False, quiet=False):
    """Process a single file to replace emojis."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, replacements = replace_emojis_in_text(content)
        
        if replacements:
            if verbose and not quiet:
                print(f"\n⚇ {file_path}:")
                for replacement in replacements:
                    print(f"  {replacement}")
            elif not quiet:
                print(f"✓ {file_path}: {len(replacements)} replacement(s)")
            
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
        elif verbose and not quiet:
            print(f"⌕ {file_path}: No emojis found")
        
        return len(replacements)
        
    except Exception as e:
        if not quiet:
            print(f"✗ Error processing {file_path}: {e}")
        return 0

def get_files_to_process(paths, extensions, files_only=False):
    """Get list of files to process based on paths and extensions.
    If files_only is True, ignore directories entirely.
    """
    files = []
    
    for path_str in paths:
        path = Path(path_str)
        
        if path.is_file():
            files.append(path)
        elif path.is_dir():
            if files_only:
                # Skip directories when files_only is requested
                continue
            for ext in extensions:
                files.extend(path.rglob(f"*.{ext}"))
        else:
            print(f"⚠ Warning: {path} not found")
    
    return sorted(set(files))

def _paths_from_env() -> list[str]:
    """Attempt to infer a single target file from environment variables.
    This enables calling the script with no args when the launcher injects
    the Explorer-selected file into an env var.
    """
    candidate_env_keys = [
        # Recommended custom variable
        "TARGET_FILE",
        # Common variations people might configure
        "SELECTED_FILE",
        "VSCODE_SELECTED_FILE",
        "VSCODE_EXPLORER_SELECTED_FILE",
        "VSCODE_FILE",
        # Generic fallbacks
        "FILE",
    ]
    for key in candidate_env_keys:
        val = os.environ.get(key)
        if val:
            p = Path(val)
            if p.exists() and p.is_file():
                return [str(p)]
    return []

def main():
    parser = argparse.ArgumentParser(
        description="Replace emojis with monospace-friendly Unicode characters in code files"
    )
    parser.add_argument(
        "paths", 
        nargs="*", 
        help="Files or directories to process"
    )
    parser.add_argument(
        "--extensions", 
        "-e",
        nargs="+", 
        default=["py", "js", "ts", "jsx", "tsx", "md", "txt", "json", "yaml", "yml", "toml", "cfg", "ini"],
        help="File extensions to process (default: common code/text files)"
    )
    parser.add_argument(
        "--dry-run", 
        "-n",
        action="store_true", 
        help="Show what would be changed without modifying files"
    )
    parser.add_argument(
        "--verbose", 
        "-v",
        action="store_true", 
        help="Show detailed replacement information"
    )
    parser.add_argument(
        "--list-mappings", 
        "-l",
        action="store_true", 
        help="List all emoji → Unicode mappings and exit"
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Run silently with no console output"
    )
    parser.add_argument(
        "--files-only",
        action="store_true",
        help="Process only explicit file paths; ignore directories"
    )
    
    args = parser.parse_args()

    # If no paths were supplied, try to infer from environment (Explorer selection)
    provided_paths = list(args.paths) if args.paths else []
    if not provided_paths:
        provided_paths = _paths_from_env()
    
    if not provided_paths and not args.list_mappings:
        parser.error(
            "No paths provided and no TARGET_FILE-like environment variable found. "
            "Pass a file path or set TARGET_FILE in the environment."
        )
    
    if args.list_mappings:
        print("Emoji → Unicode Mappings:")
        print("=" * 50)
        for emoji, unicode_char in sorted(EMOJI_REPLACEMENTS.items()):
            print(f"{emoji} → {unicode_char}")
        return
    
    # Safety: if exactly one path and it's a file, force files_only behavior
    files_only = args.files_only or (len(provided_paths) == 1 and Path(provided_paths[0]).is_file())

    files = get_files_to_process(provided_paths, args.extensions, files_only=files_only)
    
    if not files:
        if not args.quiet:
            print("No files found to process")
        return
    
    if not args.quiet:
        print(f"Processing {len(files)} file(s)...")
        if args.dry_run:
            print("⌕ DRY RUN - No files will be modified")
        print()
    
    total_replacements = 0
    for file_path in files:
        total_replacements += process_file(file_path, args.dry_run, args.verbose, args.quiet)
    
    if not args.quiet:
        print(f"\n{'⌕ Would replace' if args.dry_run else '✓ Replaced'} {total_replacements} emoji(s) total")

if __name__ == "__main__":
    main()
