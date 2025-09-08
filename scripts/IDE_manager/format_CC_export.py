#!/usr/bin/env python3
"""
Script to fix formatting of exported chat log.
Removes line number prefixes and joins continuation lines.
"""

import re
import os

def fix_formatting(input_file, output_file):
    """
    Fix formatting by removing line number prefixes and joining continuation lines.
    
    Args:
        input_file (str): Path to the input file
        output_file (str): Path to the output file
    """
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return False
    
    if os.path.exists(output_file):
        print(f"Output file '{output_file}' already exists. Overwriting...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
        
        cleaned_lines = []
        
        for line in lines:
            # Remove trailing newline for processing
            line = line.rstrip('\n')
            
            # Check if line has a line number (format: "          3 -  content")
            # Pattern: spaces, digit(s), space, hyphen, space
            numbered_line_pattern = r'^\s+\d+\s-\s'
            
            if re.match(numbered_line_pattern, line):
                # This is a numbered line - remove everything up to and including " - "
                cleaned_content = re.sub(numbered_line_pattern, '', line)
                cleaned_lines.append(cleaned_content)
            else:
                # Check if this is a continuation line (format: "            - content")
                # Pattern: spaces, hyphen, space
                continuation_pattern = r'^\s+-\s'
                
                if re.match(continuation_pattern, line):
                    # This is a continuation line - remove prefix and join to previous line
                    cleaned_content = re.sub(continuation_pattern, '', line)
                    
                    if cleaned_lines:
                        # Join to the previous line with a space
                        cleaned_lines[-1] += ' ' + cleaned_content
                    else:
                        # No previous line to join to, just add as new line
                        cleaned_lines.append(cleaned_content)
                else:
                    # Line doesn't match either pattern, keep as is
                    cleaned_lines.append(line)
        
        # Write the cleaned content to the output file
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for line in cleaned_lines:
                # Strip leading whitespace from each line
                outfile.write(line.lstrip() + '\n')
        
        print(f"Successfully processed {len(lines)} input lines into {len(cleaned_lines)} output lines.")
        print(f"Cleaned content saved to: {output_file}")
        return True
        
    except Exception as e:
        print(f"Error processing file: {e}")
        return False

def test_script():
    """Test the script with a small sample."""
    test_input = """          1 -  # Test Header
            - continuation of header
          2 -  
          3 -  Some content here
            - more content on same line
            - even more content
          4 -  New paragraph"""
    
    print("Testing with sample input:")
    print("Sample with numbered lines and continuation lines...")
    print("\n" + "="*50 + "\n")
    
    # Write test file
    with open('test_input.txt', 'w', encoding='utf-8') as f:
        f.write(test_input)
    
    # Process test file
    if fix_formatting('test_input.txt', 'test_output.txt'):
        # Show result
        with open('test_output.txt', 'r', encoding='utf-8') as f:
            result = f.read()
        print("Test result:")
        print(result)
        
        # Clean up test files
        os.remove('test_input.txt')
        os.remove('test_output.txt')
        
        return True
    return False

if __name__ == "__main__":
    print("Document Formatting Fixer")
    print("=" * 30)
    
    # Run test first
    print("Running test...")
    if not test_script():
        print("Test failed. Exiting.")
        exit(1)
    
    print("\nTest passed! Running on actual file...")
    
    input_file = "2025-08-28-caveat-the-messages-below-were-generated-by-the-u.txt"
    output_file = "2025-08-28-caveat-cleaned.txt"
    
    success = fix_formatting(input_file, output_file)
    
    if success:
        print("\nFormatting fix completed successfully!")
        print(f"Original file: {input_file} (preserved)")
        print(f"Cleaned file: {output_file}")
    else:
        print("\nFormatting fix failed. Please check the error messages above.")