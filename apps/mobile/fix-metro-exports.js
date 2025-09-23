/**
 * This script patches the Metro package.json to expose the TerminalReporter path
 */
const fs = require('fs');
const path = require('path');

// Path to the Metro package.json
const metroPackagePath = path.resolve(
  __dirname,
  '../../node_modules/.pnpm/node_modules/metro/package.json'
);

console.log('Patching Metro package.json at:', metroPackagePath);

try {
  // Read the current package.json
  const packageJson = require(metroPackagePath);
  
  // Add the TerminalReporter to exports
  if (packageJson.exports) {
    packageJson.exports['./src/lib/TerminalReporter'] = './src/lib/TerminalReporter.js';
    console.log('Added TerminalReporter to exports');
  } else {
    console.error('No exports field found in Metro package.json');
    process.exit(1);
  }
  
  // Write the updated package.json back
  fs.writeFileSync(metroPackagePath, JSON.stringify(packageJson, null, 2));
  console.log('Successfully patched Metro package.json');
} catch (error) {
  console.error('Failed to patch Metro package.json:', error);
  process.exit(1);
}