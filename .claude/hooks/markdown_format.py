import json
import sys
import subprocess
import re
import os
from pathlib import Path

try:
    input_data = json.loads(sys.stdin.read())
except json.JSONDecodeError as e:
    print(f"Error: {e}")
    sys.exit(1)

tool_input = input_data.get("tool_input")
file_path = tool_input.get("file_path")

def find_markdownlint():
    """Find markdownlint CLI with fallback strategies"""
    import platform
    import os
    
    is_windows = platform.system() == "Windows"
    
    # Strategy 1: Try npx markdownlint-cli2 (preferred - newer version)
    try:
        result = subprocess.run(["npx", "markdownlint-cli2", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return ["npx", "markdownlint-cli2"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 2: Try npx markdownlint (original version)
    try:
        result = subprocess.run(["npx", "markdownlint", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return ["npx", "markdownlint"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 3: Try direct markdownlint-cli2 command
    try:
        result = subprocess.run(["markdownlint-cli2", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return ["markdownlint-cli2"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 4: Try direct markdownlint command
    try:
        result = subprocess.run(["markdownlint", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return ["markdownlint"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 5: Try local node_modules
    if is_windows:
        local_paths = [
            Path("node_modules/.bin/markdownlint-cli2.cmd"),
            Path("node_modules/.bin/markdownlint.cmd")
        ]
    else:
        local_paths = [
            Path("node_modules/.bin/markdownlint-cli2"),
            Path("node_modules/.bin/markdownlint")
        ]
    
    for local_path in local_paths:
        if local_path.exists():
            return [str(local_path)]
    
    # Strategy 6: Windows-specific paths
    if is_windows:
        tools_and_commands = [
            ("markdownlint-cli2", "markdownlint-cli2"),
            ("markdownlint", "markdownlint")
        ]
        
        for tool_name, cmd_name in tools_and_commands:
            windows_paths = [
                # Tools directory (our fallback)
                f"C:\\tools\\{cmd_name}.cmd",
                f"C:\\tools\\{cmd_name}.ps1",
                # nvm4w location
                f"C:\\nvm4w\\nodejs\\{cmd_name}.cmd",
                f"C:\\nvm4w\\nodejs\\{cmd_name}.ps1", 
                f"C:\\nvm4w\\nodejs\\{cmd_name}",
                # Standard npm global
                os.path.expanduser(f"~\\AppData\\Roaming\\npm\\{cmd_name}.cmd"),
                os.path.expanduser(f"~\\AppData\\Roaming\\npm\\{cmd_name}.ps1"),
                # Alternative npm global
                os.path.expanduser(f"~\\AppData\\Local\\npm\\{cmd_name}.cmd"),
                # Check Program Files
                f"C:\\Program Files\\nodejs\\{cmd_name}.cmd",
                f"C:\\Program Files (x86)\\nodejs\\{cmd_name}.cmd",
                # Chocolatey
                f"C:\\ProgramData\\chocolatey\\bin\\{cmd_name}.exe",
                # Yarn global
                os.path.expanduser(f"~\\AppData\\Local\\Yarn\\bin\\{cmd_name}.cmd"),
            ]
            
            for markdown_path in windows_paths:
                if Path(markdown_path).exists():
                    try:
                        result = subprocess.run([markdown_path, "--version"], 
                                              capture_output=True, text=True, timeout=5)
                        if result.returncode == 0:
                            return [markdown_path]
                    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                        continue
    
    # Strategy 7: Unix-like systems global paths
    else:
        for tool_name in ["markdownlint-cli2", "markdownlint"]:
            unix_paths = [
                f"/usr/local/bin/{tool_name}",
                f"/usr/bin/{tool_name}",
                os.path.expanduser(f"~/.npm-global/bin/{tool_name}"),
                os.path.expanduser(f"~/.local/bin/{tool_name}"),
            ]
            
            for markdown_path in unix_paths:
                if Path(markdown_path).exists():
                    try:
                        result = subprocess.run([markdown_path, "--version"], 
                                              capture_output=True, text=True, timeout=5)
                        if result.returncode == 0:
                            return [markdown_path]
                    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                        continue
    
    # Strategy 8: Check if we're in a project and suggest installation
    if Path("package.json").exists():
        print("markdownlint not found. Try: npm install markdownlint-cli2", file=sys.stderr)
    else:
        print("markdownlint not found. Install with: npm install -g markdownlint-cli2", file=sys.stderr)
    
    return None

def find_prettier():
    """Find Prettier as a fallback for markdown formatting"""
    import platform
    import os
    
    is_windows = platform.system() == "Windows"
    
    # Strategy 1: Try npx prettier
    try:
        result = subprocess.run(["npx", "prettier", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return ["npx", "prettier"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 2: Try direct prettier command
    try:
        result = subprocess.run(["prettier", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return ["prettier"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 3: Try local node_modules
    if is_windows:
        local_prettier = Path("node_modules/.bin/prettier.cmd")
    else:
        local_prettier = Path("node_modules/.bin/prettier")
    
    if local_prettier.exists():
        return [str(local_prettier)]
    
    return None

# Check for markdown files
if re.search(r"\.(md|mdx|markdown)$", file_path):
    has_issues = False
    
    # Try markdownlint first (preferred for markdown-specific linting)
    markdownlint_cmd = find_markdownlint()
    
    if markdownlint_cmd:
        try:
            # Use --fix flag to automatically fix issues
            cmd_args = markdownlint_cmd + ["--fix", file_path]
            
            result = subprocess.run(
                cmd_args,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # markdownlint returns 0 even when it fixes issues
            if result.returncode == 0:
                if result.stdout.strip():
                    print(f"Markdown document formatted with markdownlint-cli2", file=sys.stderr)
            else:
                # Extract line numbers from error output for concise reporting
                error_lines = []
                if result.stderr:
                    import re
                    line_matches = re.findall(r'(\d+):', result.stderr)
                    if line_matches:
                        error_lines = sorted(list(set(line_matches)))
                
                if error_lines:
                    print(f"markdown linting errors on lines {', '.join(error_lines)}", file=sys.stderr)
                else:
                    print("markdown linting errors detected", file=sys.stderr)
                has_issues = True
                
        except subprocess.TimeoutExpired:
            print("markdownlint check timed out - skipping", file=sys.stderr)
        except FileNotFoundError:
            markdownlint_cmd = None
    
    # Fallback to Prettier if markdownlint not available
    if not markdownlint_cmd:
        prettier_cmd = find_prettier()
        
        if prettier_cmd:
            try:
                # Use prettier to format markdown
                subprocess.run(
                    prettier_cmd + ["--write", "--parser=markdown", file_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                print(f"Markdown document formatted with Prettier", file=sys.stderr)
                
            except subprocess.TimeoutExpired:
                print("Prettier formatting timed out - skipping", file=sys.stderr)
            except subprocess.CalledProcessError as e:
                print("Prettier formatting failed:", file=sys.stderr)
                if e.stdout:
                    print(e.stdout, file=sys.stderr)
                if e.stderr:
                    print(e.stderr, file=sys.stderr)
                has_issues = True
            except FileNotFoundError:
                pass
        else:
            pass
    
    # Exit with error only if there were unfixable issues
    if has_issues:
        sys.exit(2)
    else:
        # Success - file was formatted or no issues found
        sys.exit(0)