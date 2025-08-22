#!/usr/bin/env python3
"""
Base Formatting Rule

This module provides the base class and common functionality for all formatting rules.
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class FormattingError(Exception):
    """Exception raised when formatting fails."""
    pass


class BaseFormattingRule(ABC):
    """
    Base class for all formatting rules.
    
    This provides common functionality and enforces the interface that all
    formatting rules must implement.
    """
    
    def __init__(self):
        """Initialize the base formatting rule."""
        self.logger = logging.getLogger(self.__class__.__name__)
        self.name = self.__class__.__name__.lower()
        self.description = "Base formatting rule - override in subclass"
        self.config = {}
        
        # Statistics tracking
        self.stats = {
            'files_processed': 0,
            'changes_made': 0,
            'errors_encountered': 0,
            'total_processing_time': 0.0
        }
    
    @abstractmethod
    def apply(self, content: str, file_path: str) -> str:
        """
        Apply formatting to the markdown content.
        
        This method must be implemented by all subclasses.
        
        Args:
            content: The original markdown content
            file_path: Path to the file being formatted (for context)
            
        Returns:
            The formatted markdown content
            
        Raises:
            FormattingError: If formatting fails
        """
        pass
    
    def preprocess(self, content: str, file_path: str) -> str:
        """
        Preprocess content before applying the main formatting rule.
        
        Override this method if you need to prepare content before formatting.
        
        Args:
            content: The original markdown content
            file_path: Path to the file being formatted
            
        Returns:
            Preprocessed content
        """
        return content
    
    def postprocess(self, content: str, file_path: str) -> str:
        """
        Postprocess content after applying the main formatting rule.
        
        Override this method if you need to clean up content after formatting.
        
        Args:
            content: The formatted markdown content
            file_path: Path to the file being formatted
            
        Returns:
            Postprocessed content
        """
        return content
    
    def validate_config(self) -> bool:
        """
        Validate the rule's configuration.
        
        Override this method to add configuration validation logic.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about what this rule has processed.
        
        Returns:
            Dictionary containing rule statistics
        """
        return {
            'rule_name': self.name,
            'description': self.description,
            'enabled': self.config.get('enabled', True),
            'config': self.config.copy(),
            'statistics': self.stats.copy()
        }
    
    def reset_stats(self) -> None:
        """Reset all statistics to zero."""
        self.stats = {
            'files_processed': 0,
            'changes_made': 0,
            'errors_encountered': 0,
            'total_processing_time': 0.0
        }
    
    def update_stats(self, changes_made: bool = False, error_occurred: bool = False) -> None:
        """
        Update rule statistics.
        
        Args:
            changes_made: Whether the rule made changes to the content
            error_occurred: Whether an error occurred during processing
        """
        self.stats['files_processed'] += 1
        if changes_made:
            self.stats['changes_made'] += 1
        if error_occurred:
            self.stats['errors_encountered'] += 1
    
    def is_enabled(self) -> bool:
        """
        Check if this rule is enabled.
        
        Returns:
            True if the rule is enabled, False otherwise
        """
        return self.config.get('enabled', True)
    
    def enable(self) -> None:
        """Enable this formatting rule."""
        self.config['enabled'] = True
        self.logger.info(f"Rule {self.name} enabled")
    
    def disable(self) -> None:
        """Disable this formatting rule."""
        self.config['enabled'] = False
        self.logger.info(f"Rule {self.name} disabled")
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            key: Configuration key to retrieve
            default: Default value if key doesn't exist
            
        Returns:
            Configuration value or default
        """
        return self.config.get(key, default)
    
    def set_config(self, key: str, value: Any) -> None:
        """
        Set a configuration value.
        
        Args:
            key: Configuration key to set
            value: Value to set
        """
        self.config[key] = value
        self.logger.debug(f"Rule {self.name} config updated: {key} = {value}")
    
    def load_config(self, config: Dict[str, Any]) -> None:
        """
        Load configuration from a dictionary.
        
        Args:
            config: Configuration dictionary
        """
        self.config.update(config)
        self.logger.debug(f"Rule {self.name} configuration loaded: {config}")
    
    def get_help_text(self) -> str:
        """
        Get help text for this rule.
        
        Override this method to provide detailed help information.
        
        Returns:
            Help text string
        """
        return f"""
Rule: {self.name}
Description: {self.description}

Configuration Options:
{self._format_config_help()}

Usage: This rule is automatically applied when enabled in the configuration.
        """
    
    def _format_config_help(self) -> str:
        """Format configuration options for help display."""
        if not self.config:
            return "  No configuration options available."
        
        help_lines = []
        for key, value in self.config.items():
            help_lines.append(f"  {key}: {value} ({type(value).__name__})")
        
        return "\n".join(help_lines)


class SimpleFormattingRule:
    """
    Simple formatting rule interface for basic implementations.
    
    This class provides a simpler interface for rules that don't need
    all the features of BaseFormattingRule.
    """
    
    def __init__(self):
        """Initialize the simple formatting rule."""
        self.description = "Simple formatting rule - override description"
        self.name = self.__class__.__name__.lower()
    
    def apply(self, content: str, file_path: str) -> str:
        """
        Apply formatting to the markdown content.
        
        Args:
            content: The original markdown content
            file_path: Path to the file being formatted
            
        Returns:
            The formatted markdown content
        """
        # Default implementation returns content unchanged
        return content
    
    def is_enabled(self) -> bool:
        """Check if this rule is enabled."""
        return True  # Simple rules are always enabled by default
