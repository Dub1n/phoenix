#!/usr/bin/env python3
"""
Labeled Repository Timesheet Generator

Generates a timesheet from one or more file metadata sources, identifying work
periods and labeling each period with the project that had the majority of file activity.
"""

import json
import csv
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import sys
from collections import Counter

def round_time_to_increment(dt, minutes):
    """
    Rounds a datetime object to the nearest specified minute increment.
    
    Args:
        dt (datetime): The datetime object to round.
        minutes (int): The minute increment to round to.
        
    Returns:
        datetime: The rounded datetime object.
    """
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

def expand_input_paths(input_paths):
    """
    Expands input paths to include all JSON and CSV files from directories.
    
    Args:
        input_paths (list): List of file paths or directory paths
        
    Returns:
        list: Expanded list of file paths (JSON and CSV files only)
    """
    expanded_files = []
    
    for path_str in input_paths:
        path_obj = Path(path_str)
        
        if path_obj.is_file():
            # If it's a file, add it directly if it's JSON or CSV
            if path_obj.suffix.lower() in ['.json', '.csv']:
                expanded_files.append(str(path_obj))
            else:
                print(f"Warning: Skipping non-JSON/CSV file '{path_str}'", file=sys.stderr)
        elif path_obj.is_dir():
            # If it's a directory, find all JSON and CSV files
            json_files = list(path_obj.glob('*.json'))
            csv_files = list(path_obj.glob('*.csv'))
            
            for file_path in json_files + csv_files:
                expanded_files.append(str(file_path))
                
            if not json_files and not csv_files:
                print(f"Warning: No JSON or CSV files found in directory '{path_str}'", file=sys.stderr)
        else:
            print(f"Warning: Path '{path_str}' does not exist, skipping.", file=sys.stderr)
    
    return expanded_files

def load_project_activity(filepaths):
    """
    Loads all file activities from one or more repo metadata JSON files and
    CSV usage event files, combining them into a single timeline.

    Args:
        filepaths (list): A list of paths to repo_metadata-*.json and usage-events-*.csv files.

    Returns:
        list: A single, sorted list of tuples, where each tuple is (unix_timestamp, project_name).
    """
    all_activities = []
    for filepath in filepaths:
        try:
            filepath_obj = Path(filepath)
            
            if filepath_obj.suffix.lower() == '.json':
                # Handle JSON files (existing logic)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                for project_name, project_files in data.items():
                    for file_meta in project_files:
                        if 'created' in file_meta and file_meta['created'] is not None:
                            all_activities.append((file_meta['created'], project_name))
                        if 'modified' in file_meta and file_meta['modified'] is not None:
                            all_activities.append((file_meta['modified'], project_name))
            
            elif filepath_obj.suffix.lower() == '.csv':
                # Handle CSV files (usage-events)
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if 'Date' in row and row['Date']:
                            try:
                                # Parse ISO format timestamp and convert to unix timestamp
                                dt = datetime.fromisoformat(row['Date'].replace('Z', '+00:00'))
                                unix_timestamp = dt.timestamp()
                                all_activities.append((unix_timestamp, 'Cursor'))
                            except ValueError:
                                print(f"Warning: Could not parse date '{row['Date']}' in '{filepath}', skipping row.", file=sys.stderr)
                        
        except FileNotFoundError:
            print(f"Warning: Input file not found at '{filepath}', skipping.", file=sys.stderr)
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from '{filepath}', skipping.", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Error processing '{filepath}': {e}, skipping.", file=sys.stderr)
            
    all_activities.sort(key=lambda x: x[0])
    return all_activities

def group_activity_into_periods(activities, cutoff_minutes):
    """
    Groups a sorted list of activities into work periods based on time gaps.
    Each period also tracks the project activities that occurred within it.

    Args:
        activities (list): A sorted list of (timestamp, project_name) tuples.
        cutoff_minutes (int): The maximum gap in minutes between activities.

    Returns:
        list: A list of dictionaries, where each dictionary represents a work
              period with 'start', 'end', and a 'projects' list.
    """
    if not activities:
        return []

    periods = []
    first_timestamp, first_project = activities[0]
    current_period_start = datetime.fromtimestamp(first_timestamp)
    current_period_projects = [first_project]

    for i in range(1, len(activities)):
        prev_timestamp, _ = activities[i-1]
        current_timestamp, current_project = activities[i]

        prev_time = datetime.fromtimestamp(prev_timestamp)
        current_time = datetime.fromtimestamp(current_timestamp)
        
        gap_minutes = (current_time - prev_time).total_seconds() / 60

        if gap_minutes <= cutoff_minutes:
            current_period_projects.append(current_project)
        else:
            # End the current period
            periods.append({
                'start': current_period_start,
                'end': prev_time, # The period ends at the time of the last activity
                'projects': current_period_projects
            })
            # Start a new period
            current_period_start = current_time
            current_period_projects = [current_project]

    # Add the final period
    last_timestamp, _ = activities[-1]
    periods.append({
        'start': current_period_start,
        'end': datetime.fromtimestamp(last_timestamp),
        'projects': current_period_projects
    })
    
    return periods

def main():
    """Main function to parse arguments and generate the timesheet."""
    parser = argparse.ArgumentParser(
        description='Generate a labeled timesheet from repository file metadata (JSON) and usage events (CSV) files.',
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="""
Example Usage:
  python repo_timesheet.py repo_metadata-projA.json usage-events-2025-07-02.csv --cutoff 60 --rounding 15
  python repo_timesheet.py /path/to/files/directory --cutoff 60 --rounding 15
  python repo_timesheet.py /path/to/files1 /path/to/files2 specific-file.json --cutoff 60

This command processes all JSON (repo metadata) and CSV (usage events) files from the given paths,
combines their activity, treats gaps over 60 minutes as breaks, rounds times to the nearest 15 minutes,
and labels each work period with the name of the most active project (CSV events are labeled as 'Cursor').
"""
    )
    
    parser.add_argument('input_files', nargs='+', help='One or more file paths (repo_metadata-*.json, usage-events-*.csv) or directory paths containing such files.')
    parser.add_argument('--cutoff', type=int, default=60, help='Minimum time gap in minutes for a break. Default: 60')
    parser.add_argument('--rounding', type=int, default=0, help='Round times to nearest minute increment. Default: 0')

    args = parser.parse_args()

    # Expand directories to individual files
    expanded_files = expand_input_paths(args.input_files)
    
    if not expanded_files:
        print("No valid JSON or CSV files found in the provided paths.")
        return

    activities = load_project_activity(expanded_files)
    if not activities:
        print("No file activity timestamps found in the provided file(s).")
        return

    raw_periods = group_activity_into_periods(activities, args.cutoff)
    
    processed_periods = []
    total_duration_hours = 0
    daily_summary = {}

    for i, period in enumerate(raw_periods):
        if not period['projects']:
            majority_project = "Unknown"
        else:
            project_counts = Counter(period['projects'])
            majority_project = project_counts.most_common(1)[0][0]

        start_time = period['start']
        end_time = period['end']

        if args.rounding > 0:
            start_time = round_time_to_increment(start_time, args.rounding)
            end_time = round_time_to_increment(end_time, args.rounding)
        
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        if duration_hours <= 0:
            continue

        processed_periods.append({
            'id': i + 1,
            'start': start_time,
            'end': end_time,
            'duration_hours': duration_hours,
            'project': majority_project
        })
        
        total_duration_hours += duration_hours
        
        date_key = start_time.date()
        if date_key not in daily_summary:
            daily_summary[date_key] = []
        daily_summary[date_key].append(processed_periods[-1])

    input_filenames = ', '.join([Path(f).name for f in expanded_files])
    print(f"Combined Repository Activity Timesheet for: {input_filenames}")
    print(f"(Cutoff: {args.cutoff} mins, Rounding: {args.rounding} mins)")
    print("=" * 80)

    for period in processed_periods:
        start_str = period['start'].strftime('%Y-%m-%d %H:%M')
        end_str = period['end'].strftime('%H:%M')
        project_str = f"Project: {period['project']:<15}"
        print(f"Work Period {period['id']:<3} | {start_str} -> {end_str} | {project_str} | Duration: {period['duration_hours']:.2f} hours")

    print("=" * 80)
    print(f"Total Work Periods: {len(processed_periods)}")
    print(f"Total Hours: {total_duration_hours:.2f}")
    print("-" * 80)
    
    if daily_summary:
        print("Daily Breakdown:")
        for date, day_periods in sorted(daily_summary.items()):
            day_total_hours = sum(p['duration_hours'] for p in day_periods)
            time_ranges = [f"{p['start'].strftime('%H:%M')}-{p['end'].strftime('%H:%M')} ({p['project']})" for p in day_periods]
            print(f"  {date}: {day_total_hours:05.2f}h | {' | '.join(time_ranges)}")

if __name__ == "__main__":
    main()

