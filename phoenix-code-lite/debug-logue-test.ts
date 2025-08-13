import logue from 'logue';
import path from 'path';

async function testMinimal() {
  console.log('Testing minimal script with logue...');
  
  const scriptPath = path.join(__dirname, 'debug-minimal.js');
  
  // Set NODE_ENV=test for child process
  process.env.NODE_ENV = 'test';
  
  const app = logue('node', [scriptPath]);
  
  await app.waitFor('About to exit...');
  console.log('✓ Found exit message');
  
  console.log('Calling app.end()...');
  const result = await app.end();
  
  console.log('✓ app.end() completed!');
  console.log('Result:', {
    stdout: result.stdout
  });
}

testMinimal().catch(console.error);