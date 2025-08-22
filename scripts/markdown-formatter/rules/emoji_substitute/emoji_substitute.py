#!/usr/bin/env python3
"""
Emoji Substitution Formatting Rule

This rule replaces common emojis used in coding with monospace-friendly Unicode characters.
It's designed to improve readability in markdown files by converting emojis to characters
that work better in monospace fonts and code contexts.
"""

import re
import sys
from pathlib import Path

# Add the rules directory to Python path for imports
# This allows rules in subfolders to import base_rule.py from the parent rules/ directory
rules_dir = Path(__file__).parent.parent
sys.path.insert(0, str(rules_dir))

from base_rule import BaseFormattingRule


class FormattingRule(BaseFormattingRule):
    """
    Emoji substitution formatting rule.
    
    This rule replaces emojis with monospace-friendly Unicode characters to improve
    readability in markdown files, especially when viewed in code editors or terminals.
    """
    
    def __init__(self):
        """Initialize the emoji substitution formatting rule."""
        super().__init__()
        self.description = "Replace emojis with monospace-friendly Unicode characters"
        self.name = "emoji_substitute"
        
        # Emoji to Unicode mapping for coding contexts
        self.emoji_replacements = {
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
        
        # Set default configuration (can be overridden by external config)
        self._set_default_config()
        
        # Build expanded mapping with variation selectors
        self._build_expanded_mapping()
    
    def _set_default_config(self):
        """Set default configuration values."""
        self.config = {
            'enabled': True,
            'enable_success_marks': True,      # Check marks, etc.
            'enable_error_marks': True,        # Cross marks, etc.
            'enable_warnings': True,           # Warning symbols
            'enable_information': True,        # Info, notes, etc.
            'enable_progress': True,           # Progress indicators
            'enable_actions': True,            # Tools, actions
            'enable_navigation': True,         # Arrows, directions
            'enable_files': True,              # File-related symbols
            'enable_time': True,               # Time-related symbols
            'enable_communication': True,      # Speech, thought balloons
            'enable_misc': True,               # Other symbols
            'preserve_variation_selectors': False,  # Whether to keep VS16/VS15
        }
    
    def update_config(self, external_config: dict):
        """
        Update rule configuration from external source (e.g., config.yml).
        
        Args:
            external_config: Dictionary containing configuration overrides
        """
        if external_config:
            # Update only the keys that exist in external config
            for key, value in external_config.items():
                if key in self.config:
                    self.config[key] = value
                    self.logger.debug(f"Updated config '{key}': {value}")
            
            # Rebuild expanded mapping if variation selector config changed
            if 'preserve_variation_selectors' in external_config:
                self._build_expanded_mapping()
    
    def _build_expanded_mapping(self):
        """Build expanded mapping including variation selector variants."""
        VARIATION_SELECTOR_16 = "\uFE0F"
        VARIATION_SELECTOR_15 = "\uFE0E"
        
        expanded = dict(self.emoji_replacements)
        
        # Add VS16 variants for keys that don't already include it
        for emoji, replacement in list(self.emoji_replacements.items()):
            if VARIATION_SELECTOR_16 not in emoji:
                expanded[emoji + VARIATION_SELECTOR_16] = replacement
            if VARIATION_SELECTOR_15 not in emoji:
                expanded[emoji + VARIATION_SELECTOR_15] = replacement
        
        # Handle variation selectors based on config
        if not self.config['preserve_variation_selectors']:
            expanded[VARIATION_SELECTOR_16] = ""
            expanded[VARIATION_SELECTOR_15] = ""
        
        self.emoji_replacements_expanded = expanded
    
    def apply(self, content: str, file_path: str) -> str:
        """
        Apply emoji substitution to the markdown content.
        
        Args:
            content: The original markdown content
            file_path: Path to the file being formatted (for context)
            
        Returns:
            The formatted markdown content with emojis replaced
            
        Raises:
            FormattingError: If formatting fails
        """
        try:
            if not self.config['enabled']:
                return content
            
            # Start with original content
            formatted_content = content
            replacements_made = []
            
            # Apply emoji replacements based on configuration
            for emoji, replacement in self.emoji_replacements_expanded.items():
                if emoji in formatted_content:
                    # Check if this emoji type is enabled
                    if self._is_emoji_enabled(emoji):
                        formatted_content = formatted_content.replace(emoji, replacement)
                        replacements_made.append(f"{emoji} → {replacement}")
            
            # Log replacements if any were made
            if replacements_made:
                self.logger.info(f"Emoji substitution: {len(replacements_made)} replacements made")
                for replacement in replacements_made:
                    self.logger.debug(f"  {replacement}")
            
            return formatted_content
            
        except Exception as e:
            # Log the error and return original content
            self.logger.error(f"Emoji substitution rule failed: {e}")
            return content
    
    def _is_emoji_enabled(self, emoji: str) -> bool:
        """Check if a specific emoji type is enabled based on configuration."""
        # Map emoji to category for configuration checking
        if emoji in ['✅', '☑️', '✔️']:
            return self.config['enable_success_marks']
        elif emoji in ['❌', '❎', '✖️', '🚫']:
            return self.config['enable_error_marks']
        elif emoji in ['⚠️', '🚨']:
            return self.config['enable_warnings']
        elif emoji in ['ℹ️', '💡', '📝', '📋', '📌', '📊']:
            return self.config['enable_information']
        elif emoji in ['🔥', '⭐', '🌟', '💯', '🎯']:
            return self.config['enable_progress']
        elif emoji in ['🔧', '⚙️', '🛠️', '🔨', '🔍', '🔎']:
            return self.config['enable_actions']
        elif emoji in ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '🔄', '🔁', '🔃', '⏸️', '▶️']:
            return self.config['enable_navigation']
        elif emoji in ['📁', '📂', '📄', '📃', '💾', '💿']:
            return self.config['enable_files']
        elif emoji in ['⏰', '⏱️', '⌚', '🕐']:
            return self.config['enable_time']
        elif emoji in ['💬', '💭', '📢', '📣']:
            return self.config['enable_communication']
        else:
            # Default to misc category
            return self.config['enable_misc']
    
    def validate_config(self) -> bool:
        """
        Validate the rule's configuration.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        try:
            # Check that all required config keys exist
            required_keys = [
                'enabled', 'enable_success_marks', 'enable_error_marks',
                'enable_warnings', 'enable_information', 'enable_progress',
                'enable_actions', 'enable_navigation', 'enable_files',
                'enable_time', 'enable_communication', 'enable_misc',
                'preserve_variation_selectors'
            ]
            
            for key in required_keys:
                if key not in self.config:
                    self.logger.error(f"Missing required config key: {key}")
                    return False
                
                if not isinstance(self.config[key], bool):
                    self.logger.error(f"Config key {key} must be boolean")
                    return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Configuration validation failed: {e}")
            return False
    
    def get_stats(self) -> dict:
        """
        Get statistics about what this rule has processed.
        
        Returns:
            Dictionary containing rule statistics
        """
        return {
            'rule_name': self.name,
            'description': self.description,
            'enabled': self.config['enabled'],
            'emoji_categories': {
                'success_marks': self.config['enable_success_marks'],
                'error_marks': self.config['enable_error_marks'],
                'warnings': self.config['enable_warnings'],
                'information': self.config['enable_information'],
                'progress': self.config['enable_progress'],
                'actions': self.config['enable_actions'],
                'navigation': self.config['enable_navigation'],
                'files': self.config['enable_files'],
                'time': self.config['enable_time'],
                'communication': self.config['enable_communication'],
                'misc': self.config['enable_misc']
            },
            'total_emoji_mappings': len(self.emoji_replacements),
            'preserve_variation_selectors': self.config['preserve_variation_selectors']
        }


# Example usage and testing
if __name__ == '__main__':
    # Test the rule
    rule = FormattingRule()
    test_content = "This is a test ✅ with emojis ❌ and ⚠️ symbols."
    
    print(f"Original: '{test_content}'")
    formatted = rule.apply(test_content, "test.md")
    print(f"Formatted: '{formatted}'")
    
    print(f"Rule description: {rule.description}")
    print(f"Configuration: {rule.config}")
    print(f"Stats: {rule.get_stats()}")
