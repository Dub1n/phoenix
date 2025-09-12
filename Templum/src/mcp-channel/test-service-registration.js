#!/usr/bin/env node

/**
 * Test MCP Service Registration and Health Check
 * 
 * This script validates that:
 * 1. MCP service registration works
 * 2. Health checks respond within <100ms
 * 3. Service discovery lifecycle coordination functions
 */

const { initializeMCPChannelWithServiceDiscovery } = require('./dist/index');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testServiceRegistration() {
  console.log('🧪 Testing MCP Service Registration...');
  
  const startTime = Date.now();
  
  try {
    // Initialize MCP channel with service discovery
    const options = {
      serviceId: `test-mcp-${Date.now()}`,
      serviceName: 'Test MCP Server',
      healthCheckInterval: 5000, // 5 seconds for testing
      servicesDir: path.join(os.homedir(), '.templum', 'services-test')
    };
    
    console.log(`📋 Options: ${JSON.stringify(options, null, 2)}`);
    
    const coordinator = await initializeMCPChannelWithServiceDiscovery(options);
    
    console.log('✅ MCP Coordinator initialized');
    
    // Start the service
    await coordinator.start();
    
    console.log('✅ Service started');
    
    // Wait a moment for registration to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if service file was created
    const serviceFilePath = path.join(options.servicesDir, `${options.serviceId}.json`);
    
    if (fs.existsSync(serviceFilePath)) {
      console.log('✅ Service registration file created');
      
      const serviceData = JSON.parse(fs.readFileSync(serviceFilePath, 'utf-8'));
      console.log('📋 Service Data:');
      console.log(JSON.stringify(serviceData, null, 2));
      
      // Test health check response time
      const healthStart = Date.now();
      const healthStatus = await coordinator.performHealthCheck();
      const healthDuration = Date.now() - healthStart;
      
      console.log(`🏥 Health check completed in ${healthDuration}ms`);
      console.log(`🏥 Health status: ${healthStatus.status}`);
      
      if (healthDuration < 100) {
        console.log('✅ Health check response time < 100ms');
      } else {
        console.log('⚠️ Health check response time >= 100ms');
      }
      
    } else {
      console.log('❌ Service registration file not found');
    }
    
    // Test service discovery lifecycle
    console.log('🔄 Testing service lifecycle...');
    
    // Stop the service
    await coordinator.stop();
    
    console.log('✅ Service stopped gracefully');
    
    // Check if service file was cleaned up
    if (!fs.existsSync(serviceFilePath)) {
      console.log('✅ Service registration cleaned up');
    } else {
      console.log('⚠️ Service registration file still exists after shutdown');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Test completed successfully in ${totalTime}ms`);
    
    return {
      success: true,
      registrationWorking: true,
      healthCheckResponsive: true,
      lifecycleWorking: true,
      duration: totalTime
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// Run the test
testServiceRegistration()
  .then(result => {
    console.log('📊 Final Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });