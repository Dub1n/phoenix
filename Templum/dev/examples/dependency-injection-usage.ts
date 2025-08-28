/**---
 * title: [Dependency Injection Usage Example]
 * tags: [Example, DependencyInjection, Core, Usage]
 * provides: [Usage Examples, Configuration Examples]
 * requires: [TemplumCore, Adapter Registry]
 * description: [Demonstrates how to use the new adapter-based dependency injection system]
 * ---*/

import { TemplumCore } from '../src/core/templum-core';
import { 
  IDependencyInjectionConfig,
  ISkinEngine,
  IStateManager 
} from '../src/interfaces/core-component-interfaces';
import { TemplumConfiguration } from '../src/types/templum-types';

/**
 * Example 1: Basic Usage with Default Components
 */
export async function basicDependencyInjectionExample(): Promise<void> {
  console.log('=== Basic Dependency Injection Example ===');
  
  // Create TemplumCore with default dependency injection
  const templumCore = new TemplumCore(
    {
      maxConcurrentSessions: 5,
      performanceMetrics: true
    },
    {
      enableSkinEngine: true,
      enableStateManager: true,
      enableBackendRouter: true,
      enableBackendServiceRouter: true
    }
  );

  try {
    // Initialize with dependency injection
    await templumCore.initialize();
    console.log('✅ TemplumCore initialized with dependency injection');
    
    // Use injected dependencies
    const skinEngine = templumCore.getUniversalSkinEngine();
    const backendRouter = templumCore.getBackendRouter();
    
    console.log('✅ Dependencies successfully injected and accessible');
    
    // Demonstrate skin loading via dependency injection
    const skinDefinition = await templumCore.loadBackendSkin('pcl');
    console.log('✅ Backend skin loaded via dependency injection:', !!skinDefinition);
    
    // Clean shutdown
    await templumCore.shutdown();
    console.log('✅ Clean shutdown with dependency disposal complete');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

/**
 * Example 2: Custom Component Factories
 */
export async function customFactoryExample(): Promise<void> {
  console.log('\n=== Custom Factory Example ===');
  
  // Custom skin engine implementation
  class CustomSkinEngine implements ISkinEngine {
    async initialize(): Promise<void> {
      console.log('Custom Skin Engine initialized');
    }
    
    async validateSkin(): Promise<boolean> {
      console.log('Custom skin validation');
      return true;
    }
    
    generateSkinHTML(): string {
      return '<div>Custom generated HTML</div>';
    }
  }
  
  // Custom state manager implementation
  class CustomStateManager implements IStateManager {
    async initialize(): Promise<void> {
      console.log('Custom State Manager initialized');
    }
    
    getCurrentState(): any {
      return { custom: true, timestamp: Date.now() };
    }
  }
  
  // Configuration with custom factories
  const customConfig: IDependencyInjectionConfig = {
    enableSkinEngine: true,
    enableStateManager: true,
    enableBackendRouter: false, // Disable backend router
    enableBackendServiceRouter: true,
    customFactories: {
      skinEngine: () => new CustomSkinEngine(),
      stateManager: () => new CustomStateManager()
    }
  };
  
  const templumCore = new TemplumCore({}, customConfig);
  
  try {
    await templumCore.initialize();
    console.log('✅ TemplumCore initialized with custom factories');
    
    // Test custom components
    const skinEngine = templumCore.getUniversalSkinEngine();
    const isValid = await skinEngine.validateSkin?.({});
    console.log('✅ Custom skin validation result:', isValid);
    
    await templumCore.shutdown();
    console.log('✅ Custom factory example complete');
    
  } catch (error) {
    console.error('❌ Custom factory example failed:', error);
  }
}

/**
 * Example 3: Component-Specific Configuration
 */
export async function componentSpecificConfigExample(): Promise<void> {
  console.log('\n=== Component-Specific Configuration Example ===');
  
  // Different configuration for different components
  const config: IDependencyInjectionConfig = {
    enableSkinEngine: true,
    enableStateManager: true,
    enableBackendRouter: true,
    enableBackendServiceRouter: false // Disable backend service router
  };
  
  const templumCore = new TemplumCore(
    {
      performanceMetrics: false, // Disable performance metrics
      enableHealthMonitoring: true
    },
    config
  );
  
  try {
    await templumCore.initialize();
    console.log('✅ TemplumCore initialized with selective component configuration');
    
    // Verify which components are available
    try {
      const skinEngine = templumCore.getUniversalSkinEngine();
      console.log('✅ Skin engine available');
    } catch (error) {
      console.log('ℹ️ Skin engine not available:', error);
    }
    
    try {
      const backendRouter = templumCore.getBackendRouter(); 
      console.log('✅ Backend router available');
    } catch (error) {
      console.log('ℹ️ Backend router not available:', error);
    }
    
    await templumCore.shutdown();
    console.log('✅ Selective configuration example complete');
    
  } catch (error) {
    console.error('❌ Configuration example failed:', error);
  }
}

/**
 * Run all dependency injection examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Dependency Injection Examples\n');
  
  await basicDependencyInjectionExample();
  await customFactoryExample(); 
  await componentSpecificConfigExample();
  
  console.log('\n🎉 All dependency injection examples completed successfully!');
  console.log('\n📋 Key Benefits Demonstrated:');
  console.log('• ✅ Reduced hardcoded dependencies in TemplumCore');
  console.log('• ✅ Flexible component configuration and customization');
  console.log('• ✅ Clean separation of concerns through interfaces');
  console.log('• ✅ Easy testing with mock implementations');
  console.log('• ✅ Proper resource disposal and cleanup');
  console.log('• ✅ PCL adapter pattern successfully applied to Templum');
}

// Export for module usage
export {
  basicDependencyInjectionExample as basic,
  customFactoryExample as custom,
  componentSpecificConfigExample as selective
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}