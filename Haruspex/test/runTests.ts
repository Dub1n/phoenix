import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
  const currentDir = path.dirname(__filename);
  await runTests({
    extensionDevelopmentPath: path.resolve(currentDir, '..'),
    extensionTestsPath: currentDir
  });
}

main();