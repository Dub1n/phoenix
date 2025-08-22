## CONTEXT

@agent-heartbeat.ps1 , which is called called by @cursor-terminal-init.ps1 which is launched by     "terminal.integrated.profiles.windows": { in @settings.json , and uses config from @terminal-config.json
Read the docs in scripts\terminal-completer\docs\dev\08-agent-terminal-heartbeat-spec.md and scripts\terminal-completer\README.md for reference.

## TASK

debug/improve the script (and/or the other files used); it's requirements are:

- being enabled whenever the Cursor agent uses the terminal (can already be running, it doesn't necessarily need to be "initialised" every time).
- not affecting the user's windows environment - it currently presses the enter key in the whole of windows, rather than just the terminal
- sending the symbols to the terminal - currently it is not but this is likely due to the limitation mentioned next
- If launched in(by) a terminal that is to make use of the heartbeat script, it cannot stay on the "Loading heartbeat module..." and not complete, as this blocks the terminal use. It can either complete, or be launched in the background. As it is now it does not exit the Loading heartbeat module... state, and so commands cannot be sent by the user/agent and it does not send the characters to the terminal.
- If launched in the background, or any other method that would benefit from this, the script needs to complete once all of the terminals that utilise it are closed - if each one has its own instance of the script running then it should terminate when that terminal does, but if multiple terminals use one instance of the script then the script should terminate once all of the terminals using it are closed and not if any are remaining open.

## NOTES

- Do not overengineer - this should be as simple as possible in order to meet the requirements stated here and the initial requirements of the script that are stated in the docs provided.
- Ensure that, if any changes update the requirements for other files (different paths etc), those affected files are updated accordingly.
