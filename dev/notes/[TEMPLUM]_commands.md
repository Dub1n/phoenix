# Project Commands

## Launch Templum

cd templum && npm run build
cd templum && node examples/minimal-backend/server.js
cd templum && node dist/src/index.js
cd templum && npm run start:cli
cd templum && npm run dev
cd templum && npm test
cd templum && npm run lint
cd templum && npm start

**for agent**:

Bash(cd C:/Users/gabri/Documents/Infotopology/VDL_Vault/Templum && node dist/src/cli-entry.js --status)

## Fix Template

cp "C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\templates\comprehensive-fix-template.md" "<Project>/dev/fixes/$(date +%Y-%m-%d-%H%M)-[{TASK-ID}]-{description}.md"

## File Tree

python scripts\export_tree.py "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum" --exclude "fixes/" --exclude ".husky/" --exclude ".validation-reports/" --exclude "archive/"

Features:

1. Command-line arguments:

    - directory - Path to export (defaults to current directory)
    - --exclude - Add custom exclude patterns (can be used multiple times)
    - --output or -o - Save to file instead of console
    - --no-defaults - Skip default exclude patterns

2. Gitignore-style pattern matching:

    - fixes/ - Excludes directories named "fixes"
    - .husky/ - Excludes ".husky" directories
    - *.log - Excludes all .log files
    - /dist - Excludes "dist" only at root level
    - temp* - Excludes anything starting with "temp"
    - Common gitignore patterns:
      - Directory-only patterns (folder/)
      - Root-relative patterns (/root-only)
      - Wildcards (*.ext, temp*)
      - Nested matching (**/pattern)

Usage Examples:

### Basic usage with custom excludes

python scripts/export_tree.py "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum"
--exclude "fixes/" --exclude ".husky/" --exclude "*.tmp"

### Export to file

python export_tree.py "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum"
--exclude "fixes/" -o templum-tree.txt

### Use only custom patterns (no defaults)

python export_tree.py --no-defaults --exclude "node_modules" --exclude "*.log"

### Current directory with defaults + custom patterns

python export_tree.py --exclude "temp*" --exclude "backup/"

## Power Rename

### To remove the seconds from YYYY-MM-DD-HHmmss

```regex
(?<=\d{4}-\d{2}-\d{2}-\d{2}\d{2})\d{2}(?=-.*\.md)
-> `` empty
```
