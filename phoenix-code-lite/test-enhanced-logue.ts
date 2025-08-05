import { enhancedLogue } from './src/utils/logue-wrapper';
import path from 'path';

async function testEnhancedLogue() {
  console.log('Testing enhanced logue with proper cleanup...');
  
  const CLI_PATH = path.join(__dirname, 'dist/src/index.js');
  process.env.NODE_ENV = 'test';
  
  const app = enhancedLogue('node', [CLI_PATH, 'config', '--show']);
  
  await app.waitFor('Phoenix Code Lite Configuration');
  console.log('✅ Found expected text');
  
  console.log('Calling enhanced end()...');
  const result = await app.end();
  
  console.log('✅ Enhanced end() completed!');
  console.log('Result status:', result.status);
  console.log('Has stdout:', !!result.stdout);
  
  console.log('Process should exit cleanly now...');
}

testEnhancedLogue().catch(console.error);