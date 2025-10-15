---
date-created: 2025-09-02-0000
last-updated: 2025-09-11-0000
name: cli-process-separation
description: Architectural separation of service and CLI into independent processes with IPC-based service discovery
status: "[x]"
category: architecture
use-when:
  - Need headless service deployment without CLI interface
  - Want multi-terminal CLI access to single service instance
  - Require containerization with separate CLI access
  - Building service-oriented architecture with independent components
keywords:
  - cli-separation
  - process-architecture
  - service-discovery
  - ipc-communication
  - headless-deployment
  - multi-terminal
prerequisites:
  - service-discovery
  - ipc-communication
  - process-management
related-patterns:
  - service-discovery
  - process-management
  - ipc-protocol
---

### CLI Process Separation Pattern

**Problem**: Monolithic service-CLI architecture prevents proper headless deployment, containerization, and multi-terminal CLI access patterns.

**Solution**: Architectural separation of service and CLI into independent processes with IPC-based service discovery for flexible deployment and access.

#### CLI Process Separation Pattern: Implementation Steps

**Step 1**: Headless Service Conversion

```typescript
// src/index.ts - Convert from monolithic to headless service
export async function main(): Promise<void> {
  // Initialize core service without CLI
  const templumCore = new TemplumCore(config);
  await templumCore.initialize();
  
  // REMOVED: CLI activation - now runs headless
  console.log('🔧 Running in headless service mode...');
  console.log('💡 Use "templum" command to access CLI interface');
  
  // Register service for CLI discovery
  await templumCore.registerForCliDiscovery();
  
  // Keep service running without CLI
  process.stdin.resume();
}
```

**Step 2**: Service Registry Implementation

```typescript
// Add to TemplumCore class
async registerForCliDiscovery(): Promise<void> {
  const serviceRegistryPath = process.env.HOME || process.env.USERPROFILE;
  const templumDir = path.join(serviceRegistryPath!, '.templum');
  const servicesDir = path.join(templumDir, 'services');
  
  // Create service registry entry
  const serviceEntry = {
    id: 'templum-core',
    service: 'templum',
    protocol: 'ipc' as const,
    endpoint: `ipc://templum-core-${process.pid}`,
    capabilities: this.getSupportedInterfaces(),
    pid: process.pid,
    registrationTime: Date.now()
  };
  
  // Write registry file with cleanup handlers
  const serviceFilePath = path.join(servicesDir, `templum-core-${process.pid}.json`);
  fs.writeFileSync(serviceFilePath, JSON.stringify(serviceEntry, null, 2));
  
  // Setup process cleanup
  process.on('exit', () => cleanupServiceEntry(serviceFilePath));
}
```

**Step 3**: Separate CLI Entry Point

```typescript
// src/cli-entry.ts - New standalone CLI process
class TemplumCliDiscovery {
  async discoverServices(): Promise<ServiceRegistryEntry[]> {
    const servicesDir = path.join(userHome, '.templum', 'services');
    const serviceFiles = fs.readdirSync(servicesDir)
      .filter(file => file.startsWith('templum-core-'));
    
    const activeServices: ServiceRegistryEntry[] = [];
    for (const serviceFile of serviceFiles) {
      const serviceEntry = JSON.parse(fs.readFileSync(serviceFilePath, 'utf8'));
      
      // Validate process still running
      if (this.isProcessRunning(serviceEntry.pid)) {
        activeServices.push(serviceEntry);
      } else {
        // Cleanup stale entries
        fs.unlinkSync(serviceFilePath);
      }
    }
    return activeServices.sort((a, b) => b.registrationTime - a.registrationTime);
  }
  
  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0); // Signal 0 = existence check
      return true;
    } catch {
      return false;
    }
  }
}

async function main(): Promise<void> {
  const discovery = new TemplumCliDiscovery();
  const serviceEntry = await discovery.getBestService();
  
  if (!serviceEntry) {
    console.error('**X** No running Templum service found');
    console.log('💡 Please start Templum service first:');
    console.log('   node dist/src/index.js');
    process.exit(1);
  }
  
  // Connect to service and initialize CLI
  const remoteAdapter = new RemoteTemplumAdapter(serviceEntry);
  await remoteAdapter.initializeCLI();
}
```

**Step 4**: Package Configuration

```json
// package.json updates
{
  "bin": {
    "templum": "./dist/src/cli-entry.js"  // Point to CLI entry
  },
  "scripts": {
    "start:service": "node dist/src/index.js",     // Headless service
    "start:cli": "node dist/src/cli-entry.js"      // Standalone CLI
  }
}
```

#### CLI Process Separation Pattern: Success Metrics

- Service runs headless without CLI interface ✓
- CLI accessible globally via `templum` command ✓  
- Service discovery works across process boundaries ✓
- Process cleanup prevents stale registry entries ✓
- Multi-terminal CLI access supported ✓
- Headless deployment patterns enabled ✓

#### CLI Process Separation Pattern: Anti-Patterns

- **X** **Registry Pollution**: Not cleaning up stale service registry entries on process exit
- **X** **Process Validation Skip**: Trusting registry entries without validating process existence  
- **X** **Single Point Discovery**: Using only one discovery method without fallback strategies
- **X** **Hard-coded Paths**: Using fixed paths instead of environment-aware registry locations

#### CLI Process Separation Pattern: Validation Checklist

- [ ] Service Discovery: Registry creation, process validation, stale cleanup working
- [ ] Process Separation: Service runs independently, CLI connects via discovery
- [ ] Global Command: `templum` command accessible from any terminal
- [ ] Multi-Terminal: Multiple CLI instances can connect to single service
- [ ] Error Handling: Graceful handling of service not found, connection failures
- [ ] Resource Cleanup: Proper cleanup of registry entries and process handlers

#### CLI Process Separation Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

- **2025-09-02 - TASK-CLI-004**: Applied successfully for Templum. Process discovery and cleanup worked perfectly. Pattern reduced from 6h estimate to 4h actual due to leveraging existing service discovery infrastructure. Required minor TypeScript fixes for mock orchestrator interface.
- **2025-09-02 - TASK-CLI-005**: Enhanced mock orchestrator proxy implementation. Added missing isInitialized(), loadBackendSkin(), getUniversalSkinEngine() methods and proper backend connection structure. Pattern extension took 1.5h to complete CLI initialization functionality.
- **2025-09-02 - TASK-CLI-010**: Applied service discovery integration aspect for IPC communication. Leveraged existing service registry with PID validation and process health checking. Pattern's service discovery component provided robust foundation for CLI-to-Core communication. Used established `ServiceRegistryEntry` structure and `isProcessRunning()` validation. Actual integration time: 0.5h (service discovery portion). Key insight: Pattern's service registry design scales well for real IPC communication scenarios.

// TODO: [TASK-PATTERN-001] Pattern: cli-process-separation | Complexity: 7 | Dependencies: service-discovery,ipc-communication,process-management
// Context: Updated YAML frontmatter to standardized format for better searchability and integration
// Validation-Required: yaml-format-compliance, pattern-discoverability, metadata-accuracy
// Pattern-Info: { approach: "frontmatter-standardization", alternatives: "manual-yaml-editing", trade-offs: "consistency-vs-simplicity" }

#### CLI Process Separation Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-CLI-004], [TASK-CLI-005], [TASK-CLI-010], [TASK-PATTERN-001]
**Successfully Applied**: [TASK-CLI-004] ✅ CLI Process Separation Implementation (2025-09-02), [TASK-CLI-005] ✅ CLI Initialization Error Resolution (2025-09-02), [TASK-CLI-010] ✅ CLI-to-Core IPC Communication (2025-09-02), [TASK-PATTERN-001] ✅ Frontmatter Standardization (2025-09-11)
**Integration Points**: Service Discovery, IPC Communication, Process Management, Terminal UI Components
**Files Using This Pattern**: src/index.ts, src/cli-entry.ts, src/core/templum-core.ts, package.json
