import os
import argparse
import fnmatch
from pathlib import Path

def matches_gitignore_pattern(path, pattern, base_path):
    """Check if a path matches a gitignore-style pattern"""
    # Convert path to relative path from base
    try:
        rel_path = path.relative_to(base_path)
        rel_path_str = str(rel_path).replace('\\', '/')
    except ValueError:
        rel_path_str = str(path).replace('\\', '/')
    
    # Handle different gitignore pattern types
    if pattern.endswith('/'):
        # Directory-only pattern (e.g., "build/")
        pattern = pattern[:-1]
        if not path.is_dir():
            return False
    
    if pattern.startswith('/'):
        # Root-relative pattern (e.g., "/dist")
        pattern = pattern[1:]
        return fnmatch.fnmatch(rel_path_str, pattern) or fnmatch.fnmatch(path.name, pattern)
    else:
        # Pattern can match at any level
        # Check both the full relative path and just the name
        return (fnmatch.fnmatch(rel_path_str, pattern) or 
                fnmatch.fnmatch(path.name, pattern) or
                fnmatch.fnmatch(rel_path_str, f"*/{pattern}") or
                any(fnmatch.fnmatch(part, pattern) for part in rel_path.parts))

def should_exclude(path, exclude_patterns, base_path):
    """Check if a path should be excluded based on gitignore-style patterns"""
    for pattern in exclude_patterns:
        if matches_gitignore_pattern(path, pattern, base_path):
            return True
    return False

def print_tree(directory, exclude_patterns=None, prefix="", output_file=None, base_path=None, is_last=True):        
    if exclude_patterns is None:
        exclude_patterns = ["node_modules", "dist", "build", ".next", "coverage", ".git", "__pycache__"]
    
    if base_path is None:
        base_path = Path(directory)
    
    path = Path(directory)
    
    # Skip if this directory itself should be excluded
    if should_exclude(path, exclude_patterns, base_path):
        return
    
    try:
        items = sorted(path.iterdir())
    except PermissionError:
        return
    
    # Filter out excluded items
    filtered_items = [item for item in items if not should_exclude(item, exclude_patterns, base_path)]
    
    for i, item in enumerate(filtered_items):
        is_last_item = i == len(filtered_items) - 1
        
        # Choose the appropriate tree character
        if is_last_item:
            current_prefix = "└── "
            next_prefix = "    "
        else:
            current_prefix = "├── "
            next_prefix = "│   "
            
        line = f"{prefix}{current_prefix}{item.name}"
        if output_file:
            output_file.write(line + "\n")
        else:
            print(line)
            
        if item.is_dir():
            print_tree(item, exclude_patterns, prefix + next_prefix, output_file, base_path, is_last_item)

def main():
    parser = argparse.ArgumentParser(description='Export directory tree structure with gitignore-style excludes')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to export (default: current directory)')
    parser.add_argument('--exclude', action='append', default=[], help='Exclude patterns (gitignore-style). Can be used multiple times.')
    parser.add_argument('--output', '-o', help='Output file (default: print to console)')
    parser.add_argument('--no-defaults', action='store_true', help='Do not use default exclude patterns')
    
    args = parser.parse_args()
    
    # Default excludes (can be disabled with --no-defaults)
    default_excludes = ["node_modules", "dist", "build", ".next", "coverage", ".git", "__pycache__", "*.pyc", "*.pyo", "*.log"]
    
    if args.no_defaults:
        exclude_patterns = args.exclude
    else:
        exclude_patterns = default_excludes + args.exclude
    
    directory = Path(args.directory).resolve()
    
    if not directory.exists():
        print(f"Error: Directory '{directory}' does not exist")
        return
    
    print(f"Exporting tree for: {directory}")
    print(f"Excluding patterns: {exclude_patterns}")
    print("-" * 50)
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(f"Directory tree for: {directory}\n")
            f.write(f"Excluded patterns: {exclude_patterns}\n")
            f.write("-" * 50 + "\n")
            f.write(f"{directory.name}\n")
            print_tree(directory, exclude_patterns, output_file=f)
        print(f"Tree exported to: {args.output}")
    else:
        print(f"{directory.name}")
        print_tree(directory, exclude_patterns)

if __name__ == "__main__":
    main()
