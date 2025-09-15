#!/usr/bin/env python3
"""
Combined Repository & Claude Code Timesheet Generator

Generates a unified timesheet by combining:
1. Folder-based file metadata (JSON) and usage events (CSV)
2. Claude Code auto-scraped activity logs (JSONL)

Creates work periods based on combined activity and labels each period with the
most active project, while ignoring specified project names.

Default Values

  - --cutoff: 60 minutes
    - Maximum gap between activities to group them into the same work period
  - --rounding: 0 minutes
    - No time rounding by default (times shown as exact)
  - --min-duration: 0 hours
    - Shows all work periods regardless of duration
  - --date: None
    - Shows all dates (no date filtering)
  - --exclude-claude: False
    - Includes Claude Code activity data by default
  - --ignore-projects: '' (empty string)
    - No projects ignored by default (the user modified this from the original "cursor" default)
  - --debug: False
    - No debug information shown by default

Basic usage (shows all work periods):
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py

  Compact format showing only totals and daily breakdown:
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py --hours

  Filter to today's date only:
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py --date $(date +%Y-%m-%d)

  Round times to 15-minute increments with compact output:
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py --hours --round 15

  Show only work periods longer than 0.5 hours (30 minutes):
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py --min-duration 0.5

  Debug mode to see how periods are grouped:
  python /mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/timesheets/claude_t
  imesheet_2.py --debug
"""

import json
import csv
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import sys
from collections import Counter

def round_time_to_increment(dt, minutes):
    """Round datetime to nearest minute increment."""
    if minutes <= 0:
        return dt
    
    total_minutes = dt.hour * 60 + dt.minute
    rounded_minutes = round(total_minutes / minutes) * minutes
    
    if rounded_minutes >= 24 * 60:
        rounded_minutes = 0
        dt = dt + timedelta(days=1)
    
    hours = rounded_minutes // 60
    mins = rounded_minutes % 60
    
    return dt.replace(hour=hours, minute=mins, second=0, microsecond=0)

def parse_timestamp(timestamp_str):
    """Parse ISO timestamp string to datetime object."""
    return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

def load_folder_activity(folder_path, ignore_projects=None):
    """
    Load all file activities from JSON and CSV files in the specified folder.
    
    Args:
        folder_path (Path): Path to folder containing JSON/CSV files
        ignore_projects (set): Project names to ignore
        
    Returns:
        list: List of (unix_timestamp, 'folder', project_name) tuples
    """
    if ignore_projects is None:
        ignore_projects = set()
    
    folder_path = Path(folder_path)
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"Warning: Folder path '{folder_path}' does not exist or is not a directory")
        return []
    
    activities = []
    
    # Process JSON files (repo metadata)
    for json_file in folder_path.glob('*.json'):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for project_name, project_files in data.items():
                if project_name.lower() in ignore_projects:
                    continue
                    
                for file_meta in project_files:
                    if 'created' in file_meta and file_meta['created'] is not None:
                        activities.append((file_meta['created'], 'folder', project_name))
                    if 'modified' in file_meta and file_meta['modified'] is not None:
                        activities.append((file_meta['modified'], 'folder', project_name))
                        
        except Exception as e:
            print(f"Warning: Error processing JSON file '{json_file}': {e}")
    
    # Process CSV files (usage events)
    for csv_file in folder_path.glob('*.csv'):
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if 'Date' in row and row['Date']:
                        try:
                            dt = datetime.fromisoformat(row['Date'].replace('Z', '+00:00'))
                            unix_timestamp = dt.timestamp()
                            # Use filename or default project name, but respect ignore list
                            project_name = csv_file.stem
                            if project_name.lower() not in ignore_projects:
                                activities.append((unix_timestamp, 'folder', project_name))
                        except ValueError:
                            continue
                            
        except Exception as e:
            print(f"Warning: Error processing CSV file '{csv_file}': {e}")
    
    return activities

def collect_claude_activity(ignore_projects=None):
    """
    Collect all Claude Code activities from Claude projects directories.
    Searches both ~/.claude/projects and WSL Ubuntu path.
    
    Args:
        ignore_projects (set): Project names to ignore
        
    Returns:
        list: List of (unix_timestamp, 'claude', working_directory) tuples
    """
    if ignore_projects is None:
        ignore_projects = set()
    
    # Try multiple Claude directories
    claude_dirs = [
        Path.home() / '.claude' / 'projects',
        Path(r'\\wsl.localhost\Ubuntu\home\gabri\.claude\projects')
    ]
    
    found_dirs = []
    for claude_dir in claude_dirs:
        if claude_dir.exists():
            found_dirs.append(claude_dir)
            print(f"Found Claude projects at: {claude_dir}")
    
    if not found_dirs:
        print("Warning: No Claude projects directories found")
        return []
    
    activities = []
    
    # Process all found Claude directories
    for claude_dir in found_dirs:
        for project_dir in claude_dir.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob('*.jsonl'):
                    try:
                        with open(jsonl_file, 'r', encoding='utf-8') as f:
                            for line in f:
                                line = line.strip()
                                if line:
                                    try:
                                        data = json.loads(line)
                                        if 'timestamp' in data and 'type' in data:
                                            dt = parse_timestamp(data['timestamp'])
                                            unix_timestamp = dt.timestamp()
                                            
                                            # Use working directory as project identifier
                                            working_dir = data.get('cwd', 'unknown')
                                            if working_dir != 'unknown':
                                                # Extract project name from working directory
                                                project_name = Path(working_dir).name
                                                # If working dir is just a generic name, try parent
                                                if project_name in ['src', 'build', 'dist', 'node_modules']:
                                                    project_name = Path(working_dir).parent.name
                                            else:
                                                # Fallback to Claude project directory name
                                                project_name = project_dir.name
                                            
                                            if project_name.lower() not in ignore_projects:
                                                activities.append((unix_timestamp, 'claude', project_name))
                                                
                                    except json.JSONDecodeError:
                                        continue
                                        
                    except Exception as e:
                        print(f"Warning: Error reading Claude Code file '{jsonl_file}': {e}")
    
    return activities

def combine_all_activities(folder_path, include_claude=True, ignore_projects=None):
    """
    Combine activities from folder and Claude Code sources.
    
    Args:
        folder_path (str): Path to folder containing data files
        include_claude (bool): Whether to include Claude Code data
        ignore_projects (set): Project names to ignore
        
    Returns:
        list: Combined and sorted list of activities
    """
    if ignore_projects is None:
        ignore_projects = set()
    
    # Convert ignore_projects to lowercase for case-insensitive comparison
    ignore_projects = {name.lower() for name in ignore_projects}
    
    activities = []
    
    # Load folder-based activities
    folder_activities = load_folder_activity(folder_path, ignore_projects)
    activities.extend(folder_activities)
    print(f"Loaded {len(folder_activities)} activities from folder")
    
    # Load Claude Code activities
    if include_claude:
        claude_activities = collect_claude_activity(ignore_projects)
        activities.extend(claude_activities)
        print(f"Loaded {len(claude_activities)} activities from Claude Code")
    
    # Sort by timestamp
    activities.sort(key=lambda x: x[0])
    print(f"Combined total: {len(activities)} activities")
    
    return activities

def group_activities_into_periods(activities, cutoff_minutes):
    """
    Group activities into work periods based on time gaps.
    
    Args:
        activities (list): Sorted list of (timestamp, source, project) tuples
        cutoff_minutes (int): Maximum gap in minutes between activities
        
    Returns:
        list: List of work period dictionaries
    """
    if not activities:
        return []
    
    periods = []
    first_timestamp, first_source, first_project = activities[0]
    current_period_start = datetime.fromtimestamp(first_timestamp)
    current_period_activities = [(first_timestamp, first_source, first_project)]
    
    for i in range(1, len(activities)):
        prev_timestamp, _, _ = activities[i-1]
        current_timestamp, current_source, current_project = activities[i]
        
        prev_time = datetime.fromtimestamp(prev_timestamp)
        current_time = datetime.fromtimestamp(current_timestamp)
        
        gap_minutes = (current_time - prev_time).total_seconds() / 60
        
        if gap_minutes <= cutoff_minutes:
            current_period_activities.append((current_timestamp, current_source, current_project))
        else:
            # End current period
            periods.append({
                'start': current_period_start,
                'end': prev_time,
                'activities': current_period_activities
            })
            # Start new period
            current_period_start = current_time
            current_period_activities = [(current_timestamp, current_source, current_project)]
    
    # Add final period
    last_timestamp, _, _ = activities[-1]
    periods.append({
        'start': current_period_start,
        'end': datetime.fromtimestamp(last_timestamp),
        'activities': current_period_activities
    })
    
    return periods

def process_work_periods(raw_periods, rounding_minutes=0, min_duration_hours=0):
    """
    Process raw work periods, applying rounding and filtering.
    
    Args:
        raw_periods (list): List of raw work period dictionaries
        rounding_minutes (int): Minutes to round times to
        min_duration_hours (float): Minimum duration to include
        
    Returns:
        list: List of processed work period dictionaries
    """
    processed_periods = []
    
    for i, period in enumerate(raw_periods):
        # Determine majority project
        projects = [activity[2] for activity in period['activities']]
        project_counts = Counter(projects)
        majority_project = project_counts.most_common(1)[0][0]
        
        # Determine sources involved
        sources = [activity[1] for activity in period['activities']]
        source_counts = Counter(sources)
        primary_source = source_counts.most_common(1)[0][0]
        
        start_time = period['start']
        end_time = period['end']
        
        # Apply rounding
        if rounding_minutes > 0:
            start_time = round_time_to_increment(start_time, rounding_minutes)
            end_time = round_time_to_increment(end_time, rounding_minutes)
        
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        # Filter by minimum duration
        if duration_hours < min_duration_hours:
            continue
        
        processed_periods.append({
            'id': len(processed_periods) + 1,
            'start': start_time,
            'end': end_time,
            'duration_hours': duration_hours,
            'project': majority_project,
            'primary_source': primary_source,
            'activity_count': len(period['activities']),
            'sources': dict(source_counts),
            'projects': dict(project_counts)
        })
    
    return processed_periods

def main():
    """Main function to parse arguments and generate the combined timesheet."""
    parser = argparse.ArgumentParser(
        description='Generate a combined timesheet from folder data and Claude Code logs.',
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="""
Example Usage:
  python combined_timesheet.py /path/to/data/folder --cutoff 60 --rounding 15
  python combined_timesheet.py /path/to/data/folder --exclude-claude --cutoff 30
  python combined_timesheet.py /path/to/data/folder --ignore-projects cursor,test --date 2025-01-15

This command processes all JSON and CSV files in the given folder, automatically
includes Claude Code activity data, groups activities with gaps under 60 minutes,
and labels periods with the most active project (ignoring specified projects).
"""
    )
    
    parser.add_argument('folder_path', help='Path to folder containing JSON/CSV data files')
    parser.add_argument('--cutoff', type=int, default=60, 
                       help='Maximum gap in minutes between activities for same work period (default: 60)')
    parser.add_argument('--rounding', type=int, default=0,
                       help='Round times to nearest minute increment (default: 0)')
    parser.add_argument('--min-duration', type=float, default=0,
                       help='Only show work periods longer than this many hours (default: 0)')
    parser.add_argument('--date', type=str,
                       help='Filter to specific date (YYYY-MM-DD format)')
    parser.add_argument('--exclude-claude', action='store_true',
                       help='Exclude Claude Code activity data')
    parser.add_argument('--ignore-projects', type=str, default='',
                       help='Comma-separated list of project names to ignore (default: cursor)')
    parser.add_argument('--debug', action='store_true',
                       help='Show debug information about data sources and grouping')
    
    args = parser.parse_args()
    
    # Parse ignore projects
    ignore_projects = set()
    if args.ignore_projects:
        ignore_projects = {name.strip().lower() for name in args.ignore_projects.split(',')}
    
    print(f"Combined Repository & Claude Code Timesheet")
    print(f"Folder: {args.folder_path}")
    if not args.exclude_claude:
        print("Including Claude Code activity data")
    if ignore_projects:
        print(f"Ignoring projects: {', '.join(ignore_projects)}")
    print("=" * 80)
    
    # Combine all activities
    include_claude = not args.exclude_claude
    activities = combine_all_activities(args.folder_path, include_claude, ignore_projects)
    
    if not activities:
        print("No activities found from any data source.")
        return
    
    # Group into work periods
    raw_periods = group_activities_into_periods(activities, args.cutoff)
    print(f"Grouped into {len(raw_periods)} raw work periods")
    
    # Process periods with filtering and rounding
    work_periods = process_work_periods(raw_periods, args.rounding, args.min_duration)
    
    # Apply date filter if specified
    if args.date:
        try:
            filter_date = datetime.strptime(args.date, '%Y-%m-%d').date()
            work_periods = [p for p in work_periods if p['start'].date() == filter_date]
            print(f"Filtered to {len(work_periods)} periods for date {args.date}")
        except ValueError:
            print(f"Invalid date format: {args.date}. Use YYYY-MM-DD")
            return
    
    # Calculate totals
    total_hours = sum(p['duration_hours'] for p in work_periods)
    
    print(f"\nFinal results: {len(work_periods)} work periods, {total_hours:.2f} total hours")
    print("=" * 80)
    
    # Display detailed periods
    for period in work_periods:
        start_str = period['start'].strftime('%Y-%m-%d %H:%M')
        end_str = period['end'].strftime('%H:%M')
        source_info = f"({period['primary_source']}"
        if len(period['sources']) > 1:
            source_info += f", mixed)"
        else:
            source_info += ")"
        
        print(f"Period {period['id']:<3} | {start_str} -> {end_str} | "
              f"Project: {period['project']:<15} | {source_info} | "
              f"Duration: {period['duration_hours']:.2f}h | "
              f"Activities: {period['activity_count']}")
        
        if args.debug:
            print(f"    Sources: {period['sources']}")
            print(f"    Projects: {period['projects']}")
    
    print("=" * 80)
    print(f"Total Work Periods: {len(work_periods)}")
    print(f"Total Hours: {total_hours:.2f}")
    
    # Daily breakdown
    daily_summary = {}
    for period in work_periods:
        date_key = period['start'].date()
        if date_key not in daily_summary:
            daily_summary[date_key] = []
        daily_summary[date_key].append(period)
    
    if len(daily_summary) > 1 or args.date:
        print("\nDaily Breakdown:")
        print("-" * 80)
        for date, day_periods in sorted(daily_summary.items()):
            day_total = sum(p['duration_hours'] for p in day_periods)
            time_ranges = []
            for p in day_periods:
                start_str = p['start'].strftime('%H:%M')
                end_str = p['end'].strftime('%H:%M')
                source_abbr = 'F' if p['primary_source'] == 'folder' else 'C'
                time_ranges.append(f"{start_str}-{end_str}({source_abbr}:{p['project']})")
            print(f"  {date}: {day_total:05.2f}h | {' | '.join(time_ranges)}")

if __name__ == "__main__":
    main()
