import csv
import re
from datetime import datetime, timedelta

# Paste your raw time log data inside the triple quotes below.
# Each line should represent a single day's entries.
raw_data = """
2025-06-02: 00.50h | 16:00-16:30 (DSS)
2025-06-05: 00.50h | 23:15-23:45 (DSS)
2025-06-06: 00.25h | 10:00-10:15 (DSS)
2025-07-14: 03.75h | 11:30-13:00 (Cursor) | 14:15-16:30 (Cursor)
2025-07-15: 03.75h | 10:45-14:30 (Cursor)
2025-07-16: 01.50h | 15:15-16:15 (Cursor) | 17:15-17:45 (Cursor)
2025-07-17: 02.75h | 11:15-12:45 (Cursor) | 16:45-18:00 (Cursor)
2025-07-18: 04.50h | 12:30-17:00 (Cursor)
2025-07-21: 04.75h | 12:15-14:15 (Cursor) | 15:30-18:15 (Cursor)
2025-07-23: 01.00h | 14:15-14:30 (QRMaker) | 16:45-17:30 (QRMaker)
2025-07-24: 03.50h | 13:45-17:15 (Cursor)
2025-07-25: 02.75h | 12:30-13:00 (Cursor) | 14:30-15:00 (Cursor) | 17:15-19:00 (Cursor)    
2025-07-28: 02.50h | 16:30-17:15 (Phoenix) | 19:00-20:00 (.claude) | 21:45-22:30 (Cursor)  
2025-07-29: 02.75h | 15:30-17:30 (Phoenix-Reorg) | 18:30-19:15 (Phoenix-Reorg)
2025-07-30: 02.50h | 17:45-19:00 (Cursor) | 22:15-22:45 (Phoenix-Reorg) | 23:45-00:30 (Phoenix-Reorg)
2025-07-31: 01.00h | 02:00-02:30 (Phoenix-Reorg) | 23:15-23:45 (phoenix-code-lite)
2025-08-01: 04.00h | 11:45-12:00 (phoenix-code-lite) | 15:30-18:00 (Phoenix-Reorg) | 21:00-22:15 (phoenix-code-lite)
2025-08-02: 03.00h | 11:45-14:00 (phoenix-code-lite) | 18:00-18:45 (phoenix-code-lite)     
2025-08-03: 09.50h | 14:00-17:45 (phoenix-code-lite) | 19:30-01:15 (phoenix-code-lite)     
2025-08-04: 07.00h | 09:00-13:15 (phoenix-code-lite) | 14:45-15:30 (phoenix-code-lite) | 16:45-18:45 (Cursor)
2025-08-05: 02.25h | 08:45-09:45 (Cursor) | 11:30-11:45 (Cursor) | 15:15-16:15 (Cursor)    
2025-08-06: 05.50h | 11:00-11:30 (phoenix-code-lite) | 15:45-16:15 (scripts) | 20:15-00:45 (phoenix-code-lite)
2025-08-12: 06.25h | 13:00-14:15 (Cursor) | 15:15-19:45 (phoenix-code-lite) | 22:30-23:00 (Cursor)
2025-08-13: 07.50h | 11:30-16:15 (phoenix-code-lite) | 20:45-23:30 (Cursor)
2025-08-14: 15.75h | 00:45-01:30 (Haruspex) | 07:15-15:00 (Haruspex) | 17:15-00:30 (Cursor)
2025-08-15: 06.50h | 10:15-12:00 (scripts) | 16:30-17:45 (Haruspex) | 19:00-22:30 (Haruspex)
2025-08-19: 06.75h | 09:00-13:00 (Cursor) | 16:00-17:15 (Haruspex) | 18:15-19:45 (Haruspex)
2025-08-20: 03.50h | 16:15-17:00 (DSS) | 19:00-19:15 (Cursor) | 23:15-01:45 (Haruspex)     
2025-08-21: 07.25h | 09:45-11:15 (Cursor) | 13:15-16:15 (Haruspex) | 18:30-20:15 (Cursor) | 22:00-23:00 (Haruspex)
2025-08-22: 02.75h | 01:15-01:30 (Haruspex) | 10:15-12:45 (Cursor)
2025-08-28: 04.50h | 19:45-21:45 (Templum) | 23:15-01:45 (Templum)
2025-08-29: 01.75h | 11:45-12:00 (Templum) | 18:00-19:00 (Templum) | 21:15-21:30 (phoenix-code-lite) | 23:30-23:45 (Templum)
2025-08-30: 07.25h | 00:45-01:15 (Haruspex) | 10:00-16:45 (Haruspex)
2025-08-31: 04.25h | 00:15-02:15 (Haruspex) | 09:00-10:15 (Haruspex) | 21:45-22:45 (Templum)
2025-09-01: 00.50h | 13:45-14:15 (Templum)
2025-09-02: 09.00h | 09:00-12:00 (Templum) | 13:15-15:15 (Templum) | 20:15-00:15 (Templum) 
2025-09-03: 07.25h | 13:15-15:30 (Haruspex) | 17:30-18:00 (Templum) | 19:30-00:00 (phoenix-code-lite)
2025-09-04: 08.25h | 08:45-13:15 (Templum) | 16:00-17:30 (Templum) | 19:45-20:45 (Templum) | 22:45-00:00 (Templum)
2025-09-05: 02.00h | 07:30-08:45 (Templum) | 18:30-19:00 (prompts) | 23:30-23:45 (Templum) 
2025-09-06: 06.50h | 01:45-03:00 (phoenix-code-lite) | 08:15-09:45 (Templum) | 11:30-12:00 (scripts) | 15:30-17:15 (scripts) | 20:00-21:30 (Templum)
2025-09-07: 01.00h | 16:30-17:15 (scripts) | 21:30-21:45 (Templum)
2025-09-08: 01.75h | 01:30-02:00 (Templum) | 11:00-11:30 (trial-run) | 12:30-13:15 (scripts)
2025-09-10: 03.75h | 00:45-01:00 (scripts) | 10:45-14:15 (scripts)
2025-09-11: 05.00h | 01:00-02:45 (Templum) | 12:45-13:45 (Templum) | 15:45-16:45 (Templum) | 20:30-21:45 (Templum)
2025-09-12: 04.50h | 01:45-02:00 (Templum) | 09:15-09:45 (Templum) | 12:15-12:45 (Templum) | 17:30-20:45 (Templum)
2025-09-13: 05.50h | 03:15-04:30 (Haruspex) | 10:45-11:00 (Templum) | 12:00-13:30 (Templum) | 15:30-16:45 (Templum) | 22:45-00:00 (Templum)
2025-09-14: 01.50h | 12:15-13:45 (Templum)
"""
output_filename = 'timesheet_1.csv'

def calculate_duration(start_str, end_str):
    """Calculates duration in hours between two HH:MM time strings, handling overnight shifts."""
    time_format = '%H:%M'
    start_time = datetime.strptime(start_str, time_format)
    end_time = datetime.strptime(end_str, time_format)

    # If the end time is earlier than the start time, it's an overnight entry
    if end_time < start_time:
        end_time += timedelta(days=1)

    duration = end_time - start_time
    return duration.total_seconds() / 3600

def parse_log_data(data):
    """Parses the raw log data string and yields structured rows."""
    # Regex to find individual time entries like HH:MM-HH:MM (Project)
    entry_pattern = re.compile(r'(\d{2}:\d{2})-(\d{2}:\d{2}) \((.*?)\)')

    for line in data.strip().split('\n'):
        if not line:
            continue

        try:
            # Split the line to isolate the date and the time entries part
            date_part, entries_part = line.split(':', 1)
            date_str = date_part.strip()

            # Find all matching time entries in the second part of the string
            matches = entry_pattern.findall(entries_part)
            
            for match in matches:
                start_time, end_time, project = match
                duration_hours = calculate_duration(start_time, end_time)
                
                yield [date_str, project, start_time, end_time, f"{duration_hours:.2f}"]

        except ValueError as e:
            print(f"Skipping malformed line: '{line}' -> Error: {e}")
            continue

def main():
    """Main function to run the script."""
    # The header for the CSV file
    header = ['Date', 'Project', 'Start Time', 'End Time', 'Duration (Hours)']
    
    # Process the data
    parsed_entries = list(parse_log_data(raw_data))

    # Write to CSV
    try:
        with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(header)
            writer.writerows(parsed_entries)
        
        print(f"Successfully created '{output_filename}' with {len(parsed_entries)} entries.")

    except IOError as e:
        print(f"Error writing to file '{output_filename}': {e}")


# Run the script
if __name__ == '__main__':
    main()
