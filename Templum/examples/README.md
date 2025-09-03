# Templum Minimal Implementation

This directory contains a minimal working implementation of Templum that demonstrates the core concepts with a simple HTTP backend and CLI interface.

## Quick Start

### 1. Run the Complete Test

**Windows:**

```bash
cd Templum/examples
test-minimal.bat
```

**Unix/Linux/macOS:**

```bash
cd Templum/examples
chmod +x test-minimal.sh
./test-minimal.sh
```

### 2. Manual Testing Steps

#### Start the Backend

```bash
cd Templum/examples/minimal-backend
npm install
node server.js
```

#### Test with the Minimal CLI

In another terminal:

```bash
cd Templum/examples
npx ts-node minimal-cli.ts
```

#### Test with Any Port

```bash
# Start on any port
PORT=7823 node server.js

# Verify auto-registration
ls ~/.templum/services/
# Shows: minimal-example-{pid}.json

# Test with custom port
curl http://localhost:7823/health
curl http://localhost:7823/getSkinDefinition

# Execute commands on custom port
curl -X POST http://localhost:7823/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "Custom Port User"}}'
```

## Components

### 1. Minimal Backend (`minimal-backend/`)

- **Purpose**: Simple HTTP server demonstrating enhanced Templum backend integration
- **Protocol**: HTTP (any available port)
- **Discovery**: Enhanced auto-registration system
- **Features**:
  - Skin definition endpoint (`/getSkinDefinition`)
  - Command execution endpoint (`/executeCommand`)
  - Health check endpoint (`/health`)
  - Auto-registration with `~/.templum/services/*.json`
  - Process-based lifecycle management
  - Two example commands: `example.hello` and `example.status`

### 2. Minimal CLI (`minimal-cli.ts`)

- **Purpose**: Direct CLI interface for testing backend functionality
- **Features**:
  - Interactive mode with command prompt
  - Direct command execution
  - Backend discovery and health checks
  - Simple, human-readable output

### 3. **Enhanced Auto-Registration System**

- **Auto-Registration**: Backend creates `~/.templum/services/minimal-example-{pid}.json`
- **Any Port Support**: Works on any available port (not limited to scan ports)
- **Process Validation**: Auto-cleanup when backend exits
- **Instant Discovery**: Templum discovers backends immediately via directory watching
- **Zero Configuration**: No manual setup or external files needed

### 4. Test Scripts

- **Purpose**: Automated testing and validation
- **Features**: Start backend, run tests, validate responses

## Architecture

This minimal implementation demonstrates the **Enhanced Templum 1.2 Discovery Architecture**:

``` diagram
┌───────────────────────────────────────────┐
│            Templum Core                   │
│  Enhanced Service Discovery               │
│  • Auto-Registration Detection            │
│  • Directory Watching                     │
│  • Process Validation                     │
└─────────────────┬─────────────────────────┘
                  │ Instant Discovery
                  │ Any Port Support
┌─────────────────▼─────────────────────────┐
│        Auto-Registration System           │
│  ~/.templum/services/backend-{pid}.json   │
│  • Process ID tracking                    │
│  • Port specification                     │
│  • Auto-cleanup on exit                   │
└─────────────────┬─────────────────────────┘
                  │ Service Definition
                  │
┌─────────────────▼─────────────────────────┐
│           Minimal Backend                 │
│  • Skin Definition (self-describing)      │
│  • Command Execution (any port)           │
│  • Health Monitoring                      │
│  • Auto-Registration                      │
└───────────────────────────────────────────┘
```

### Enhanced Discovery Benefits

**Traditional Port Scanning**:

``` log
Templum → Scans [3001, 3002, 3003...] → Limited ports [F]
```

**Enhanced Auto-Registration**:

``` log
Backend → Creates service file → Templum detects instantly [x]
Any port → Process validation → Auto-cleanup → Zero config [x]
```

## Key Features Demonstrated

### 1. **Self-Describing Backend**

The backend provides its own skin definition describing:

- Available commands and parameters
- UI structure for different interface types
- Communication protocol and endpoints

### 2. **Protocol-Agnostic Communication**

Uses HTTP as the communication protocol, but the pattern works with:

- IPC (Inter-Process Communication)
- WebSocket
- gRPC
- Custom protocols

### 3. **Generic Command Routing**

Commands are defined in the skin and routed dynamically without hardcoded logic.

### 4. **Enhanced Self-Contained Integration**

- **Auto-registration** - Backend automatically registers itself on startup
- **Any port discovery** - Works on any available port, not limited to scan ports
- **Instant detection** - Templum discovers backend immediately when it starts
- **Auto-cleanup** - Registration automatically removed when backend exits
- **Zero Templum changes** - No modifications to Templum core required
- **Zero configuration** - No manual setup or external files needed

## Using with Full Templum

Once this minimal backend is running, you can:

1. **Start Full Templum**: The service discovery will automatically find the backend
2. **Use VSCode Extension**: Commands appear in the Templum sidebar
3. **Use CLI Interface**: Interactive menus include the backend commands
4. **Use Command Line**: Direct command execution with `templum example.hello --name "Test"`

## Development Workflow

### For Quick Prototyping

1. Modify `minimal-backend/server.js` to add new commands
2. Update the skin definition to include new UI elements
3. Test immediately with `minimal-cli.ts` or curl
4. No Templum restart needed

### For Backend Developers

1. Use this as a template for your own Templum-compatible backend
2. Replace the example commands with your actual functionality
3. Update the skin definition to match your UI requirements
4. Test integration with full Templum

## Extension Points

### Adding New Commands

1. Add command definition to `SKIN_DEFINITION.commands`
2. Add command handler to the `executeCommand` endpoint
3. Update UI elements in `SKIN_DEFINITION.views` and `SKIN_DEFINITION.menus`

### Different Protocols

1. Replace Express server with your protocol implementation
2. Update `backendConfig.protocol` in skin definition
3. Templum will automatically use the appropriate connection factory

### Advanced Features

1. Add authentication to `backendConfig.authentication`
2. Implement streaming responses for long-running commands
3. Add real-time updates via WebSocket or Server-Sent Events

## Troubleshooting

### Backend Won't Start

- Check if port 3001 is available: `netstat -an | grep 3001`
- Verify Node.js installation: `node --version`
- Check for errors: `cat minimal-backend/backend.log`

### CLI Can't Connect

- Verify backend is running: `curl http://localhost:3001/health`
- Check firewall settings
- Ensure no proxy interference

### Commands Fail

- Check backend logs for error details
- Verify command names match the skin definition
- Test with curl to isolate CLI vs backend issues

## Next Steps

1. **Extend the Backend**: Add more commands and functionality
2. **Try Full Templum**: Start the complete Templum system with this backend
3. **Build Your Own**: Use this as a template for your Templum integration
4. **Explore Protocols**: Try implementing WebSocket or IPC backends
