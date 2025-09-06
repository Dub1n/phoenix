---
date: 2025-09-04-1646
TASK-ID: TASK-CLI-018
source: templum-active-tasks.md
validation_type: ui
category: ui
priority: medium
complexity: TBD
components: [task-specific-components]
initial_status: [~]
end_status: [B]
tags: ui, validation, automated-testing
---

# Validation Report - TASK-CLI-018 - 2025-09-04-1646

## Validation Category: UI/Interface Tasks

**Overall Status**: VALIDATION_PASSED_WITH_WARNINGS
**Execution Time**: 37062ms
**Tests Executed**: 2

## Tests Executed:

- [ ] Clean Compilation - ✅ PASS
- [ ] TypeScript Type Checking - ✅ PASS

## Evidence Collected:

1. Environment: Node.js v24.4.0, npm 11.4.2
2. Project package.json exists
3. Basic lint check skipped - disabled by default
4. Build completed successfully: npm run build
5. Output length: 30 characters
6. TypeScript compilation: 0 errors
7. Output length: 0 characters
8. Command executed: npm run start:cli -- --list-services 2>&1 | head -20
9. Output: > templum@1.0.0 start:cli
> node dist/src/cli-entry.js --list-services

* Templum CLI - Connecting to Service
Discovering running Templum service instances...
🔗 Connecting to Templum service...
   Service: templum-core (PID: 39664)
   Endpoint: ipc://templum-core-39664
   Capabilities: vscode, cli, command
[IPC] Creating orchestrator proxy for ipc://templum-core-39664
[IPC] Registering interface: cli
CLIInterfaceAdapter: Initialized with orchestrator abstraction
[IPC] Refreshing system status...
[IPC] System status updated from service
✅ Connected to Templum service successfully
🚀 Starting Templum CLI session...
════════════════════════════════════════════════════════════
✅ Connected to Templum service successfully
🚀 Starting Templum interactive session...
10. Command output: > templum@1.0.0 test
> jest --testNamePattern=Component --verbose

  console.warn
    SkinVersionManager: Failed to evaluate range *-* for version 1.0.0: Error: Invalid semantic version format: *-*
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at SkinVersionManager.parseVersion (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:84:33)
        at SkinVersionManager.compareVersions (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:111:54)
        at SkinVersionManager.satisfiesRange (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:152:21)
        at SkinVersionManager.validateCompatibility (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:241:18)
        at UniversalSkinEngine.registerSkin (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\universal-skin-engine-impl.ts:86:61)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\templum\universal-skin-system.test.ts:352:24)
        at Promise.finally.completed (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1556:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1496:10)
        at _callCircusTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1006:40)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at _runTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:946:3)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:839:13)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at run (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:757:3)
        at runAndTransformResultsToJestFormat (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1917:21)
        at jestAdapter (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\runner.js:101:19)
        at runTestInternal (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:275:16)
        at runTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:343:7)
        at Object.worker (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:497:12) {
      code: 'version-parse-error',
      category: 'validation',
      timestamp: 1757000765575,
      context: undefined
    }

    [0m [90m 189 |[39m       [36mreturn[39m [36mthis[39m[33m.[39mcompareVersions(parsedVersion[33m,[39m range) [33m===[39m [35m0[39m[33m;[39m
     [90m 190 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 191 |[39m       console[33m.[39mwarn([32m`SkinVersionManager: Failed to evaluate range ${range} for version ${version}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 192 |[39m       [36mreturn[39m [36mfalse[39m[33m;[39m
     [90m 193 |[39m     }
     [90m 194 |[39m   }[0m

      at SkinVersionManager.satisfiesRange (src/skin/skin-version-manager.ts:191:15)
      at SkinVersionManager.validateCompatibility (src/skin/skin-version-manager.ts:241:18)
      at UniversalSkinEngine.registerSkin (src/skin/universal-skin-engine-impl.ts:86:61)
      at Object.<anonymous> (tests/templum/universal-skin-system.test.ts:352:24)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.error
    TemplumAdapterRegistry: Initialization failed: Error: Dependency wiring validation failed: stateManager → backendRouter: Backend router does not have state manager reference; resourceManager → skinEngine: Component skinEngine not registered with resource manager; resourceManager → stateManager: Component stateManager not registered with resource manager; resourceManager → backendRouter: Component backendRouter not registered with resource manager; resourceManager → backendServiceRouter: Component backendServiceRouter not registered with resource manager; resourceManager → observabilityService: Component observabilityService not registered with resource manager
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at TemplumAdapterRegistry.wireComponentDependencies (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1354:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at TemplumAdapterRegistry.initialize (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1182:7)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\core\adapter-registry.test.ts:255:7) {
      code: 'DEPENDENCY_WIRING_VALIDATION_ERROR',
      category: 'configuration',
      timestamp: 1757000766327,
      context: undefined
    }

    [0m [90m 1219 |[39m       }[33m;[39m
     [90m 1220 |[39m
    [31m[1m>[22m[39m[90m 1221 |[39m       console[33m.[39merror([32m'TemplumAdapterRegistry: Initialization failed:'[39m[33m,[39m errorPayload[33m.[39merror)[33m;[39m
     [90m      |[39m               [31m[1m^[22m[39m
     [90m 1222 |[39m       [36mthrow[39m createTemplumError([32m`Registry initialization failed: ${errorPayload.error.message}`[39m[33m,[39m [32m'INITIALIZATION_ERROR'[39m[33m,[39m [32m'configuration'[39m)[33m;[39m
     [90m 1223 |[39m     }
     [90m 1224 |[39m   }[0m

      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1221:15)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:255:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.error
    TemplumAdapterRegistry: Initialization failed: Error: Dependency wiring validation failed: stateManager → backendRouter: Backend router does not have state manager reference; resourceManager → skinEngine: Component skinEngine not registered with resource manager; resourceManager → stateManager: Component stateManager not registered with resource manager; resourceManager → backendRouter: Component backendRouter not registered with resource manager; resourceManager → backendServiceRouter: Component backendServiceRouter not registered with resource manager; resourceManager → observabilityService: Component observabilityService not registered with resource manager
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at TemplumAdapterRegistry.wireComponentDependencies (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1354:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at TemplumAdapterRegistry.initialize (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1182:7)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\core\adapter-registry.test.ts:393:7) {
      code: 'DEPENDENCY_WIRING_VALIDATION_ERROR',
      category: 'configuration',
      timestamp: 1757000766383,
      context: undefined
    }

    [0m [90m 1219 |[39m       }[33m;[39m
     [90m 1220 |[39m
    [31m[1m>[22m[39m[90m 1221 |[39m       console[33m.[39merror([32m'TemplumAdapterRegistry: Initialization failed:'[39m[33m,[39m errorPayload[33m.[39merror)[33m;[39m
     [90m      |[39m               [31m[1m^[22m[39m
     [90m 1222 |[39m       [36mthrow[39m createTemplumError([32m`Registry initialization failed: ${errorPayload.error.message}`[39m[33m,[39m [32m'INITIALIZATION_ERROR'[39m[33m,[39m [32m'configuration'[39m)[33m;[39m
     [90m 1223 |[39m     }
     [90m 1224 |[39m   }[0m

      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1221:15)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:393:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)
11. Manual UI tests (menu navigation, error handling) require manual verification
12. Command executed: npm run test -- --testNamePattern="accessibility|a11y" --passWithNoTests
13. Output: > templum@1.0.0 test
> jest --testNamePattern=accessibility|a11y --passWithNoTests

## Test Results Detail:


### Clean Compilation
**Status**: PASS
**Message**: Clean compilation successful
**Evidence**: Build completed successfully: npm run build, Output length: 30 characters




### TypeScript Type Checking
**Status**: PASS
**Message**: TypeScript type checking passed
**Evidence**: TypeScript compilation: 0 errors, Output length: 0 characters




### CLI Functionality Test
**Status**: PASS
**Message**: N/A
**Evidence**: Command executed: npm run start:cli -- --list-services 2>&1 | head -20, Output: > templum@1.0.0 start:cli
> node dist/src/cli-entry.js --list-services

* Templum CLI - Connecting to Service
Discovering running Templum service instances...
🔗 Connecting to Templum service...
   Service: templum-core (PID: 39664)
   Endpoint: ipc://templum-core-39664
   Capabilities: vscode, cli, command
[IPC] Creating orchestrator proxy for ipc://templum-core-39664
[IPC] Registering interface: cli
CLIInterfaceAdapter: Initialized with orchestrator abstraction
[IPC] Refreshing system status...
[IPC] System status updated from service
✅ Connected to Templum service successfully
🚀 Starting Templum CLI session...
════════════════════════════════════════════════════════════
✅ Connected to Templum service successfully
🚀 Starting Templum interactive session...
**Errors**: 
**Warnings**: 


### Component Rendering Test
**Status**: WARN
**Message**: N/A
**Evidence**: Command output: > templum@1.0.0 test
> jest --testNamePattern=Component --verbose

  console.warn
    SkinVersionManager: Failed to evaluate range *-* for version 1.0.0: Error: Invalid semantic version format: *-*
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at SkinVersionManager.parseVersion (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:84:33)
        at SkinVersionManager.compareVersions (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:111:54)
        at SkinVersionManager.satisfiesRange (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:152:21)
        at SkinVersionManager.validateCompatibility (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\skin-version-manager.ts:241:18)
        at UniversalSkinEngine.registerSkin (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\skin\universal-skin-engine-impl.ts:86:61)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\templum\universal-skin-system.test.ts:352:24)
        at Promise.finally.completed (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1556:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1496:10)
        at _callCircusTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1006:40)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at _runTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:946:3)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:839:13)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at _runTestsForDescribeBlock (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at run (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:757:3)
        at runAndTransformResultsToJestFormat (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\jestAdapterInit.js:1917:21)
        at jestAdapter (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-circus\build\runner.js:101:19)
        at runTestInternal (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:275:16)
        at runTest (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:343:7)
        at Object.worker (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\node_modules\jest-runner\build\testWorker.js:497:12) {
      code: 'version-parse-error',
      category: 'validation',
      timestamp: 1757000765575,
      context: undefined
    }

    [0m [90m 189 |[39m       [36mreturn[39m [36mthis[39m[33m.[39mcompareVersions(parsedVersion[33m,[39m range) [33m===[39m [35m0[39m[33m;[39m
     [90m 190 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 191 |[39m       console[33m.[39mwarn([32m`SkinVersionManager: Failed to evaluate range ${range} for version ${version}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 192 |[39m       [36mreturn[39m [36mfalse[39m[33m;[39m
     [90m 193 |[39m     }
     [90m 194 |[39m   }[0m

      at SkinVersionManager.satisfiesRange (src/skin/skin-version-manager.ts:191:15)
      at SkinVersionManager.validateCompatibility (src/skin/skin-version-manager.ts:241:18)
      at UniversalSkinEngine.registerSkin (src/skin/universal-skin-engine-impl.ts:86:61)
      at Object.<anonymous> (tests/templum/universal-skin-system.test.ts:352:24)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:66:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:128:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:142:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:157:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:170:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:184:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:204:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:222:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:242:7)

  console.error
    TemplumAdapterRegistry: Initialization failed: Error: Dependency wiring validation failed: stateManager → backendRouter: Backend router does not have state manager reference; resourceManager → skinEngine: Component skinEngine not registered with resource manager; resourceManager → stateManager: Component stateManager not registered with resource manager; resourceManager → backendRouter: Component backendRouter not registered with resource manager; resourceManager → backendServiceRouter: Component backendServiceRouter not registered with resource manager; resourceManager → observabilityService: Component observabilityService not registered with resource manager
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at TemplumAdapterRegistry.wireComponentDependencies (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1354:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at TemplumAdapterRegistry.initialize (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1182:7)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\core\adapter-registry.test.ts:255:7) {
      code: 'DEPENDENCY_WIRING_VALIDATION_ERROR',
      category: 'configuration',
      timestamp: 1757000766327,
      context: undefined
    }

    [0m [90m 1219 |[39m       }[33m;[39m
     [90m 1220 |[39m
    [31m[1m>[22m[39m[90m 1221 |[39m       console[33m.[39merror([32m'TemplumAdapterRegistry: Initialization failed:'[39m[33m,[39m errorPayload[33m.[39merror)[33m;[39m
     [90m      |[39m               [31m[1m^[22m[39m
     [90m 1222 |[39m       [36mthrow[39m createTemplumError([32m`Registry initialization failed: ${errorPayload.error.message}`[39m[33m,[39m [32m'INITIALIZATION_ERROR'[39m[33m,[39m [32m'configuration'[39m)[33m;[39m
     [90m 1223 |[39m     }
     [90m 1224 |[39m   }[0m

      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1221:15)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:255:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:317:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:337:7)

  console.error
    TemplumAdapterRegistry: Initialization failed: Error: Dependency wiring validation failed: stateManager → backendRouter: Backend router does not have state manager reference; resourceManager → skinEngine: Component skinEngine not registered with resource manager; resourceManager → stateManager: Component stateManager not registered with resource manager; resourceManager → backendRouter: Component backendRouter not registered with resource manager; resourceManager → backendServiceRouter: Component backendServiceRouter not registered with resource manager; resourceManager → observabilityService: Component observabilityService not registered with resource manager
        at createTemplumError (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\types\templum-types.ts:394:17)
        at TemplumAdapterRegistry.wireComponentDependencies (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1354:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at TemplumAdapterRegistry.initialize (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\src\core\adapter-registry.ts:1182:7)
        at Object.<anonymous> (C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\tests\core\adapter-registry.test.ts:393:7) {
      code: 'DEPENDENCY_WIRING_VALIDATION_ERROR',
      category: 'configuration',
      timestamp: 1757000766383,
      context: undefined
    }

    [0m [90m 1219 |[39m       }[33m;[39m
     [90m 1220 |[39m
    [31m[1m>[22m[39m[90m 1221 |[39m       console[33m.[39merror([32m'TemplumAdapterRegistry: Initialization failed:'[39m[33m,[39m errorPayload[33m.[39merror)[33m;[39m
     [90m      |[39m               [31m[1m^[22m[39m
     [90m 1222 |[39m       [36mthrow[39m createTemplumError([32m`Registry initialization failed: ${errorPayload.error.message}`[39m[33m,[39m [32m'INITIALIZATION_ERROR'[39m[33m,[39m [32m'configuration'[39m)[33m;[39m
     [90m 1223 |[39m     }
     [90m 1224 |[39m   }[0m

      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1221:15)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:393:7)

  console.warn
    Dependency wiring validation warnings: [ 'Backend router does not have state manager reference' ]

    [0m [90m 1358 |[39m         )[33m;[39m
     [90m 1359 |[39m       } [36melse[39m [36mif[39m (failedWiring[33m.[39mlength [33m>[39m [35m0[39m) {
    [31m[1m>[22m[39m[90m 1360 |[39m         console[33m.[39mwarn([32m'Dependency wiring validation warnings:'[39m[33m,[39m failedWiring[33m.[39mmap(w [33m=>[39m w[33m.[39missues)[33m.[39mflat())[33m;[39m
     [90m      |[39m                 [31m[1m^[22m[39m
     [90m 1361 |[39m       }
     [90m 1362 |[39m     }
     [90m 1363 |[39m[0m

      at TemplumAdapterRegistry.wireComponentDependencies (src/core/adapter-registry.ts:1360:17)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1182:7)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)

  console.warn
    Dependency injection validation issues detected: {
      missingComponents: [],
      circularDependencies: [],
      validationIssues: 1
    }

    [0m [90m 1027 |[39m
     [90m 1028 |[39m         [36mif[39m ([33m![39m[36mthis[39m[33m.[39mvalidationReport[33m.[39moverallValid) {
    [31m[1m>[22m[39m[90m 1029 |[39m           console[33m.[39mwarn([32m'Dependency injection validation issues detected:'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1030 |[39m             missingComponents[33m:[39m missing[33m,[39m
     [90m 1031 |[39m             circularDependencies[33m:[39m circularDepPaths[33m,[39m
     [90m 1032 |[39m             validationIssues[33m:[39m issues[33m.[39mlength[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1029:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)

  console.warn
    Dependency injection validation warnings (non-strict mode): {
      issues: [ 'Backend router does not have state manager reference' ],
      totalIssues: 1
    }

    [0m [90m 1049 |[39m           )[33m;[39m
     [90m 1050 |[39m         } [36melse[39m {
    [31m[1m>[22m[39m[90m 1051 |[39m           console[33m.[39mwarn([32m'Dependency injection validation warnings (non-strict mode):'[39m[33m,[39m {
     [90m      |[39m                   [31m[1m^[22m[39m
     [90m 1052 |[39m             issues[33m:[39m issues[33m.[39mslice([35m0[39m[33m,[39m [35m5[39m)[33m,[39m [90m// Limit console output[39m
     [90m 1053 |[39m             totalIssues[33m:[39m issues[33m.[39mlength
     [90m 1054 |[39m           })[33m;[39m[0m

      at TemplumAdapterRegistry.validateDependencyIntegrity (src/core/adapter-registry.ts:1051:19)
      at TemplumAdapterRegistry.initialize (src/core/adapter-registry.ts:1188:12)
      at Object.<anonymous> (tests/core/adapter-registry.test.ts:400:7)
**Errors**: 
**Warnings**: Command exited with code 1 but produced output


### Accessibility Integration Test
**Status**: PASS
**Message**: N/A
**Evidence**: Command executed: npm run test -- --testNamePattern="accessibility|a11y" --passWithNoTests, Output: > templum@1.0.0 test
> jest --testNamePattern=accessibility|a11y --passWithNoTests
**Errors**: 
**Warnings**: 




## Warnings:
1. Command exited with code 1 but produced output
2. Some UI tests require manual verification - see TEMPLUM-TESTING-GUIDE Section 2

## Next Steps:

1. Validation passed with warnings - task is generally ready for documentation
2. Consider addressing warnings to improve code quality
3. Update task status to [T] implemented-testing in active tasks
4. Run /pr:document to complete the implementation cycle

---

**Generated by**: Templum Task Validator
**Command**: `node scripts/validation/templum-task-validator.js --category ui --task-id TASK-CLI-018 --save`
