#!/usr/bin/env python3
"""
Test script to demonstrate configuration override functionality.
"""

import sys
from pathlib import Path

# Add the rules directory to Python path for imports
rules_dir = Path(__file__).parent.parent
sys.path.insert(0, str(rules_dir))

from emoji_substitute import FormattingRule

def test_config_override():
    """Test how configuration override works."""
    
    # Create rule with default config
    rule = FormattingRule()
    print("=== Default Configuration ===")
    print(f"Enabled: {rule.config['enabled']}")
    print(f"Success marks enabled: {rule.config['enable_success_marks']}")
    print(f"Error marks enabled: {rule.config['enable_error_marks']}")
    print(f"Warnings enabled: {rule.config['enable_warnings']}")
    
    # Test with default config
    test_content = "✅ Success ❌ Error ⚠️ Warning"
    print(f"\n=== Test Content ===")
    print(f"Original: {test_content}")
    
    result = rule.apply(test_content, "test.md")
    print(f"Result: {result}")
    
    # Now override config
    print(f"\n=== Overriding Configuration ===")
    external_config = {
        'enable_success_marks': False,  # Disable success marks
        'enable_error_marks': False,    # Disable error marks
        'enable_warnings': True         # Keep warnings enabled
    }
    
    rule.update_config(external_config)
    print(f"After override - Success marks enabled: {rule.config['enable_success_marks']}")
    print(f"After override - Error marks enabled: {rule.config['enable_error_marks']}")
    print(f"After override - Warnings enabled: {rule.config['enable_warnings']}")
    
    # Test with overridden config
    result2 = rule.apply(test_content, "test.md")
    print(f"Result after override: {result2}")
    
    print(f"\n=== Configuration Summary ===")
    print(f"Final config: {rule.config}")

if __name__ == '__main__':
    test_config_override()
