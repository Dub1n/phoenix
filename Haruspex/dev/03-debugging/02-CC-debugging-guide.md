# Haruspex Debugging System

The system creates external debugging capabilities for a VSCode extension by establishing an IPC
(Inter-Process Communication) bridge between the extension running inside VSCode and external
command-line tools. This lets you (or an AI agent) inspect, debug, and control the extension
without needing to:

- Rebuild the extension
- Reload VSCode
- Navigate through VSCode's UI
- Lose state between debugging sessions

The system is essentially external DevTools for your VSCode extension, letting you debug it like you would debug a web application, but from the command line with structured data perfect for AI consumption.

## Haruspex Debug Quick Start

### Connect

haruspex-debug connect

### Check Status

haruspex-debug status
haruspex-debug health

### Fix Problems

haruspex-debug diagnose --fix
haruspex-debug exec haruspex.refreshAll
haruspex-debug emergency-recovery

### Monitor Live

haruspex-debug watch
haruspex-debug interactive

### Common Issues

- Extension won't load → haruspex-debug emergency-recovery
- WebViews stuck → haruspex-debug exec haruspex.refreshAll
- Performance issues → haruspex-debug metrics

## How You Would Actually Use It

1. Connect to the Running Extension

    > haruspex-debug connect --workspace ./my-project

2. Real-Time Health Monitoring

    *Get current status*

    > haruspex-debug status

    *Watch live changes*

    > haruspex-debug watch --events critical

    *Get detailed health report*

    > haruspex-debug health --detailed

3. Interactive Debugging

    *Run diagnostics and get actionable reports*

    > haruspex-debug diagnose --fix --report debug-report.json

    *Execute VSCode commands remotely*

    > haruspex-debug exec haruspex.refreshAll

    *Emergency recovery if extension breaks*

    > haruspex-debug emergency-recovery

4. Interactive Mode

    *Enter interactive debugging session*

    > haruspex-debug interactive

## What Your Interaction Would Look Like

Instead of:

1. Notice extension not working properly
2. Open VSCode Developer Console
3. Rebuild extension
4. Reload VSCode
5. Hope the problem is fixed

You would:

1. haruspex-debug diagnose → Get structured problem report
2. haruspex-debug watch → See exactly what's failing in real-time
3. haruspex-debug exec refresh → Fix the issue without restarting
4. Continue development immediately

## Benefits for AI/Agent Development

For an AI agent working on this extension, this system provides:

- Immediate feedback on changes without rebuild cycles
- Structured JSON output for all diagnostic information
- Automated recovery procedures when things break
- Real-time state monitoring to understand what's happening
