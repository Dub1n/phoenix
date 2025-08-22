#!/usr/bin/env python3
"""
Unbold Headers Formatting Rule

Removes asterisks (* and **) from markdown headers to clean up emphasis formatting.
Headers with asterisks are often unnecessary and can cause formatting issues.
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
    def __init__(self):
        super().__init__()
        self.description = "Removes asterisks (* and **) from markdown headers"
        self.name = "unbold_headers"
        
        # Set default configuration
        self._set_default_config()
    
    def _set_default_config(self):
        """Set default configuration values."""
        self.config = {
            'enabled': True,
            'remove_single_asterisks': True,
            'remove_double_asterisks': True
        }
    
    def update_config(self, external_config: dict):
        """Update configuration with external settings from config.yml."""
        if external_config:
            self.config.update(external_config)
            self.logger.info(f"Updated configuration for {self.name}: {external_config}")
    
    def apply(self, content: str, file_path: str) -> str:
        try:
            self.logger.info(f"Applying unbold_headers rule to {file_path}")
            lines = content.split('\n')
            formatted_lines = []
            changes_made = False
            
            for i, line in enumerate(lines):
                # Check if this line is a header (starts with # followed by space)
                if re.match(r'^#{1,6}\s+', line):
                    self.logger.info(f"Found header at line {i+1}: {line}")
                    # Remove asterisks from header content
                    formatted_line = self.remove_asterisks_from_header(line)
                    if formatted_line != line:
                        self.logger.info(f"Modified header: '{line}' -> '{formatted_line}'")
                        changes_made = True
                    formatted_lines.append(formatted_line)
                else:
                    # Keep non-header lines unchanged
                    formatted_lines.append(line)
            
            if changes_made:
                self.logger.info("Unbold headers rule made changes")
            else:
                self.logger.info("Unbold headers rule found no headers with asterisks")
            
            return '\n'.join(formatted_lines)
            
        except Exception as e:
            self.logger.error(f"Unbold headers rule failed: {e}")
            return content
    
    def remove_asterisks_from_header(self, header_line: str) -> str:
        """
        Remove asterisks from a header line while preserving the header structure.
        
        Args:
            header_line: A line that starts with # symbols (e.g., "## **Bold Header**")
            
        Returns:
            Header line with asterisks removed (e.g., "## Bold Header")
        """
        # Split into header markers and content
        match = re.match(r'^(#{1,6}\s+)(.+)$', header_line)
        if not match:
            return header_line
        
        header_markers = match.group(1)  # e.g., "## "
        header_content = match.group(2)  # e.g., "**Bold Header**"
        
        self.logger.info(f"Processing header content: '{header_content}'")
        
        # Remove asterisks from content
        # Remove **bold** formatting
        cleaned_content = re.sub(r'\*\*([^*]+)\*\*', r'\1', header_content)
        # Remove *italic* formatting  
        cleaned_content = re.sub(r'\*([^*]+)\*', r'\1', cleaned_content)
        # Remove any remaining single asterisks (edge cases)
        cleaned_content = cleaned_content.replace('*', '')
        
        self.logger.info(f"Cleaned content: '{cleaned_content}'")
        
        return header_markers + cleaned_content
