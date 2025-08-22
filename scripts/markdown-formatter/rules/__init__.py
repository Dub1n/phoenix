#!/usr/bin/env python3
"""
Markdown Formatter Rules Package

This package contains all the formatting rules for the markdown formatter.
Each rule is implemented as a separate module that can be enabled/disabled
independently.
"""

from .base_rule import BaseFormattingRule, SimpleFormattingRule, FormattingError

__all__ = [
    'BaseFormattingRule',
    'SimpleFormattingRule', 
    'FormattingError'
]

# Version information
__version__ = '1.0.0'
__author__ = 'Markdown Formatter Team'
__description__ = 'Modular markdown formatting rules package'
