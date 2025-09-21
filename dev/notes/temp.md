# temp.md

```pwsh
# close all chrome windows first
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$log = "C:\Users\gabri\Downloads\chrome_debug.log"

# launch chrome with logging enabled
Start-Process $chrome -ArgumentList "--enable-logging", "--v=1"

# after reproducing the WSL auto-open, read the log:

```code
Get-Content $log -Wait | Select-String "localhost"
    ap.add_argument(
        "--exclude-globs",
        nargs="*",
        default=list(DEFAULT_EXCLUDE_GLOBS),
        help="File globs to exclude (matched on full relative path)",
    )
```
