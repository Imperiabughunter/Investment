/**
 * Fix for Metro module import locations plugin error
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

// Create the missing module directory structure
const targetDir = path.join(
  __dirname,
  'node_modules',
  'metro',
  'src',
  'ModuleGraph',
  'worker'
);

// Create the directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  console.log('Creating directory structure:', targetDir);
  mkdirp.sync(targetDir);
}

// Path to create the missing plugin file
const pluginFilePath = path.join(targetDir, 'importLocationsPlugin.js');

// Create a mock implementation of the missing module
const mockImplementation = `
/**
 * Mock implementation of importLocationsPlugin
 * This is a workaround for the missing module in metro
 */

function importLocationsPlugin() {
  return {
    visitor: {
      ImportDeclaration(path) {
        // Simple mock implementation that does nothing
        return;
      },
      ExportNamedDeclaration(path) {
        // Simple mock implementation that does nothing
        return;
      },
      ExportAllDeclaration(path) {
        // Simple mock implementation that does nothing
        return;
      }
    }
  };
}

module.exports = importLocationsPlugin;
module.exports.default = importLocationsPlugin;
`;

// Write the mock implementation to the file
fs.writeFileSync(pluginFilePath, mockImplementation);
console.log('Created mock implementation at:', pluginFilePath);
console.log('Fix applied successfully!');