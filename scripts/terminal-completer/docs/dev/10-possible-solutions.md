Possible solutions:

1) Use Start-Process with -NoNewWindow to run heartbeat in same console window [Implemented, failed]
2) Use Windows Task Scheduler to run periodic commands [Not attempted]
3) Create a separate PowerShell process that attaches to the parent console [Not attempted]
4) Use a timer-based approach with Register-ObjectEvent [Not attempted]
5) Create a simple loop that runs commands then yields control [Not attempted]
6) Add a wrapper to commands run that adds a short delay before/after running the command
