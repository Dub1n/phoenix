import json
import sys
import subprocess
import re

try:
    input_data = json.loads(sys.stdin.read())
except json.JSONDecodeError as e:
    print(f"Error: {e}")
    sys.exit(1)

tool_input = input_data.get("tool_input")
file_path = tool_input.get("file_path")

if re.search(r"\.(ts|tsx)$", file_path):
    try:
        subprocess.run(
            [
                "npx",
                "tsc",
                "--noEmit",
                "--skipLibCheck",
                ".",
                file_path
            ],
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError as e:
        print("Typescript errors detected - please review the errors before continuing.", file=sys.stderr)
        if e.stdout:
            print(e.stdout, file=sys.stderr)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        sys.exit(2)