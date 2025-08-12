#!/usr/bin/env python3
"""
Emoji to Unicode Character Replacer
Replaces common emojis used in coding with monospace-friendly Unicode characters.
"""

import re
import sys
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
    '📁': '▫',      # File folder → White small square
    '📂': '▪',      # Open file folder → Black small square
    '📄': '□',      # Page facing up → White square
    '📃': '□',      # Page with curl → White square with rounded corners
    '💾': '□',      # Floppy disk → White square
    '💿': '○',      # Optical disk → White circle

    # Time/Schedule
    '⏰': '◷',      # Alarm clock → White circle with two dots
    '⏱️': '◷',      # Stopwatch → White circle with two dots
    '⌚': '◷',      # Watch → White circle with two dots
    '🕐': '◷',      # One o'clock → White circle with two dots
    
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
    '🆕': 'N',      # NEW button → N
    '🆔': 'ID',     # ID button → ID
    '🆗': 'OK',     # OK button → OK
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

# other characters for potential future use
# |⍥|⚇|⊍|⋮|⋯|⋱|±|🜏|

def replace_emojis_in_text(text):
    """Replace emojis in text with Unicode equivalents."""
    result = text
    replacements_made = []
    
    for emoji, replacement in EMOJI_REPLACEMENTS.items():
        if emoji in result:
            result = result.replace(emoji, replacement)
            replacements_made.append(f"{emoji} → {replacement}")
    
    return result, replacements_made

def process_file(file_path, dry_run=False, verbose=False):
    """Process a single file to replace emojis."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, replacements = replace_emojis_in_text(content)
        
        if replacements:
            if verbose:
                print(f"\n📁 {file_path}:")
                for replacement in replacements:
                    print(f"  {replacement}")
            else:
                print(f"✓ {file_path}: {len(replacements)} replacement(s)")
            
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
        elif verbose:
            print(f"○ {file_path}: No emojis found")
            
        return len(replacements)
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return 0

def get_files_to_process(paths, extensions):
    """Get list of files to process based on paths and extensions."""
    files = []
    
    for path_str in paths:
        path = Path(path_str)
        
        if path.is_file():
            files.append(path)
        elif path.is_dir():
            for ext in extensions:
                files.extend(path.rglob(f"*.{ext}"))
        else:
            print(f"⚠ Warning: {path} not found")
    
    return sorted(set(files))

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
    
    args = parser.parse_args()
    
    if args.list_mappings:
        print("Emoji → Unicode Mappings:")
        print("=" * 50)
        for emoji, unicode_char in sorted(EMOJI_REPLACEMENTS.items()):
            print(f"{emoji} → {unicode_char}")
        return
    
    if not args.paths:
        parser.error("paths argument is required when not using --list-mappings")
    
    files = get_files_to_process(args.paths, args.extensions)
    
    if not files:
        print("No files found to process")
        return
    
    print(f"Processing {len(files)} file(s)...")
    if args.dry_run:
        print("🔍 DRY RUN - No files will be modified")
    print()
    
    total_replacements = 0
    for file_path in files:
        total_replacements += process_file(file_path, args.dry_run, args.verbose)
    
    print(f"\n{'🔍 Would replace' if args.dry_run else '✓ Replaced'} {total_replacements} emoji(s) total")

if __name__ == "__main__":
    main()
