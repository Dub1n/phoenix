/**
 * HTTP Core Engine Integration Test
 * 
 * Simple test to validate the HTTP-first Core Engine integration
 * with the Haruspex Backend Service.
 */

const { HaruspexCoreEngine } = require('./src/core/haruspex-core-engine');

async function testHttpIntegration() {
  console.log('🧪 Testing HTTP-Compatible Core Engine Integration...\n');
  
  try {
    // Test 1: Core Engine Initialization
    console.log('1️⃣ Testing Core Engine Initialization...');
    
    const config = {
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 5000,
        monitorWindow: 10000
      },
      errorBoundary: {
        isolationStrategy: 'component',
        recoveryStrategy: 'graceful-degradation',
        maxRetries: 2
      },
      telemetry: {
        privacyCompliant: true,
        performanceMetrics: true,
        errorReporting: true,
        logLevel: 'info'
      },
      fileMonitoring: {
        enabled: false
      },
      analysis: {
        timeout: 30000,
        maxConcurrentRequests: 5,
        cacheEnabled: true,
        cacheTtl: 300000
      }
    };
    
    const coreEngine = new HaruspexCoreEngine(process.cwd(), config);
    await coreEngine.initialize();
    console.log('✅ Core Engine initialized successfully');
    
    // Test 2: HTTP-Compatible Analysis Method
    console.log('\n2️⃣ Testing HTTP-Compatible Analysis...');
    
    const analysisRequest = {
      code: `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        const result = fibonacci(10);
        console.log('Result:', result);
      `,
      language: 'javascript',
      depth: 'standard',
      contentHash: 'test_hash_123',
      filePath: 'test.js'
    };
    
    const analysisResult = await coreEngine.analyzeCode(analysisRequest);
    console.log('✅ Analysis completed:', {
      sessionId: analysisResult.sessionId,
      overallScore: analysisResult.overallScore.overall,
      executionTime: analysisResult.executionTime + 'ms',
      linesAnalyzed: analysisResult.coverageMetrics.analyzedLines
    });
    
    // Test 3: HTTP-Compatible Prediction Method
    console.log('\n3️⃣ Testing HTTP-Compatible Prediction...');
    
    const predictionRequest = {
      codeContext: {
        projectPath: process.cwd(),
        files: ['test.js'],
        dependencies: { production: {}, development: {} },
        configuration: {
          language: 'javascript',
          framework: 'node',
          buildTool: 'npm'
        }
      },
      timeHorizon: '30d',
      predictionTypes: ['pattern-evolution', 'bug-prediction']
    };
    
    const predictionResult = await coreEngine.predictCodeEvolution(predictionRequest);
    console.log('✅ Prediction completed:', {
      sessionId: predictionResult.sessionId,
      confidence: predictionResult.confidence,
      timeHorizon: predictionResult.timeHorizon,
      overallRisk: predictionResult.overallRisk.level
    });
    
    // Test 4: System Diagnostics
    console.log('\n4️⃣ Testing System Diagnostics...');
    
    const diagnostics = await coreEngine.getSystemDiagnostics();
    console.log('✅ Diagnostics retrieved:', {
      coreEngineStatus: diagnostics.coreEngine.status,
      analysisEngineStatus: diagnostics.analysisEngine.status,
      predictionEngineStatus: diagnostics.predictionEngine.status,
      memoryUsage: diagnostics.performance.memoryUsage + 'MB'
    });
    
    // Test 5: Templum Skin Definition
    console.log('\n5️⃣ Testing Templum Skin Definition...');
    
    const skinDefinition = await coreEngine.provideSkinDefinition();
    console.log('✅ Skin definition generated:', {
      id: skinDefinition.id,
      version: skinDefinition.version,
      name: skinDefinition.name,
      commandsCount: Object.keys(skinDefinition.commands).length,
      capabilities: skinDefinition.capabilities.slice(0, 3).join(', ') + '...'
    });
    
    // Test 6: Health Status
    console.log('\n6️⃣ Testing Health Status...');
    
    const healthStatus = coreEngine.getHealthStatus();
    console.log('✅ Health status retrieved:', {
      overall: healthStatus.overall,
      circuitBreaker: healthStatus.components.circuitBreaker,
      telemetry: healthStatus.components.telemetry,
      averageResponseTime: healthStatus.metrics?.averageResponseTime + 'ms'
    });
    
    // Cleanup
    coreEngine.dispose();
    
    console.log('\n🎉 HTTP Core Engine Integration Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Core Engine initialization');
    console.log('   ✅ HTTP-compatible code analysis');
    console.log('   ✅ HTTP-compatible prediction generation');
    console.log('   ✅ System diagnostics retrieval');
    console.log('   ✅ Templum skin definition generation');
    console.log('   ✅ Health status monitoring');
    console.log('\n🚀 Ready for Backend Service integration!');
    
  } catch (error) {
    console.error('\n❌ HTTP Integration Test FAILED:', error.message);
    console.error('\n🔍 Error Details:', error.stack);
    process.exit(1);
  }
}

// Run the integration test
if (require.main === module) {
  testHttpIntegration().catch(console.error);
}

module.exports = { testHttpIntegration };