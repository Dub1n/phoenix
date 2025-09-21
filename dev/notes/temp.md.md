# temp.md

```pwsh
# close all chrome windows first
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$log = "C:\Users\gabri\Downloads\chrome-net-export-log.json"

Remove-Item $log -ErrorAction SilentlyContinue

# launch chrome with logging enabled
Start-Process $chrome -ArgumentList "--enable-logging", "--v=1"

# after reproducing the WSL auto-open, read the log:
Get-Content $log -Wait | Select-String "localhost"
```
