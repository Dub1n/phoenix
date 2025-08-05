const logue = require('logue');
const path = require('path');

test('debug logue environment variables', async () => {
  console.log('Testing logue environment setup...');
  
  const app = logue('node', [path.join(__dirname, 'debug-env.js')]);
  
  try {
    // Wait a bit for output
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Logue stdout so far:', app.stdout);
    
    const result = await app.end();
    console.log('Final stdout:', result.stdout);
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Current stdout:', app.stdout);
  }
}, 10000);