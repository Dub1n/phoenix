#!/usr/bin/env node

/**
 * Clean build artefacts before running the TypeScript compiler.
 * Removes the incremental build info and the compiled output directory
 * so tsc always emits fresh outputs even when the previous dist folder
 * has been deleted or partially regenerated.
 */

const fs = require('fs');
const path = require('path');

const targets = ['dist', '.tsbuildinfo'];

for (const target of targets) {
  const targetPath = path.join(process.cwd(), target);

  if (!fs.existsSync(targetPath)) {
    continue;
  }

  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`[clean-build-artifacts] Failed to remove ${targetPath}:`, error);
  }
}
