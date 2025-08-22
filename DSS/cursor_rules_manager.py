#!/usr/bin/env python3
"""---
tags: [cursor, automation, assistant, rules_management]
provides: [cursor_rules_sync, dss_assistant_propagation]
requires: [meta/dss_config.yml]
---"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Optional, List
import tempfile
import shutil

class CursorRulesManager:
    """Manages Cursor rules for DSS-ified repositories"""
    
    def __init__(self, repo_root: str = ".", github_repo: str = "Dub1n/dss"):
        self.repo_root = Path(repo_root).resolve()
        self.github_repo = github_repo
        self.github_base = f"https://raw.githubusercontent.com/{github_repo}/main"
        self.cursor_rules_dir = self.repo_root / ".cursor" / "rules"
        
    def ensure_cursor_rules_dir(self):
        """Ensure .cursor/rules directory exists"""
        self.cursor_rules_dir.mkdir(parents=True, exist_ok=True)
        
    def download_file(self, github_path: str, local_path: Path) -> bool:
        """Download a file from GitHub"""
        try:
            url = f"{self.github_base}/{github_path}"
            print(f"Downloading {url}...")
            with urllib.request.urlopen(url) as response:
                content = response.read()
            
            with open(local_path, 'wb') as f:
                f.write(content)
            print(f"✅ Downloaded {local_path.name}")
            return True
            
        except urllib.error.URLError as e:
            print(f"❌ Failed to download {github_path}: {e}")
            return False
    
    def get_local_version(self, filename: str) -> Optional[str]:
        """Get version/timestamp from local file"""
        file_path = self.cursor_rules_dir / filename
        if not file_path.exists():
            return None
        
        # Look for version comment in file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if "<!-- DSS_VERSION:" in content:
                    start = content.find("<!-- DSS_VERSION:") + 17
                    end = content.find("-->", start)
                    return content[start:end].strip()
        except:
            pass
        
        return file_path.stat().st_mtime
    
    def needs_update(self, filename: str) -> bool:
        """Check if file needs updating from GitHub"""
        # For now, always check for updates
        # Could implement version checking later
        return True
    
    def sync_core_rules(self, force: bool = False) -> Dict[str, bool]:
        """Sync core DSS rules from GitHub"""
        self.ensure_cursor_rules_dir()
        
        core_files = {
            "assistant.mdc": ".cursor/rules/assistant.mdc",
            "dss-overview.mdc": ".cursor/rules/dss-overview.mdc", 
            "dss-guide.mdc": ".cursor/rules/dss-guide.mdc",
            "dss-config.mdc": ".cursor/rules/dss-config.mdc"
        }
        
        results = {}
        
        for local_name, github_path in core_files.items():
            local_path = self.cursor_rules_dir / local_name
            
            if force or self.needs_update(local_name):
                results[local_name] = self.download_file(github_path, local_path)
            else:
                print(f"⏭️  {local_name} is up to date")
                results[local_name] = True
        
        return results
    
    def create_project_context(self, project_type: str = "general", 
                             custom_config: Dict = None) -> bool:
        """Create project-specific context file"""
        
        context_content = f"""# Project-Specific DSS Context

## Project Configuration
- **Project Type**: {project_type}
- **Repository**: {self.repo_root.name}
- **DSS Integration**: Active

## Custom Project Rules

### Project Structure
- Follow DSS conventions with project-specific adaptations
- Maintain frontmatter in all documentation and code files
- Use templates from meta/templates/ when creating new files

### Assistant Behavior
- Prioritize project-specific templates and configurations
- Reference project documentation in INDEX.md
- Follow project naming conventions in meta/dss_config.yml

<!-- DSS_VERSION: {self._get_current_timestamp()} -->
"""
        
        if custom_config:
            context_content += f"\n### Custom Configuration\n"
            for key, value in custom_config.items():
                context_content += f"- **{key}**: {value}\n"
        
        context_path = self.cursor_rules_dir / "project_context.mdc"
        
        try:
            with open(context_path, 'w', encoding='utf-8') as f:
                f.write(context_content)
            print(f"✅ Created {context_path}")
            return True
        except Exception as e:
            print(f"❌ Failed to create project context: {e}")
            return False
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp for version tracking"""
        import datetime
        return datetime.datetime.now().isoformat()
    
    def install_update_script(self) -> bool:
        """Install update script for periodic sync"""
        
        update_script = f'''#!/usr/bin/env python3
"""Auto-generated DSS Cursor rules updater"""

import subprocess
import sys
from pathlib import Path

def main():
    """Update DSS Cursor rules from GitHub"""
    try:
        # Download and run the cursor rules manager
        import urllib.request
        import tempfile
        
        url = "https://raw.githubusercontent.com/{self.github_repo}/main/meta/scripts/cursor_rules_manager.py"
        
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as tmp:
            with urllib.request.urlopen(url) as response:
                tmp.write(response.read().decode())
            tmp_path = tmp.name
        
        # Run the manager
        result = subprocess.run([sys.executable, tmp_path, "sync"], 
                               capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        
        # Cleanup
        Path(tmp_path).unlink()
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Update failed: {{e}}")
        return False

if __name__ == "__main__":
    main()
'''
        
        script_path = self.cursor_rules_dir / "update_dss_rules.py"
        
        try:
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(update_script)
            
            # Make executable on Unix-like systems
            if os.name != 'nt':
                script_path.chmod(0o755)
            
            print(f"✅ Installed update script at {script_path}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to install update script: {e}")
            return False
    
    def check_compatibility(self) -> Dict[str, any]:
        """Check if the repository is DSS-compatible"""
        checks = {
            "has_dss_config": (self.repo_root / "meta" / "dss_config.yml").exists(),
            "has_index": (self.repo_root / "INDEX.md").exists(),
            "has_meta_dir": (self.repo_root / "meta").exists(),
            "has_docs_dir": (self.repo_root / "docs").exists(),
        }
        
        compatibility_score = sum(checks.values()) / len(checks)
        
        return {
            "checks": checks,
            "score": compatibility_score,
            "compatible": compatibility_score >= 0.5
        }

def main():
    """CLI interface for Cursor rules management"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage DSS Cursor rules")
    parser.add_argument("action", choices=["sync", "install", "check", "update"],
                       help="Action to perform")
    parser.add_argument("--force", action="store_true", 
                       help="Force update even if files are current")
    parser.add_argument("--project-type", default="general",
                       help="Project type for context")
    parser.add_argument("--repo-root", default=".",
                       help="Repository root directory")
    
    args = parser.parse_args()
    
    manager = CursorRulesManager(args.repo_root)
    
    if args.action == "check":
        compat = manager.check_compatibility()
        print(f"DSS Compatibility: {compat['score']:.1%}")
        for check, result in compat['checks'].items():
            status = "✅" if result else "❌"
            print(f"{status} {check}")
        
        if not compat['compatible']:
            print("\n⚠️  Repository may not be fully DSS-compatible")
            print("Consider running DSS auto-formatter first")
    
    elif args.action == "install":
        print("Installing DSS Cursor rules...")
        
        # Check compatibility first
        compat = manager.check_compatibility()
        if not compat['compatible']:
            print("⚠️  Warning: Repository may not be DSS-compatible")
            response = input("Continue anyway? (y/N): ")
            if response.lower() != 'y':
                sys.exit(1)
        
        # Sync core rules
        results = manager.sync_core_rules(args.force)
        
        # Create project context
        manager.create_project_context(args.project_type)
        
        # Install update script
        manager.install_update_script()
        
        success_count = sum(results.values())
        total_count = len(results)
        
        print(f"\n✅ Installation complete: {success_count}/{total_count} files synced")
        print("\n🎯 Your repository now has DSS assistant intelligence!")
        print("   The AI assistant will understand DSS conventions and workflows.")
        print(f"   Run 'python .cursor/rules/update_dss_rules.py' to update rules.")
        
    elif args.action in ["sync", "update"]:
        print("Syncing DSS Cursor rules...")
        results = manager.sync_core_rules(args.force)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        print(f"\n✅ Sync complete: {success_count}/{total_count} files updated")

if __name__ == "__main__":
    main() 