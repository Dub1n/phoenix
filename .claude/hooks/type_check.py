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

def find_typescript_compiler():
    """Find TypeScript compiler with fallback strategies"""
    import platform
    import os
    
    is_windows = platform.system() == "Windows"
    
    # Strategy 1: Try npx (preferred - handles both local and global)
    try:
        result = subprocess.run(["npx", "tsc", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return ["npx", "tsc"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 2: Try direct tsc command
    try:
        result = subprocess.run(["tsc", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return ["tsc"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 3: Try local node_modules
    if is_windows:
        local_tsc = Path("node_modules/.bin/tsc.cmd")
    else:
        local_tsc = Path("node_modules/.bin/tsc")
    
    if local_tsc.exists():
        return [str(local_tsc)]
    
    # Strategy 4: Windows-specific paths (nvm4w, npm global, etc.)
    if is_windows:
        # Common Windows TypeScript locations (ordered by likelihood)
        windows_paths = [
            # Tools directory (our fallback)
            r"C:\tools\tsc.cmd",
            r"C:\tools\tsc.ps1",
            # nvm4w location (most likely for this user)
            r"C:\nvm4w\nodejs\tsc.cmd",
            r"C:\nvm4w\nodejs\tsc.ps1", 
            r"C:\nvm4w\nodejs\tsc",
            # Standard npm global
            os.path.expanduser(r"~\AppData\Roaming\npm\tsc.cmd"),
            os.path.expanduser(r"~\AppData\Roaming\npm\tsc.ps1"),
            # Alternative npm global
            os.path.expanduser(r"~\AppData\Local\npm\tsc.cmd"),
            # Check Program Files (sometimes Node.js is installed here)
            r"C:\Program Files\nodejs\tsc.cmd",
            r"C:\Program Files (x86)\nodejs\tsc.cmd",
            # Chocolatey
            r"C:\ProgramData\chocolatey\bin\tsc.exe",
            # Yarn global
            os.path.expanduser(r"~\AppData\Local\Yarn\bin\tsc.cmd"),
        ]
        
        for tsc_path in windows_paths:
            if Path(tsc_path).exists():
                try:
                    result = subprocess.run([tsc_path, "--version"], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        return [tsc_path]
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    continue
    
    # Strategy 5: Unix-like systems global paths
    else:
        unix_paths = [
            "/usr/local/bin/tsc",
            "/usr/bin/tsc",
            os.path.expanduser("~/.npm-global/bin/tsc"),
            os.path.expanduser("~/.local/bin/tsc"),
        ]
        
        for tsc_path in unix_paths:
            if Path(tsc_path).exists():
                try:
                    result = subprocess.run([tsc_path, "--version"], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        return [tsc_path]
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    continue
    
    # Strategy 6: Check if we're in a TypeScript project and suggest installation
    if Path("tsconfig.json").exists() or Path("package.json").exists():
        print("TypeScript compiler not found. Try: npm install typescript", file=sys.stderr)
    else:
        print("TypeScript compiler not found. Install with: npm install -g typescript", file=sys.stderr)
    
    return None

def find_eslint():
    """Find ESLint with fallback strategies"""
    import platform
    import os
    
    is_windows = platform.system() == "Windows"
    
    # Strategy 1: Try npx (preferred - handles both local and global)
    try:
        result = subprocess.run(["npx", "eslint", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return ["npx", "eslint"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 2: Try direct eslint command
    try:
        result = subprocess.run(["eslint", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return ["eslint"]
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Strategy 3: Try local node_modules
    if is_windows:
        local_eslint = Path("node_modules/.bin/eslint.cmd")
    else:
        local_eslint = Path("node_modules/.bin/eslint")
    
    if local_eslint.exists():
        return [str(local_eslint)]
    
    # Strategy 4: Windows-specific paths
    if is_windows:
        windows_paths = [
            # Tools directory (our fallback)
            r"C:\tools\eslint.cmd",
            r"C:\tools\eslint.ps1",
            # nvm4w location
            r"C:\nvm4w\nodejs\eslint.cmd",
            r"C:\nvm4w\nodejs\eslint.ps1", 
            r"C:\nvm4w\nodejs\eslint",
            # Standard npm global
            os.path.expanduser(r"~\AppData\Roaming\npm\eslint.cmd"),
            os.path.expanduser(r"~\AppData\Roaming\npm\eslint.ps1"),
            # Alternative npm global
            os.path.expanduser(r"~\AppData\Local\npm\eslint.cmd"),
            # Check Program Files
            r"C:\Program Files\nodejs\eslint.cmd",
            r"C:\Program Files (x86)\nodejs\eslint.cmd",
            # Chocolatey
            r"C:\ProgramData\chocolatey\bin\eslint.exe",
            # Yarn global
            os.path.expanduser(r"~\AppData\Local\Yarn\bin\eslint.cmd"),
        ]
        
        for eslint_path in windows_paths:
            if Path(eslint_path).exists():
                try:
                    result = subprocess.run([eslint_path, "--version"], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        return [eslint_path]
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    continue
    
    # Strategy 5: Unix-like systems global paths
    else:
        unix_paths = [
            "/usr/local/bin/eslint",
            "/usr/bin/eslint",
            os.path.expanduser("~/.npm-global/bin/eslint"),
            os.path.expanduser("~/.local/bin/eslint"),
        ]
        
        for eslint_path in unix_paths:
            if Path(eslint_path).exists():
                try:
                    result = subprocess.run([eslint_path, "--version"], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        return [eslint_path]
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    continue
    
    # Strategy 6: Check if we're in a project and suggest installation
    if Path("package.json").exists():
        print("ESLint not found. Try: npm install eslint", file=sys.stderr)
    else:
        print("ESLint not found. Install with: npm install -g eslint", file=sys.stderr)
    
    return None

# Check for TypeScript/JavaScript files
if re.search(r"\.(ts|tsx|js|jsx)$", file_path):
    has_errors = False
    
    # TypeScript type checking (for .ts/.tsx files)
    if re.search(r"\.(ts|tsx)$", file_path):
        tsc_cmd = find_typescript_compiler()
        
        if tsc_cmd:
            try:
                subprocess.run(
                    tsc_cmd + [
                        "--noEmit",
                        "--skipLibCheck",
                        file_path
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            except subprocess.TimeoutExpired:
                print("TypeScript type check timed out - skipping", file=sys.stderr)
            except subprocess.CalledProcessError as e:
                print("TypeScript errors detected - please review the errors before continuing.", file=sys.stderr)
                if e.stdout:
                    print(e.stdout, file=sys.stderr)
                if e.stderr:
                    print(e.stderr, file=sys.stderr)
                has_errors = True
            except FileNotFoundError:
                print("TypeScript compiler command not found - skipping type check", file=sys.stderr)
        else:
            print("TypeScript compiler not available - skipping type check", file=sys.stderr)
    
    # ESLint linting (for all JS/TS files)
    eslint_cmd = find_eslint()
    
    if eslint_cmd:
        try:
            subprocess.run(
                eslint_cmd + [
                    file_path
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=30
            )
        except subprocess.TimeoutExpired:
            print("ESLint check timed out - skipping", file=sys.stderr)
        except subprocess.CalledProcessError as e:
            print("ESLint errors detected - please review the errors before continuing.", file=sys.stderr)
            if e.stdout:
                print(e.stdout, file=sys.stderr)
            if e.stderr:
                print(e.stderr, file=sys.stderr)
            has_errors = True
        except FileNotFoundError:
            print("ESLint command not found - skipping lint check", file=sys.stderr)
    else:
        print("ESLint not available - skipping lint check", file=sys.stderr)
    
    # Exit with error if any validation failed
    if has_errors:
        sys.exit(2)