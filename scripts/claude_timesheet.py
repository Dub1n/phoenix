#!/usr/bin/env python3
"""
Claude Code Timesheet Extractor
Extracts session durations from Claude Code logs for timesheet purposes.
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone
import sys

def parse_timestamp(timestamp_str):
    """Parse ISO timestamp string to datetime object."""
    return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

def process_session_file(file_path):
    """Process a single JSONL session file and return session info."""
    messages = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        if 'timestamp' in data and 'type' in data:
                            messages.append(data)
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None
    
    if not messages:
        return None
    
    # Sort by timestamp
    messages.sort(key=lambda x: x['timestamp'])
    
    start_time = parse_timestamp(messages[0]['timestamp'])
    end_time = parse_timestamp(messages[-1]['timestamp'])
    duration = end_time - start_time
    
    # Get session info
    session_id = messages[0].get('sessionId', 'unknown')
    working_dir = messages[0].get('cwd', 'unknown')
    
    return {
        'session_id': session_id,
        'working_directory': working_dir,
        'start_time': start_time,
        'end_time': end_time,
        'duration_hours': duration.total_seconds() / 3600,
        'message_count': len(messages),
        'file_path': str(file_path)
    }

def find_claude_projects():
    """Find Claude projects directory."""
    claude_dir = Path.home() / '.claude' / 'projects'
    if not claude_dir.exists():
        print("Claude projects directory not found at ~/.claude/projects")
        return None
    return claude_dir

def main():
    claude_projects_dir = find_claude_projects()
    if not claude_projects_dir:
        return
    
    print("Claude Code Session Timesheet")
    print("=" * 50)
    
    total_hours = 0
    sessions = []
    
    # Process all JSONL files in all project directories
    for project_dir in claude_projects_dir.iterdir():
        if project_dir.is_dir():
            for jsonl_file in project_dir.glob('*.jsonl'):
                session_info = process_session_file(jsonl_file)
                if session_info:
                    sessions.append(session_info)
    
    # Sort sessions by start time
    sessions.sort(key=lambda x: x['start_time'])
    
    # Print results
    for session in sessions:
        print(f"\nSession: {session['session_id'][:8]}...")
        print(f"Directory: {session['working_directory']}")
        print(f"Start: {session['start_time'].strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print(f"End: {session['end_time'].strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print(f"Duration: {session['duration_hours']:.2f} hours")
        print(f"Messages: {session['message_count']}")
        total_hours += session['duration_hours']
    
    print(f"\n{'='*50}")
    print(f"Total Sessions: {len(sessions)}")
    print(f"Total Hours: {total_hours:.2f}")
    
    # Group by date for daily breakdown
    daily_hours = {}
    for session in sessions:
        date_key = session['start_time'].date()
        if date_key not in daily_hours:
            daily_hours[date_key] = 0
        daily_hours[date_key] += session['duration_hours']
    
    print(f"\nDaily Breakdown:")
    print("-" * 30)
    for date, hours in sorted(daily_hours.items()):
        print(f"{date}: {hours:.2f} hours")

if __name__ == "__main__":
    main()
