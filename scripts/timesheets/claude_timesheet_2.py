#!/usr/bin/env python3
"""
Claude Code Timesheet Extractor
Extracts work periods from Claude Code logs based on message activity for timesheet purposes.
Groups messages into work periods based on activity gaps rather than session boundaries.
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import sys
import argparse

def round_time_to_increment(dt, minutes):
    """Round datetime to nearest minute increment."""
    if minutes <= 0:
        return dt
    
    # Round to nearest increment
    total_minutes = dt.hour * 60 + dt.minute
    rounded_minutes = round(total_minutes / minutes) * minutes
    
    # Handle day overflow
    if rounded_minutes >= 24 * 60:
        rounded_minutes = 0
        dt = dt + timedelta(days=1)
    
    hours = rounded_minutes // 60
    mins = rounded_minutes % 60
    
    return dt.replace(hour=hours, minute=mins, second=0, microsecond=0)

def parse_timestamp(timestamp_str):
    """Parse ISO timestamp string to datetime object."""
    return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

def collect_all_messages(claude_projects_dir):
    """Collect all messages from all JSONL files with timestamps."""
    all_messages = []
    
    for project_dir in claude_projects_dir.iterdir():
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
                                        data['source_file'] = str(jsonl_file)
                                        data['project_dir'] = jsonl_file.parent.name
                                        all_messages.append(data)
                                except json.JSONDecodeError:
                                    continue
                except Exception as e:
                    print(f"Error reading {jsonl_file}: {e}")
                    continue
    
    return all_messages

def group_messages_into_work_periods(messages, break_cutoff_minutes):
    """Group messages into work periods based on activity gaps."""
    if not messages:
        return []
    
    # Sort all messages by timestamp
    messages.sort(key=lambda x: x['timestamp'])
    
    work_periods = []
    current_period = [messages[0]]
    
    for i in range(1, len(messages)):
        current_msg = messages[i]
        prev_msg = messages[i-1]
        
        current_time = parse_timestamp(current_msg['timestamp'])
        prev_time = parse_timestamp(prev_msg['timestamp'])
        gap_minutes = (current_time - prev_time).total_seconds() / 60
        
        if gap_minutes > break_cutoff_minutes:
            # End current work period and start new one
            if current_period:
                work_periods.append(current_period)
            current_period = [current_msg]
        else:
            current_period.append(current_msg)
    
    # Add the final period
    if current_period:
        work_periods.append(current_period)
    
    return work_periods

def create_work_period_summary(period_messages, period_idx):
    """Create a summary for a work period."""
    if not period_messages:
        return None
    
    start_time = parse_timestamp(period_messages[0]['timestamp'])
    end_time = parse_timestamp(period_messages[-1]['timestamp'])
    duration = end_time - start_time
    duration_hours = duration.total_seconds() / 3600
    
    # Get working directories involved
    working_dirs = list(set(msg.get('cwd', 'unknown') for msg in period_messages if msg.get('cwd')))
    main_working_dir = working_dirs[0] if working_dirs else 'unknown'
    
    # Get session IDs involved
    session_ids = list(set(msg.get('sessionId', 'unknown') for msg in period_messages if msg.get('sessionId')))
    
    return {
        'period_id': f"work-period-{period_idx + 1}",
        'start_time': start_time,
        'end_time': end_time,
        'duration_hours': duration_hours,
        'message_count': len(period_messages),
        'working_directory': main_working_dir,
        'all_working_dirs': working_dirs,
        'session_ids': session_ids,
        'session_count': len(session_ids)
    }

def find_claude_projects():
    """Find Claude projects directory."""
    claude_dir = Path.home() / '.claude' / 'projects'
    if not claude_dir.exists():
        print("Claude projects directory not found at ~/.claude/projects")
        return None
    return claude_dir

def main():
    parser = argparse.ArgumentParser(description='Extract Claude Code work periods for timesheet purposes')
    parser.add_argument('--break-cutoff', type=int, default=60, 
                       help='Group messages into work periods when gap between messages is less than this many minutes (default: 60)')
    parser.add_argument('--min-duration', type=float, default=0,
                       help='Only show work periods longer than this many hours (default: 0)')
    parser.add_argument('--date', type=str,
                       help='Filter to specific date (YYYY-MM-DD format)')
    parser.add_argument('--hours', action='store_true',
                       help='Show compact format with time ranges in daily breakdown only')
    parser.add_argument('--debug', action='store_true',
                       help='Show debug information about gaps and grouping')
    parser.add_argument('--round', type=int, default=0,
                       help='Round start/end times to nearest minute increment (e.g., 15 for 15-minute increments, 30 for 30-minute increments)')
    
    args = parser.parse_args()
    
    claude_projects_dir = find_claude_projects()
    if not claude_projects_dir:
        return
    
    break_cutoff_str = f" (with {args.break_cutoff}min break cutoff)" if args.break_cutoff > 0 else ""
    round_str = f", {args.round}min time rounding" if args.round > 0 else ""
    print(f"Claude Code Work Period Timesheet{break_cutoff_str}{round_str}")
    print("=" * 70)
    
    # Collect all messages across all projects
    print("Collecting messages from all Claude Code projects...")
    all_messages = collect_all_messages(claude_projects_dir)
    
    if not all_messages:
        print("No messages found in Claude Code logs.")
        return
    
    print(f"Found {len(all_messages)} total messages across all projects.")
    
    # Group messages into work periods
    work_periods_messages = group_messages_into_work_periods(all_messages, args.break_cutoff)
    
    # Create work period summaries
    work_periods = []
    for i, period_messages in enumerate(work_periods_messages):
        period_summary = create_work_period_summary(period_messages, i)
        if period_summary:
            work_periods.append(period_summary)
    
    print(f"Grouped into {len(work_periods)} work periods.")
    
    # Apply filters and rounding
    filtered_periods = []
    for period in work_periods:
        # Filter by minimum duration (using original unrounded duration)
        if period['duration_hours'] < args.min_duration:
            continue
            
        # Filter by date if specified
        if args.date:
            try:
                filter_date = datetime.strptime(args.date, '%Y-%m-%d').date()
                if period['start_time'].date() != filter_date:
                    continue
            except ValueError:
                print(f"Invalid date format: {args.date}. Use YYYY-MM-DD")
                return
        
        # Apply time rounding for all calculations and display (after filtering)
        if args.round > 0:
            original_start = period['start_time']
            original_end = period['end_time']
            
            # Round both start and end times to nearest increment
            rounded_start = round_time_to_increment(period['start_time'], args.round)
            rounded_end = round_time_to_increment(period['end_time'], args.round)
            
            # Update period with rounded times
            period['start_time'] = rounded_start
            period['end_time'] = rounded_end
            period['duration_hours'] = (rounded_end - rounded_start).total_seconds() / 3600
            
            if args.debug:
                print(f"DEBUG: Rounded {original_start.strftime('%H:%M')}-{original_end.strftime('%H:%M')} -> {rounded_start.strftime('%H:%M')}-{rounded_end.strftime('%H:%M')} ({period['duration_hours']:.2f}h)")
        
        filtered_periods.append(period)
    
    # Calculate total hours
    total_hours = sum(period['duration_hours'] for period in filtered_periods)
    
    # Print results
    if args.hours:
        # Compact format - don't show individual periods, just totals
        print(f"\nTotal Work Periods: {len(filtered_periods)}")
        print(f"Total Hours: {total_hours:.2f}")
    else:
        # Detailed format - show individual work periods
        for period in filtered_periods:
            print(f"\nWork Period: {period['period_id']}")
            print(f"Directory: {period['working_directory']}")
            if len(period['all_working_dirs']) > 1:
                print(f"All Directories: {', '.join(period['all_working_dirs'])}")
            print(f"Start: {period['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"End: {period['end_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Duration: {period['duration_hours']:.2f} hours")
            print(f"Messages: {period['message_count']}")
            print(f"Claude Sessions: {period['session_count']}")
        
        print(f"\n{'='*70}")
        print(f"Total Work Periods: {len(filtered_periods)}")
        print(f"Total Hours: {total_hours:.2f}")
    
    # Always show daily breakdown with time ranges when using --hours mode
    daily_periods = {}
    for period in filtered_periods:
        date_key = period['start_time'].date()
        if date_key not in daily_periods:
            daily_periods[date_key] = []
        daily_periods[date_key].append(period)
    
    if len(daily_periods) > 1 or args.hours:
        print(f"\nDaily Breakdown:")
        print("-" * 40)
        for date, day_periods in sorted(daily_periods.items()):
            day_total = sum(p['duration_hours'] for p in day_periods)
            if args.hours:
                # Show time ranges in breakdown when --hours is used
                time_ranges = []
                for period in day_periods:
                    start_str = period['start_time'].strftime('%H:%M')
                    end_str = period['end_time'].strftime('%H:%M')
                    time_ranges.append(f"{start_str}-{end_str}")
                print(f"{date}: {day_total:05.2f}h | {' | '.join(time_ranges)}")
            else:
                # Regular daily breakdown without time ranges
                print(f"{date}: {day_total:.2f} hours")

if __name__ == "__main__":
    main()
