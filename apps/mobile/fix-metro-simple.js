/**
 * Simple fix for missing Metro module
 */

const fs = require('fs');
const path = require('path');

// Create the directory structure and file
const rootDir = path.resolve(__dirname, '../../');
const targetDir = path.join(rootDir, 'node_modules', 'metro', 'src', 'ModuleGraph', 'worker');
const targetFile = path.join(targetDir, 'importLocationsPlugin.js');

// Create directories
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Create the mock implementation file
const mockContent = `
// Mock implementation
exports.importLocationsPlugin = function() {
  return {
    visitor: {
      ImportDeclaration() {},
      ExportNamedDeclaration() {},
      ExportAllDeclaration() {}
    }
  };
};

module.exports = exports.importLocationsPlugin;
`;

fs.writeFileSync(targetFile, mockContent);
console.log(`✅ Created mock implementation at: ${targetFile}`);
console.log('You can now run: pnpm --filter mobile build:android');