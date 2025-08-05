import logue from 'logue';
import path from 'path';

async function testLogueCleanup() {
  console.log('Testing logue with manual cleanup...');
  
  const CLI_PATH = path.join(__dirname, 'dist/src/index.js');
  process.env.NODE_ENV = 'test';
  
  const app = logue('node', [CLI_PATH, 'config', '--show']);
  
  await app.waitFor('Phoenix Code Lite Configuration');
  console.log('✅ Found expected text');
  
  // Access the internal process for manual cleanup
  const logueInternal = app as any;
  const childProcess = logueInternal.proc;
  
  console.log('Child process PID:', childProcess.pid);
  console.log('Child process connected:', childProcess.connected);
  
  try {
    // Try graceful cleanup first
    if (childProcess.stdin && !childProcess.stdin.destroyed) {
      childProcess.stdin.end();
    }
    
    // Wait a moment for natural exit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force cleanup if still running
    if (!childProcess.killed) {
      console.log('Force killing child process...');
      childProcess.kill('SIGTERM');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!childProcess.killed) {
        console.log('Force killing with SIGKILL...');
        childProcess.kill('SIGKILL');
      }
    }
    
    // Manually remove all listeners
    childProcess.removeAllListeners();
    
    console.log('✅ Manual cleanup completed');
    
  } catch (error) {
    console.error('Cleanup error:', error);
  }
  
  console.log('Test completed, process should exit cleanly now');
}

testLogueCleanup().catch(console.error);