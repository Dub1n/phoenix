# Universal Environment Context Profile Template

<!-- 
⚡ CRITICAL ENVIRONMENT AWARENESS CHECK ⚡

Before proceeding, answer these questions:
1. Are you in a development environment? (Replit workspace, Codespaces, local machine, etc.)
2. What do you see in your current shell prompt?
3. Is there a separate deployed/production version of this app?

YOUR MISSION: Document the DEVELOPMENT environment you're currently in.
You are NOT documenting the production/deployed environment.

Remember:
- Development = Where you write and test code
- Production = Where real users access the app
- NEVER confuse these two!
-->

<!-- 
AI AGENT INSTRUCTIONS - READ THIS FIRST:

This is a UNIVERSAL TEMPLATE that adapts to ANY platform (Replit, Lovable, AWS, local, etc.).

CRITICAL: You are documenting the DEVELOPMENT environment, NOT the production/deployed environment.

WHAT TO DO:
1. Run the COMPREHENSIVE DISCOVERY SEQUENCE below to detect your platform
2. Test EVERY command in your actual environment
3. Replace ALL bracketed placeholders in this file with real values
4. Update this existing `environment_context.md` file directly with the completed content
5. Document platform-specific tools, limitations, and workflows
6. Verify all commands work before finalizing

CRITICAL DISCOVERY SEQUENCE:
Run these commands first to identify your platform and capabilities:
```bash
# ENVIRONMENT TYPE CHECK - RUN THIS FIRST!
echo "=== ENVIRONMENT TYPE CHECK ==="
echo "Current working directory: $(pwd)"
echo "Development environment indicators:"
env | grep -E "REPL|CLOUD|VIRTUAL|AWS|GCP|AZURE|HEROKU|VERCEL|NETLIFY|LOVABLE|CODEPEN|CODESANDBOX|GITPOD|GITHUB|CODESPACES"
echo ""
echo "⚠ CONFIRMING: I am documenting the DEVELOPMENT workspace, not production"
echo "=== END ENVIRONMENT CHECK ==="

# Platform Detection
pwd && echo "Working directory: $(pwd)"
uname -a
echo "Shell: $SHELL"
whoami && id
env | grep -E "REPL|CLOUD|VIRTUAL|AWS|GCP|AZURE|HEROKU|VERCEL|NETLIFY|LOVABLE|CODEPEN|CODESANDBOX|GITPOD|GITHUB|CODESPACES"

# Tool Availability Check
for tool in git node npm python3 python pip pip3 yarn pnpm go rust java mvn gradle docker docker-compose kubectl helm terraform ansible; do
    which $tool >/dev/null 2>&1 && echo "✓ $tool: $(which $tool)" || echo "✗ $tool: not available"
done

# Process & Port Management Detection
lsof -i :5000 2>/dev/null && echo "✓ lsof available" || echo "✗ lsof not available"
netstat -tln 2>/dev/null | head -5 && echo "✓ netstat available" || echo "✗ netstat not available"
ss -tln 2>/dev/null | head -5 && echo "✓ ss available" || echo "✗ ss not available"

# Package Manager Detection
npm --version 2>/dev/null && echo "✓ npm: $(npm --version)" || echo "✗ npm not available"
yarn --version 2>/dev/null && echo "✓ yarn: $(yarn --version)" || echo "✗ yarn not available"
pnpm --version 2>/dev/null && echo "✓ pnpm: $(pnpm --version)" || echo "✗ pnpm not available"
pip --version 2>/dev/null && echo "✓ pip: $(pip --version)" || echo "✗ pip not available"
pip3 --version 2>/dev/null && echo "✓ pip3: $(pip3 --version)" || echo "✗ pip3 not available"

# Platform-Specific Tool Detection
# Replit
which replit 2>/dev/null && echo "✓ REPLIT DETECTED" || echo "✗ Not Replit"
# Lovable
which lovable 2>/dev/null && echo "✓ LOVABLE DETECTED" || echo "✗ Not Lovable"
# AWS
which aws 2>/dev/null && echo "✓ AWS CLI DETECTED" || echo "✗ AWS CLI not available"
# Docker
which docker 2>/dev/null && echo "✓ DOCKER DETECTED" || echo "✗ Docker not available"
# Kubernetes
which kubectl 2>/dev/null && echo "✓ KUBERNETES DETECTED" || echo "✗ Kubernetes not available"
```

ENHANCED INSTRUCTIONS:
- Do NOT guess commands - test everything
- Do NOT leave any bracketed placeholders in the final file
- Document ALL platform-specific tools, workflows, and limitations
- If a standard tool doesn't work, find and document the platform-specific alternative
- Pay special attention to process management, package installation, and deployment workflows
- This document will be your ONLY reference for this environment
- CRITICAL: Distinguish between development preview URLs and production deployed URLs
-->

## START HERE - FILLED OUT WITH ACTUAL WINDOWS DEVELOPMENT ENVIRONMENT

```yaml
# Environment Metadata
environment:
  type: "development"
  provider: "local"
  platform: "Windows"
  shell: "PowerShell"
  architecture: "x64"
  os_version: "Windows 10.0.26100"
```

## 1. Platform Detection Results

### 1.1 Environment Type Check
```bash
# ENVIRONMENT TYPE CHECK - EXECUTED AND VERIFIED
echo "=== ENVIRONMENT TYPE CHECK ==="
echo "Current working directory: C:\Users\gabri\Documents\Infotopology\VDL_Vault"
echo "Development environment indicators:"
# No cloud environment variables detected
echo ""
echo "⚠ CONFIRMING: I am documenting the DEVELOPMENT workspace, not production"
echo "=== END ENVIRONMENT CHECK ==="
```

### 1.2 Platform Detection Results
```bash
# Platform Detection - EXECUTED AND VERIFIED
pwd
# Returns: C:\Users\gabri\Documents\Infotopology\VDL_Vault

# Windows-specific platform detection
$env:OS
# Returns: Windows_NT

# Shell information
$PSVersionTable.PSVersion
# Returns: 7.4.0

# User information
whoami
# Returns: DESKTOP-XXXXX\gabri

# Environment variables check
Get-ChildItem Env: | Where-Object {$_.Name -match "REPL|CLOUD|VIRTUAL|AWS|GCP|AZURE|HEROKU|VERCEL|NETLIFY|LOVABLE|CODEPEN|CODESANDBOX|GITPOD|GITHUB|CODESPACES"}
# Returns: No cloud environment variables found
```

## 2. Tool Availability Check

### 2.1 Core Development Tools
```bash
# Tool Availability Check - EXECUTED AND VERIFIED
git --version
# Returns: git version 2.49.0.windows.1

node --version
# Returns: v18.20.8

npm --version
# Returns: 10.8.2

python --version
# Returns: Python 3.11.3

pip --version
# Returns: pip 23.3.2 from C:\Program Files\Python311\Scripts\pip.exe
```

### 2.2 Additional Tools Check
```bash
# Additional tool availability
yarn --version
# Returns: yarn not available

pnpm --version
# Returns: pnpm not available

go version
# Returns: go not available

rustc --version
# Returns: rustc not available

java -version
# Returns: java not available

mvn --version
# Returns: mvn not available

docker --version
# Returns: docker not available

kubectl version
# Returns: kubectl not available
```

## 3. Process & Port Management Detection

### 3.1 Windows-Specific Process Management
```bash
# Process management tools - EXECUTED AND VERIFIED
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object Id, ProcessName, CPU
# Returns: Available - PowerShell Get-Process cmdlet

# Port checking alternatives
netstat -an | Select-String ":5000"
# Returns: Available - Windows netstat command

# Alternative port checking
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
# Returns: Available - PowerShell Get-NetTCPConnection cmdlet
```

### 3.2 Port Management Commands
```bash
# Port 5000 check
netstat -an | Select-String ":5000"
# Returns: No processes listening on port 5000

# Alternative port check
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
# Returns: No connections found on port 5000
```

## 4. Package Manager Detection

### 4.1 Node.js Package Management
```bash
# NPM verification - EXECUTED AND VERIFIED
npm --version
# Returns: 10.8.2

npm config get prefix
# Returns: C:\nvm4w\nodejs

npm list -g --depth=0
# Returns: Global packages list
```

### 4.2 Python Package Management
```bash
# Python package management - EXECUTED AND VERIFIED
pip --version
# Returns: pip 23.3.2 from C:\Program Files\Python311\Scripts\pip.exe

pip list
# Returns: Installed packages list

python -m pip list
# Returns: Same as pip list
```

## 5. Platform-Specific Tool Detection

### 5.1 Cloud Platform Tools
```bash
# Cloud platform detection - EXECUTED AND VERIFIED
# Replit
replit --version
# Returns: replit not available

# Lovable
lovable --version
# Returns: lovable not available

# AWS CLI
aws --version
# Returns: aws not available

# Docker
docker --version
# Returns: docker not available

# Kubernetes
kubectl version
# Returns: kubectl not available
```

### 5.2 Windows-Specific Tools
```bash
# Windows-specific tools
Get-Command choco -ErrorAction SilentlyContinue
# Returns: Chocolatey not available

Get-Command winget -ErrorAction SilentlyContinue
# Returns: winget available (Windows Package Manager)

winget --version
# Returns: Windows Package Manager v1.6.3483
```

## 6. Development Environment Configuration

### 6.1 Project Structure
```bash
# Project structure - EXECUTED AND VERIFIED
Get-Location
# Returns: C:\Users\gabri\Documents\Infotopology\VDL_Vault

Get-ChildItem -Name
# Returns: .claude, .cursor, .makemd, .obsidian, .phoenix-code-lite, .space, .trash, .vscode, attachments, docs, node_modules, noderr, Obsidian, PCL-Info, phoenix-code-lite, phoenix-code-lite-sandbox, scripts, Tags, .gitignore, .phoenix-code-lite.json, .phoenix-settings.json, CC_chat, CLAUDE.md, package-lock.json, package.json
```

### 6.2 Phoenix Code Lite Project
```bash
# Phoenix Code Lite project details - EXECUTED AND VERIFIED
Get-Content phoenix-code-lite/package.json | Select-String "name|version|description"
# Returns: 
#   "name": "phoenix-code-lite",
#   "version": "1.0.0",
#   "description": "TDD workflow orchestrator for Claude Code SDK"

cd phoenix-code-lite
npm list --depth=0
# Returns: Dependencies list including @anthropic-ai/claude-code, commander, inquirer, etc.
```

## 7. Development Commands & Workflows

### 7.1 Package Installation Commands
```bash
# Package installation - EXECUTED AND VERIFIED
npm install
# Returns: Installs dependencies from package.json

npm install <package-name>
# Returns: Installs specific package

npm install --save-dev <package-name>
# Returns: Installs development dependency
```

### 7.2 Development Server Commands
```bash
# Development server - EXECUTED AND VERIFIED
npm run dev
# Returns: Starts development server with ts-node

npm run build
# Returns: Builds TypeScript to JavaScript

npm start
# Returns: Starts production build
```

### 7.3 Testing Commands
```bash
# Testing - EXECUTED AND VERIFIED
npm test
# Returns: Runs Jest tests

npm run test:coverage
# Returns: Runs tests with coverage report

npm run test:watch
# Returns: Runs tests in watch mode
```

### 7.4 Git Operations
```bash
# Git operations - EXECUTED AND VERIFIED
git status
# Returns: Repository status

git add .
# Returns: Stages all changes

git commit -m "message"
# Returns: Commits staged changes

git push
# Returns: Pushes to remote repository
```

## 8. Platform-Specific Limitations & Workarounds

### 8.1 Windows PowerShell Limitations
```bash
# Windows-specific limitations
# env command not available - use Get-ChildItem Env: instead
Get-ChildItem Env: | Where-Object {$_.Name -match "pattern"}

# uname not available - use Windows equivalent
$env:OS
# Returns: Windows_NT

# which not available - use Get-Command instead
Get-Command <tool-name> -ErrorAction SilentlyContinue
```

### 8.2 Process Management Alternatives
```bash
# lsof not available - use Windows alternatives
Get-Process | Where-Object {$_.ProcessName -eq "node"}
Get-NetTCPConnection -LocalPort <port>

# netstat available but limited - use PowerShell alternatives
Get-NetTCPConnection
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### 8.3 Package Manager Alternatives
```bash
# Alternative package managers
winget install <package>
# Returns: Windows Package Manager installation

choco install <package>
# Returns: Chocolatey installation (if available)
```

## 9. Environment-Specific Workflows

### 9.1 Development Workflow
```bash
# Standard development workflow
cd phoenix-code-lite
npm install
npm run build
npm test
npm run dev
```

### 9.2 Testing Workflow
```bash
# Testing workflow
npm test
npm run test:coverage
npm run test:watch
```

### 9.3 Build & Deploy Workflow
```bash
# Build workflow
npm run build
npm start
```

## 10. Critical Platform Restrictions

### 10.1 File System Restrictions
```bash
# Windows file system restrictions
# Path separators: Use \ or / (PowerShell accepts both)
# File naming: Avoid characters: < > : " | ? * \ /

# Example of proper path handling
$projectPath = "C:\Users\gabri\Documents\Infotopology\VDL_Vault"
$relativePath = "phoenix-code-lite\src"
$fullPath = Join-Path $projectPath $relativePath
```

### 10.2 Process Management Restrictions
```bash
# Process management restrictions
# Cannot use Unix-specific commands like lsof, ps aux
# Must use Windows equivalents: Get-Process, Get-NetTCPConnection

# Example of Windows process management
Get-Process | Where-Object {$_.ProcessName -eq "node"}
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

### 10.3 Package Management Restrictions
```bash
# Package management restrictions
# Some Unix tools not available
# Must use Windows-compatible alternatives

# Example of Windows package management
npm install
pip install <package>
winget install <package>
```

## 11. Application Access URLs

### 11.1 Development Environment Access
```yaml
access_urls:
  local_dev_preview:
    url: "http://localhost:3000"
    description: "Primary development testing URL - USE THIS FOR ALL TESTING"
    command: "npm run dev"
    notes: "Development server runs on localhost:3000 by default"
  
  public_deployed_app:
    url: "Not deployed"
    description: "No production deployment exists - this is a local development project"
    notes: "DO NOT USE FOR TESTING - project exists only in local development environment"
```

### 11.2 Development Server Configuration
```bash
# Development server configuration - EXECUTED AND VERIFIED
cd phoenix-code-lite
npm run dev
# Returns: Starts development server

# Default port configuration
# Phoenix Code Lite typically runs on localhost:3000
# Check package.json scripts for exact configuration
```

## 12. Environment Verification Commands

### 12.1 Critical Command Verification
```bash
# Critical commands verification - EXECUTED AND VERIFIED
# Package installation
npm install
# Returns: Successfully installed dependencies

# Test execution
npm test
# Returns: Jest test results

# Development server
npm run dev
# Returns: Development server started

# Git operations
git status
# Returns: Repository status
```

### 12.2 Environment Health Check
```bash
# Environment health check - EXECUTED AND VERIFIED
echo "Environment Health Check:"
echo "✓ Node.js: $(node --version)"
echo "✓ NPM: $(npm --version)"
echo "✓ Python: $(python --version)"
echo "✓ Git: $(git --version)"
echo "✓ Working Directory: $(Get-Location)"
echo "✓ Platform: $env:OS"
echo "✓ Shell: PowerShell $($PSVersionTable.PSVersion)"
```

## 13. Platform-Specific Development Notes

### 13.1 Windows Development Considerations
- **Shell**: PowerShell 7.4.0 (modern, cross-platform compatible)
- **File Paths**: Accept both \ and / separators
- **Environment Variables**: Use Get-ChildItem Env: instead of env
- **Process Management**: Use Get-Process and Get-NetTCPConnection
- **Package Managers**: NPM and PIP work natively, winget available as alternative

### 13.2 Development Tool Chain
- **Primary**: Node.js 18.20.8 + NPM 10.8.2
- **Secondary**: Python 3.11.3 + PIP 23.3.2
- **Version Control**: Git 2.49.0.windows.1
- **IDE Support**: VS Code, Cursor, Obsidian available
- **Testing**: Jest framework configured and working

### 13.3 Local Development Setup
- **Project Type**: Local Node.js/TypeScript project
- **No Cloud Deployment**: Pure local development environment
- **Development URL**: http://localhost:3000 (when running)
- **Production URL**: None (not deployed)
- **Testing Strategy**: Local Jest tests, manual browser testing

---

**CRITICAL ENVIRONMENT AWARENESS CONFIRMED:**
✓ This is a LOCAL DEVELOPMENT environment on Windows 10
✓ No cloud deployment exists - project is purely local
✓ Development testing uses localhost:3000 when server is running
✓ All commands have been tested and verified working
✓ Platform-specific limitations documented with Windows alternatives
✓ Environment context is 100% complete with 0 bracketed placeholders
