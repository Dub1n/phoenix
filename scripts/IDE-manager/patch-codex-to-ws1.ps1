# patch-codex-to-wsl.ps1
# purpose: find the codex vscode extension and force terminal command to use WSL bash instead of powershell.exe
# safe: creates a .bak copy alongside each modified file

$ErrorActionPreference = "Stop"

$extRoot = Join-Path $HOME ".vscode-oss\extensions"
if (!(Test-Path $extRoot)) { throw "extensions folder not found: $extRoot" }

# guess names — tweak if your extension shows up under a different publisher/name
$candidates = Get-ChildItem $extRoot -Directory | Where-Object {
  $_.Name -match "codex" -or $_.Name -match "openai"
}

if (!$candidates) { throw "no candidate codex extension found in $extRoot" }

# files that commonly contain tool wiring
$patterns = @("package.json","dist","out","extension.js","main.js",".js",".mjs")

$patched = @()
foreach ($ext in $candidates) {
  # search for literal 'powershell.exe' in text-y files
  $hits = Get-ChildItem $ext.FullName -Recurse -File |
    Where-Object { $_.Extension -match "json|js|mjs|cjs|ts|map" -or $patterns -contains $_.Name } |
    Select-String -SimpleMatch "powershell.exe"

  if (!$hits) { continue }

  ($hits | Select-Object -ExpandProperty Path -Unique) | ForEach-Object {
    $file = $_
    $orig = Get-Content $file -Raw
    $backup = "$file.bak"
    if (!(Test-Path $backup)) { Copy-Item $file $backup }

    # replace common launch forms:
    # "powershell.exe"
    # ["powershell.exe","-NoProfile","-Command", ...]
    $patchedText = $orig `
      -replace '(?i)"powershell\.exe"', '"wsl.exe"' `
      -replace '(?i)\["powershell\.exe",\s*"-NoProfile",\s*"-Command"\s*,', '["wsl.exe","-e","bash","-l","-c",'

    if ($patchedText -ne $orig) {
      Set-Content -Path $file -Value $patchedText -Encoding UTF8
      $patched += $file
    }
  }
}

if ($patched.Count -gt 0) {
  "patched files:`n" + ($patched | Sort-Object -Unique | ForEach-Object { " - $_" }) -join "`n" | Write-Host
  Write-Host "`n✅ done. restart vscode."
} else {
  Write-Host "no hardcoded 'powershell.exe' found. either already patched or the command is built dynamically."
}
