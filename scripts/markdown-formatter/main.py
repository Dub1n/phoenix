#!/usr/bin/env python3
"""
Markdown Formatter - Main Orchestrator

A modular system for applying various formatting rules to markdown files.
Each formatting rule is implemented as a separate module for easy extension.
"""

import argparse
import importlib
import importlib.util
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MarkdownFormatter:
    """Main orchestrator for markdown formatting operations."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the formatter with optional configuration."""
        self.config = self._load_config(config_path)
        self.rules = self._load_rules()
        
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load configuration from file or use defaults."""
        default_config = {
            'enabled_rules': ['table_formatter', 'list_formatter', 'header_formatter'],
            'backup_files': True,
            'dry_run': False,
            'verbose': False
        }
        
        # If no config path specified, look for config.yml in the same directory as main.py
        if not config_path:
            config_path = Path(__file__).parent / 'config.yml'
        
        if config_path and os.path.exists(config_path):
            try:
                try:
                    import yaml # type: ignore
                except ImportError as e:
                    logger.error("PyYAML is required to load configuration files. Please install it with 'pip install pyyaml'.")
                    raise e
                with open(config_path, 'r') as f:
                    user_config = yaml.safe_load(f)
                    # User config takes precedence over defaults
                    default_config.update(user_config)
                    logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}")
        else:
            logger.info("No configuration file found, using default settings")
        
        return default_config
    
    def _load_rules(self) -> Dict:
        """Load all available formatting rules from the rules directory."""
        rules = {}
        rules_dir = Path(__file__).parent / 'rules'
        
        if not rules_dir.exists():
            logger.warning(f"Rules directory not found: {rules_dir}")
            return rules
        
        # Recursively scan for rule files in subdirectories
        rule_files = []
        
        # First, look for rules directly in rules/ directory (backward compatibility)
        for rule_file in rules_dir.glob('*.py'):
            if rule_file.name not in ['__init__.py', 'base_rule.py']:
                rule_files.append(rule_file)
        
        # Then, look for rules in subdirectories: rules/[rule_name]/[rule_name].py
        for subdir in rules_dir.iterdir():
            if subdir.is_dir() and not subdir.name.startswith('.'):
                rule_file = subdir / f"{subdir.name}.py"
                if rule_file.exists():
                    rule_files.append(rule_file)
        
        logger.info(f"Found {len(rule_files)} rule files")
        
        for rule_file in rule_files:
            try:
                # Import the rule module
                module_name = rule_file.stem
                spec = importlib.util.spec_from_file_location(module_name, rule_file)
                
                if spec is None or spec.loader is None:
                    logger.warning(f"Could not load spec for {rule_file}")
                    continue
                
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Look for FormattingRule class in the module
                rule_class = getattr(module, 'FormattingRule', None)
                
                if rule_class is None:
                    logger.warning(f"No FormattingRule class found in {rule_file}")
                    continue
                
                # Create instance and add to rules
                rule_instance = rule_class()
                rule_name = rule_instance.name
                
                if rule_name in rules:
                    logger.warning(f"Rule name '{rule_name}' conflicts, skipping {rule_file}")
                    continue
                
                # Pass configuration from config.yml to the rule if available
                if 'rules' in self.config and rule_name in self.config['rules']:
                    rule_config = self.config['rules'][rule_name]
                    if hasattr(rule_instance, 'update_config'):
                        rule_instance.update_config(rule_config)
                        logger.info(f"Applied configuration to rule {rule_name}: {rule_config}")
                    else:
                        logger.warning(f"Rule {rule_name} doesn't support configuration updates")
                
                rules[rule_name] = rule_instance
                logger.info(f"Loaded rule: {rule_name} from {rule_file}")
                
            except Exception as e:
                logger.error(f"Failed to load rule from {rule_file}: {e}")
                continue
        
        return rules
    
    def format_file(self, file_path: str, dry_run: bool = False) -> bool:
        """Format a single markdown file using all enabled rules."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return False
        
        if not file_path.suffix.lower() == '.md':
            logger.warning(f"File {file_path} is not a markdown file")
            return False
        
        logger.info(f"Formatting file: {file_path}")
        
        # Read the file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return False
        
        original_content = content
        changes_made = False
        
        # Apply each enabled rule
        for rule_name in self.config['enabled_rules']:
            if rule_name not in self.rules:
                logger.warning(f"Rule {rule_name} not found, skipping")
                continue
            
            rule = self.rules[rule_name]
            try:
                new_content = rule.apply(content, str(file_path))
                if new_content != content:
                    content = new_content
                    changes_made = True
                    logger.info(f"Rule {rule_name} made changes")
                else:
                    logger.debug(f"Rule {rule_name} made no changes")
            except Exception as e:
                logger.error(f"Rule {rule_name} failed: {e}")
        
        # Write the file if changes were made
        if changes_made and not dry_run:
            # Determine output path
            output_path = file_path
            if 'output_path' in self.config and self.config['output_path']:
                output_path = Path(self.config['output_path'])
                # If output_path is a directory, append the filename
                if output_path.is_dir():
                    output_path = output_path / file_path.name
                logger.info(f"Writing formatted content to: {output_path}")
            
            # Create backup if enabled and writing to original file
            if self.config['backup_files'] and output_path == file_path:
                backup_path = file_path.with_suffix('.md.backup')
                try:
                    with open(backup_path, 'w', encoding='utf-8') as f:
                        f.write(original_content)
                    logger.info(f"Created backup: {backup_path}")
                except Exception as e:
                    logger.error(f"Failed to create backup: {e}")
            
            # Write formatted content
            try:
                # Ensure output directory exists
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                logger.info(f"Successfully formatted: {output_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to write formatted file: {e}")
                return False
        elif dry_run and changes_made:
            logger.info(f"[DRY RUN] Would format: {file_path}")
            logger.info(f"[DRY RUN] Changes would be made by rules: {[rule_name for rule_name in self.config['enabled_rules'] if rule_name in self.rules]}")
            # For dry run, show a diff-like output of what would change
            if self.config.get('verbose', False):
                logger.info("[DRY RUN] Content would change from:")
                logger.info(f"[DRY RUN] Original: {repr(original_content[:200])}...")
                logger.info(f"[DRY RUN] Formatted: {repr(content[:200])}...")
            return True
        else:
            logger.info(f"No changes needed for: {file_path}")
            return True
    
    def format_directory(self, dir_path: str, recursive: bool = False) -> Dict[str, bool]:
        """Format all markdown files in a directory."""
        dir_path = Path(dir_path)
        results = {}
        
        if not dir_path.exists() or not dir_path.is_dir():
            logger.error(f"Directory not found: {dir_path}")
            return results
        
        # Find markdown files
        if recursive:
            markdown_files = list(dir_path.rglob('*.md'))
        else:
            markdown_files = list(dir_path.glob('*.md'))
        
        logger.info(f"Found {len(markdown_files)} markdown files")
        
        # Format each file
        for file_path in markdown_files:
            results[str(file_path)] = self.format_file(
                str(file_path), 
                dry_run=self.config['dry_run']
            )
        
        return results
    
    def list_rules(self) -> None:
        """List all available formatting rules and their status."""
        print("\nAvailable Formatting Rules:")
        print("=" * 50)
        
        for rule_name, rule in self.rules.items():
            status = "✓" if rule_name in self.config['enabled_rules'] else "✗"
            description = getattr(rule, 'description', 'No description available')
            print(f"{status} {rule_name}: {description}")
        
        print(f"\nEnabled Rules: {', '.join(self.config['enabled_rules'])}")
        print(f"Total Rules: {len(self.rules)}")


def main():
    """Main entry point for the markdown formatter."""
    parser = argparse.ArgumentParser(
        description='Modular markdown formatting system',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
 Examples:
   python main.py file.md                    # Format single file
   python main.py --dir docs/               # Format all .md files in docs/
   python main.py --dir docs/ --recursive   # Format recursively
   python main.py --dry-run file.md         # Show what would change
   python main.py --list-rules              # List available rules
   python main.py --config config.yml       # Use custom config
   python main.py --output formatted.md file.md  # Create formatted copy
        """
    )
    
    parser.add_argument(
        'target',
        nargs='?',
        help='Markdown file or directory to format'
    )
    
    parser.add_argument(
        '--dir', '-d',
        help='Format all markdown files in directory'
    )
    
    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='Recursively search directories for markdown files'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would change without making changes'
    )
    
    parser.add_argument(
        '--config', '-c',
        help='Path to configuration file (YAML)'
    )
    
    parser.add_argument(
        '--list-rules', '-l',
        action='store_true',
        help='List all available formatting rules'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='Output file path (creates copy instead of overwriting)'
    )
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize formatter
    formatter = MarkdownFormatter(args.config)
    
    # Handle different modes
    if args.list_rules:
        formatter.list_rules()
        return
    
    if not args.target and not args.dir:
        parser.error("Must specify either a file/directory or use --dir")
        return
    
    # Override config with command line options
    if args.dry_run:
        formatter.config['dry_run'] = True
    
    # Set output path if specified
    if args.output:
        formatter.config['output_path'] = args.output
    
    # Execute formatting
    if args.dir:
        results = formatter.format_directory(args.dir, recursive=args.recursive)
        success_count = sum(1 for success in results.values() if success)
        total_count = len(results)
        print(f"\nFormatting complete: {success_count}/{total_count} files processed successfully")
        
        if formatter.config['dry_run']:
            print("(DRY RUN - No files were actually modified)")
    else:
        success = formatter.format_file(args.target, dry_run=formatter.config['dry_run'])
        if success:
            print(f"File {args.target} processed successfully")
            if formatter.config['dry_run']:
                print("(DRY RUN - File was not actually modified)")
        else:
            print(f"Failed to process file {args.target}")
            sys.exit(1)


if __name__ == '__main__':
    main()
