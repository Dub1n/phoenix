#!/usr/bin/env node

/**
 * Test MCP Tool Invocation Patterns for Main Agent
 * 
 * This script validates that the main agent can successfully:
 * 1. Create CLI sessions via MCP tools
 * 2. Navigate CLI interfaces using MCP navigation
 * 3. Send text input to CLI sessions
 * 4. Get current CLI state 
 * 5. Destroy CLI sessions properly
 */

const { initializeMCPChannelWithServiceDiscovery } = require('./dist/index');
const path = require('path');
const os = require('os');

async function testMCPToolInvocation() {
  console.log('🧪 Testing MCP Tool Invocation Patterns...');
  
  const startTime = Date.now();
  let coordinator;
  
  try {
    // Initialize MCP channel
    const options = {
      serviceId: `test-tools-${Date.now()}`,
      serviceName: 'Test MCP Tools',
      healthCheckInterval: 10000, // 10 seconds
      servicesDir: path.join(os.homedir(), '.templum', 'services-test')
    };
    
    coordinator = await initializeMCPChannelWithServiceDiscovery(options);
    await coordinator.start();
    
    console.log('✅ MCP Server started');
    
    // Get the MCP server instance for tool invocation
    const mcpServer = coordinator.mcpServer;
    
    if (!mcpServer) {
      throw new Error('MCP server not available');
    }
    
    console.log('📋 Available Tools:', mcpServer.getAvailableTools());
    
    // Test 1: Create CLI Session
    console.log('\\n🔧 Test 1: Create CLI Session');
    const sessionId = `test-session-${Date.now()}`;
    
    let response = await mcpServer.handleMCPRequest({
      id: 'req-1',
      method: 'tools/call',
      params: {
        name: 'cli-create-session',
        arguments: {
          sessionId: sessionId
        }
      }
    });
    
    console.log('📤 Create Session Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Create session failed: ${response.error.message}`);
    }
    
    console.log('✅ Session created successfully');
    
    // Test 2: Get CLI State
    console.log('\\n🔧 Test 2: Get CLI State');
    
    response = await mcpServer.handleMCPRequest({
      id: 'req-2',
      method: 'tools/call',
      params: {
        name: 'cli-get-state',
        arguments: {
          sessionId: sessionId
        }
      }
    });
    
    console.log('📤 Get State Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Get state failed: ${response.error.message}`);
    }
    
    console.log('✅ State retrieved successfully');
    
    // Test 3: Send Text Input
    console.log('\\n🔧 Test 3: Send Text Input');
    
    response = await mcpServer.handleMCPRequest({
      id: 'req-3', 
      method: 'tools/call',
      params: {
        name: 'cli-send-text',
        arguments: {
          sessionId: sessionId,
          text: 'echo "Hello MCP Tools"'
        }
      }
    });
    
    console.log('📤 Send Text Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Send text failed: ${response.error.message}`);
    }
    
    console.log('✅ Text sent successfully');
    
    // Test 4: Navigate CLI (Enter key)
    console.log('\\n🔧 Test 4: Navigate CLI (Enter)');
    
    response = await mcpServer.handleMCPRequest({
      id: 'req-4',
      method: 'tools/call',
      params: {
        name: 'cli-navigate',
        arguments: {
          sessionId: sessionId,
          action: 'enter'
        }
      }
    });
    
    console.log('📤 Navigate Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Navigate failed: ${response.error.message}`);
    }
    
    console.log('✅ Navigation successful');
    
    // Test 5: Get State After Command
    console.log('\\n🔧 Test 5: Get State After Command Execution');
    
    // Wait a moment for command to execute
    await new Promise(resolve => setTimeout(resolve, 500));
    
    response = await mcpServer.handleMCPRequest({
      id: 'req-5',
      method: 'tools/call',
      params: {
        name: 'cli-get-state',
        arguments: {
          sessionId: sessionId
        }
      }
    });
    
    console.log('📤 Final State Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Final get state failed: ${response.error.message}`);
    }
    
    console.log('✅ Final state retrieved successfully');
    
    // Test 6: Destroy Session
    console.log('\\n🔧 Test 6: Destroy CLI Session');
    
    response = await mcpServer.handleMCPRequest({
      id: 'req-6',
      method: 'tools/call',
      params: {
        name: 'cli-destroy-session',
        arguments: {
          sessionId: sessionId
        }
      }
    });
    
    console.log('📤 Destroy Session Response:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      throw new Error(`Destroy session failed: ${response.error.message}`);
    }
    
    console.log('✅ Session destroyed successfully');
    
    const totalTime = Date.now() - startTime;
    console.log(`\\n🎉 All MCP tool tests passed successfully in ${totalTime}ms`);
    
    return {
      success: true,
      toolsWorking: true,
      sessionLifecycle: true,
      textInput: true,
      navigation: true,
      stateRetrieval: true,
      duration: totalTime
    };
    
  } catch (error) {
    console.error('❌ MCP tool test failed:', error);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  } finally {
    // Clean up
    if (coordinator) {
      try {
        await coordinator.stop();
        console.log('🧹 Cleanup completed');
      } catch (error) {
        console.error('⚠️ Cleanup error:', error);
      }
    }
  }
}

// Run the test
testMCPToolInvocation()
  .then(result => {
    console.log('\\n📊 Final Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });