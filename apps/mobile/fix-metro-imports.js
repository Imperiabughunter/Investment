/**
 * Fix for Metro module import locations plugin error
 */

const fs = require('fs');
const path = require('path');

// Create a mock implementation of the missing module
const mockDir = path.join(
  __dirname,
  'node_modules',
  'metro',
  'src',
  'ModuleGraph',
  'worker'
);

// Create directory structure if it doesn't exist
if (!fs.existsSync(mockDir)) {
  fs.mkdirSync(mockDir, { recursive: true });
  console.log('Created directory structure for mock implementation');
}

// Create the missing module file
const mockFilePath = path.join(mockDir, 'importLocationsPlugin.js');
const mockContent = `
/**
 * Mock implementation of importLocationsPlugin
 * This resolves the "Cannot find module 'metro/src/ModuleGraph/worker/importLocationsPlugin'" error
 */

module.exports = function importLocationsPlugin() {
  return {
    visitor: {
      ImportDeclaration(path) {
        // Simple mock implementation
        return;
      },
      ExportNamedDeclaration(path) {
        // Simple mock implementation
        return;
      },
      ExportAllDeclaration(path) {
        // Simple mock implementation
        return;
      }
    }
  };
};
`;

fs.writeFileSync(mockFilePath, mockContent);
console.log('✅ Successfully created mock implementation for importLocationsPlugin');
console.log('You can now run: pnpm --filter mobile build:android');