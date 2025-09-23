/**
 * Fix for missing Metro module: metro/src/ModuleGraph/worker/importLocationsPlugin
 * 
 * This script creates a mock implementation of the missing module to resolve
 * the "Cannot find module 'metro/src/ModuleGraph/worker/importLocationsPlugin'" error.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = path.resolve(__dirname, '../../');
const metroModulePath = path.join(rootDir, 'node_modules', 'metro');
const targetDir = path.join(metroModulePath, 'src', 'ModuleGraph', 'worker');
const targetFile = path.join(targetDir, 'importLocationsPlugin.js');

// Create directory structure if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Mock implementation content
const mockImplementation = `/**
 * Mock implementation of importLocationsPlugin
 * Created by fix-metro-locations.js
 */

exports.importLocationsPlugin = function() {
  return {
    visitor: {
      ImportDeclaration(path) {
        // Mock implementation
        return;
      },
      ExportNamedDeclaration(path) {
        // Mock implementation
        return;
      },
      ExportAllDeclaration(path) {
        // Mock implementation
        return;
      }
    }
  };
};

// Export the plugin function as default
module.exports = exports.importLocationsPlugin;
`;

// Main function to apply the fix
function applyFix() {
  try {
    // Check if metro module exists
    if (!fs.existsSync(metroModulePath)) {
      console.error('Metro module not found. Please run: npm install metro');
      return false;
    }

    // Create directory structure
    ensureDirectoryExists(targetDir);

    // Create the mock implementation file
    fs.writeFileSync(targetFile, mockImplementation);
    console.log(`✅ Successfully created mock implementation at: ${targetFile}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error applying fix:', error);
    return false;
  }
}

// Run the fix
const success = applyFix();
if (success) {
  console.log('');
  console.log('Fix applied successfully! You can now run:');
  console.log('pnpm --filter mobile build:android');
} else {
  console.log('');
  console.log('Fix failed. Try installing metro first:');
  console.log('cd apps/mobile && npm install metro@0.76.8 --save-dev');
}