#!/usr/bin/env python3
"""
Repository File Metadata Extractor
Extracts creation and modification times for all files in a multi-project repository
and exports the data as JSON for visualization.
Example command: 
python scripts/timesheets/extract_metadata.py C:/Users/gabri/Documents/Infotopology/VDL_Vault --projects DSS Haruspex phoenix-code-lite Templum docs
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
import sys

def get_file_metadata(file_path):
    """
    Extract metadata for a single file.
    
    Args:
        file_path: Path object for the file
        
    Returns:
        Dictionary with file metadata
    """
    try:
        stat = file_path.stat()
        
        # Get creation time (birth time on Unix, creation time on Windows)
        # Note: on some Unix systems, st_birthtime might not be available
        try:
            created_time = stat.st_birthtime if hasattr(stat, 'st_birthtime') else stat.st_ctime
        except AttributeError:
            created_time = stat.st_ctime  # Fall back to change time if birth time not available
        
        return {
            'path': str(file_path),
            'name': file_path.name,
            'created': created_time,
            'modified': stat.st_mtime,
            'size': stat.st_size
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return None

def scan_directory(directory_path, ignore_patterns=None):
    """
    Recursively scan a directory and extract metadata for all files.
    
    Args:
        directory_path: Path to the directory to scan
        ignore_patterns: List of patterns to ignore (e.g., ['.git', '__pycache__'])
        
    Returns:
        List of file metadata dictionaries
    """
    if ignore_patterns is None:
        ignore_patterns = ['.git', '__pycache__', 'node_modules', '.env', 'venv', '.venv']
    
    files_metadata = []
    path = Path(directory_path)
    
    # Check if any ignore pattern matches
    for pattern in ignore_patterns:
        if pattern in str(path):
            return files_metadata
    
    try:
        for item in path.iterdir():
            # Skip ignored patterns
            if any(pattern in item.name for pattern in ignore_patterns):
                continue
            
            if item.is_file():
                metadata = get_file_metadata(item)
                if metadata:
                    # Make path relative to the directory being scanned
                    metadata['path'] = str(item.relative_to(path.parent))
                    files_metadata.append(metadata)
            elif item.is_dir():
                # Recursively scan subdirectories
                subdirectory_files = scan_directory(item, ignore_patterns)
                files_metadata.extend(subdirectory_files)
    except PermissionError:
        print(f"Permission denied: {path}", file=sys.stderr)
    except Exception as e:
        print(f"Error scanning {path}: {e}", file=sys.stderr)
    
    return files_metadata

def extract_repository_metadata(repo_path, project_dirs=None, ignore_patterns=None):
    """
    Extract metadata for all projects in a repository.
    
    Args:
        repo_path: Path to the repository root
        project_dirs: List of project directory names (if None, will auto-detect)
        ignore_patterns: List of patterns to ignore
        
    Returns:
        Dictionary mapping project names to their file metadata
    """
    repo_path = Path(repo_path)
    
    if not repo_path.exists():
        raise ValueError(f"Repository path does not exist: {repo_path}")
    
    if not repo_path.is_dir():
        raise ValueError(f"Repository path is not a directory: {repo_path}")
    
    # If no specific project directories provided, auto-detect
    if project_dirs is None:
        # Find all top-level directories that look like projects
        project_dirs = []
        for item in repo_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                # Check if it's likely a project (has source files)
                has_source_files = any(
                    f.suffix in ['.py', '.js', '.java', '.cpp', '.c', '.go', '.rs', '.ts', '.jsx', '.tsx', '.vue', '.rb', '.php']
                    for f in item.rglob('*') if f.is_file()
                )
                if has_source_files:
                    project_dirs.append(item.name)
    
    if not project_dirs:
        # If no projects detected, treat the entire repo as a single project
        print("No sub-projects detected, treating entire repository as single project")
        return {"main": scan_directory(repo_path, ignore_patterns)}
    
    metadata = {}
    
    for project_dir in project_dirs:
        project_path = repo_path / project_dir
        if project_path.exists() and project_path.is_dir():
            print(f"Scanning project: {project_dir}")
            project_files = scan_directory(project_path, ignore_patterns)
            metadata[project_dir] = project_files
            print(f"  Found {len(project_files)} files")
        else:
            print(f"Warning: Project directory not found: {project_path}", file=sys.stderr)
    
    return metadata

def save_metadata(metadata, output_file):
    """
    Save metadata to a JSON file.
    
    Args:
        metadata: Dictionary of project metadata
        output_file: Path to the output JSON file
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"\nMetadata saved to: {output_file}")

def print_summary(metadata):
    """
    Print a summary of the extracted metadata.
    
    Args:
        metadata: Dictionary of project metadata
    """
    print("\n" + "="*50)
    print("EXTRACTION SUMMARY")
    print("="*50)
    
    total_files = 0
    for project, files in metadata.items():
        print(f"\n{project}:")
        print(f"  Files: {len(files)}")
        
        if files:
            # Find earliest and latest dates
            created_dates = [f['created'] for f in files if f.get('created')]
            modified_dates = [f['modified'] for f in files if f.get('modified')]
            
            if created_dates:
                earliest = datetime.fromtimestamp(min(created_dates))
                print(f"  Earliest creation: {earliest.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if modified_dates:
                latest = datetime.fromtimestamp(max(modified_dates))
                print(f"  Latest modification: {latest.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Calculate total size
            total_size = sum(f.get('size', 0) for f in files)
            print(f"  Total size: {total_size / (1024*1024):.2f} MB")
        
        total_files += len(files)
    
    print(f"\nTotal files across all projects: {total_files}")

def main():
    parser = argparse.ArgumentParser(
        description='Extract file metadata from a multi-project repository',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan entire repository (auto-detect projects)
  python extract_metadata.py /path/to/repo
  
  # Scan specific projects
  python extract_metadata.py /path/to/repo --projects frontend backend shared
  
  # Custom output file
  python extract_metadata.py /path/to/repo -o my_repo_data.json
  
  # Ignore additional patterns
  python extract_metadata.py /path/to/repo --ignore build dist *.log
        """
    )
    
    parser.add_argument('repo_path', help='Path to the repository root directory')
    parser.add_argument('-p', '--projects', nargs='+', 
                       help='Specific project directories to scan (default: auto-detect)')
    parser.add_argument('-o', '--output', default='repo_metadata.json',
                       help='Output JSON file path (default: repo_metadata.json)')
    parser.add_argument('-i', '--ignore', nargs='+', 
                       help='Additional patterns to ignore (e.g., build dist)')
    parser.add_argument('-s', '--summary', action='store_true',
                       help='Print summary statistics')
    
    args = parser.parse_args()
    
    # Default ignore patterns
    ignore_patterns = ['.git', '__pycache__', 'node_modules', '.env', 'venv', '.venv', '.DS_Store']
    
    # Add custom ignore patterns
    if args.ignore:
        ignore_patterns.extend(args.ignore)
    
    try:
        print(f"Scanning repository: {args.repo_path}")
        print(f"Ignoring patterns: {', '.join(ignore_patterns)}")
        print()
        
        # Extract metadata
        metadata = extract_repository_metadata(
            args.repo_path,
            project_dirs=args.projects,
            ignore_patterns=ignore_patterns
        )
        
        # Save to JSON
        save_metadata(metadata, args.output)
        
        # Print summary if requested
        if args.summary:
            print_summary(metadata)
        
        print(f"\n✅ Successfully extracted metadata for {len(metadata)} project(s)")
        print(f"📊 Open the HTML visualization and upload '{args.output}' to see the timeline")
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
