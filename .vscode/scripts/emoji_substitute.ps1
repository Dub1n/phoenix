param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Paths,
    [switch]$Diag
)

# Strategy to determine target file(s):
# 1) If arguments provided, use them
# 2) Else if env vars like TARGET_FILE provided, use that
# 3) Else try to infer from VS Code/Cursor window title (unique basename match in workspace)
# 4) Else use clipboard if it contains a valid file path
# 5) Else exit quietly with a short hint

function Get-WorkspaceRoot {
    try {
        # Assume terminal CWD is the workspace root
        return (Get-Location).Path
    } catch {
        return $PSScriptRoot
    }
}

function Write-DebugMsg {
    param([string]$Message)
    if ($Diag -or $env:EMOJI_SUB_DEBUG -eq '1') {
        Write-Host "[EmojiSub][DBG] $Message" -ForegroundColor Cyan
    }
}

function Write-Info {
    param([string]$Message)
    Write-Host "[EmojiSub] $Message" -ForegroundColor DarkGray
}

function Get-EnvTargetFile {
    $keys = @(
        'TARGET_FILE','SELECTED_FILE','VSCODE_SELECTED_FILE',
        'VSCODE_EXPLORER_SELECTED_FILE','VSCODE_FILE','FILE'
    )
    foreach ($k in $keys) {
        $v = [Environment]::GetEnvironmentVariable($k)
        if ($v) {
            try { if (Test-Path -LiteralPath $v -PathType Leaf) { return $v } } catch {}
        }
    }
    return $null
}

function Get-ActiveEditorBasenameFromWindowTitle {
    try {
        $procNames = @('Code','Code - Insiders','Cursor')
        foreach ($pn in $procNames) {
            $p = Get-Process -Name $pn -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($p -and $p.MainWindowTitle) {
                $t = $p.MainWindowTitle
                # Typical title: "filename — Workspace - Visual Studio Code" or "filename - Workspace - Cursor"
                if ($t -match '^(.*?)\s+[—-]\s+') {
                    $candidate = $Matches[1].Trim()
                    # Strip dirty/pin markers like ●, •, *
                    $candidate = ($candidate -replace '^[\s\u25CF\*•●]+','').Trim()
                    if ($candidate) { return $candidate }
                }
            }
        }
    } catch {}
    return $null
}

function Resolve-FilesFromBasenameUnique {
    param(
        [string]$Workspace,
        [string]$Basename
    )
    try {
    $matchesHere = Get-ChildItem -LiteralPath $Workspace -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -ieq $Basename -or $_.BaseName -ieq $Basename }
        if ($matchesHere.Count -eq 1) { return @($matchesHere[0].FullName) }
    } catch {}
    return @()
}

function Get-ClipboardFileIfAny {
    try {
        $clip = Get-Clipboard -Raw -ErrorAction SilentlyContinue
        if (-not $clip) { return $null }
        $text = $clip.Trim()
        $candidates = @($text)
        $candidates += ($text -split "(\r?\n)+")
        $tokens = @()
        foreach ($line in $candidates) {
            if ($line) { $tokens += ($line -split '\s+') }
        }
        $candidates = ($candidates + $tokens) | Where-Object { $_ } | Select-Object -Unique
        foreach ($cand in $candidates) {
            $p = $cand.Trim('"').Trim()
            if ($p -like 'file://*') {
                try { $u = [Uri]$p; if ($u.IsFile) { $p = $u.LocalPath } } catch {}
            }
            if ($p -match '^[A-Za-z]:\\' -or $p -like '\\\\*') {
                try { if (Test-Path -LiteralPath $p -PathType Leaf) { Write-DebugMsg "Clipboard candidate accepted → $p"; return $p } } catch { }
            }
        }
    } catch {}
    return $null
}

function Set-EditorWindowFocus {
	try {
    		$procs = @('Cursor','Code','Code - Insiders') | ForEach-Object { Get-Process -Name $_ -ErrorAction SilentlyContinue } | Where-Object { $_.MainWindowHandle -ne 0 }
		if (-not $procs) { return $false }
		$hWnd = ($procs | Select-Object -First 1).MainWindowHandle
		if (-not ("Win32.Native" -as [type])) {
			Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
namespace Win32 {
  public static class Native {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
  }
}
"@
		}
		[Win32.Native]::SetForegroundWindow([IntPtr]$hWnd) | Out-Null
		return $true
	} catch { return $false }
}

function TryGetActiveFileViaCommandPalette {
	# Uses Ctrl+Shift+P → "Copy Path of Active File" → Enter, then reads clipboard
	try {
		$oldClip = $null
		try { $oldClip = Get-Clipboard -Raw -ErrorAction SilentlyContinue } catch {}
		$focused = Set-EditorWindowFocus
		Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
		if (-not ([type]::GetType('System.Windows.Forms.SendKeys'))) { return $null }
		if ($focused) {
			# Save the active editor to ensure on-disk content is current
			[System.Windows.Forms.SendKeys]::SendWait('^s')
			Start-Sleep -Milliseconds 150
			[System.Windows.Forms.SendKeys]::SendWait('^+p')
			Start-Sleep -Milliseconds 250
			[System.Windows.Forms.SendKeys]::SendWait('Copy Path of Active File')
			Start-Sleep -Milliseconds 200
			[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
			Start-Sleep -Milliseconds 200
			try {
				$clip = Get-Clipboard -Raw -ErrorAction SilentlyContinue
				if ($clip -and (Test-Path -LiteralPath $clip)) { return $clip }
			} catch {}
		}
		return $null
	} finally {
		# Best effort to restore clipboard
		if ($null -ne $oldClip) { Set-Clipboard -Value $oldClip -ErrorAction SilentlyContinue }
	}
}

function Get-PythonLauncher {
    foreach ($cmd in @('pyw','pythonw','py','python')) {
        if (Get-Command $cmd -ErrorAction SilentlyContinue) { return $cmd }
    }
    return $null
}

function Get-PythonForDiag([string]$launcher) {
    # Prefer console python for diagnostics
    if ($launcher -in @('pyw','pythonw')) {
        foreach ($alt in @('py','python')) {
            if (Get-Command $alt -ErrorAction SilentlyContinue) { return $alt }
        }
    }
    return $launcher
}

function Get-FileHashSafe([string]$path) {
    try {
        if (Test-Path -LiteralPath $path -PathType Leaf) { return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash }
    } catch {}
    return $null
}

$workspace = Get-WorkspaceRoot
$targets = @()
Write-DebugMsg "Workspace root: $workspace"

if ($Paths -and $Paths.Count -gt 0) {
    $targets = $Paths | Where-Object { Test-Path -LiteralPath $_ }
    Write-DebugMsg "Args provided → $($targets -join '; ')"
}

if (-not $targets -or $targets.Count -eq 0) {
    $envTarget = Get-EnvTargetFile
    if ($envTarget) { $targets = @($envTarget); Write-DebugMsg "Env target → $envTarget" }
}

if (-not $targets -or $targets.Count -eq 0) {
	# First try explicit copy via command palette for reliability
	$fromPalette = TryGetActiveFileViaCommandPalette
	if ($fromPalette) { $targets = @($fromPalette); Write-DebugMsg "Palette target → $fromPalette" }
}

if (-not $targets -or $targets.Count -eq 0) {
	# Fallback to guessing from window title (unique basename)
	$base = Get-ActiveEditorBasenameFromWindowTitle
	if ($base) {
		$resolved = Resolve-FilesFromBasenameUnique -Workspace $workspace -Basename $base
		Write-DebugMsg "Window title basename → $base; unique matches: $($resolved.Count)"
		if ($resolved.Count -eq 1) { $targets = $resolved }
	}
}

if (-not $targets -or $targets.Count -eq 0) {
    $clipPath = Get-ClipboardFileIfAny
    if ($clipPath) { $targets = @($clipPath); Write-DebugMsg "Clipboard target → $clipPath" }
}

if (-not $targets -or $targets.Count -eq 0) {
    Write-Host "No target file detected. Open a file, copy a file path to clipboard, or pass a path as an argument." -ForegroundColor Yellow
    exit 0
}

# Build python invocation
$python = Get-PythonLauncher
if (-not $python) { Write-Error "No Python launcher found (pyw/pythonw/py/python)."; exit 1 }
if ($Diag -or $env:EMOJI_SUB_DEBUG -eq '1') { $python = Get-PythonForDiag $python }
Write-DebugMsg "Python launcher → $python"

$pyScript = Join-Path $PSScriptRoot 'emoji_substitute.py'
if (-not (Test-Path -LiteralPath $pyScript)) { Write-Error "emoji_substitute.py not found at $pyScript"; exit 1 }
Write-DebugMsg "Script path → $pyScript"

# Compose argument list
$argList = @()
if ($python -in @('py','pyw')) { $argList += '-3' }
$argList += @($pyScript,'--files-only')
if ($Diag -or $env:EMOJI_SUB_DEBUG -eq '1') {
    $argList += '-v'
} else {
    $argList += '-q'
}
$argList += $targets
Write-DebugMsg ("Args → " + ($argList -join ' '))
Write-Info ("Target(s):`n - " + ($targets -join "`n - "))

# Start process (pythonw will be silent; py/python will show in terminal which is acceptable)
# Record pre-hash to verify modifications
$preHashes = @{}
foreach ($t in $targets) { $preHashes[$t] = Get-FileHashSafe $t }
try {
    if ($Diag -or $env:EMOJI_SUB_DEBUG -eq '1') {
        # Synchronous execution ensures no timing issues
        & $python @argList
    } else {
        # Use -Wait to avoid racing with subsequent steps
        Start-Process -FilePath $python -ArgumentList $argList -WindowStyle Hidden -Wait | Out-Null
    }
} catch {
    # Fallback to in-terminal invocation if Start-Process fails
    & $python @argList | Out-Null
}

# Post-verify changes
foreach ($t in $targets) {
    $before = $preHashes[$t]
    $after = Get-FileHashSafe $t
    if ($before -and $after) {
        if ($before -ne $after) { Write-Info "Modified: $t" }
        else { Write-DebugMsg "Unchanged: $t" }
    }
}

exit 0
