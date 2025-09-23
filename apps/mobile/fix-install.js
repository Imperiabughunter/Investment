/**
 * Fix Installation Script
 * This script helps resolve package installation issues by using npm directly
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clean up problematic directories
try {
  console.log('Cleaning up node_modules...');
  const nodeModulesPath = path.resolve(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
} catch (error) {
  console.error('Error cleaning node_modules:', error);
}

// Install packages with npm
try {
  console.log('Installing TypeScript and React Native types...');
  execSync('npm install --save-dev typescript @types/react-native', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Installing Expo CLI...');
  execSync('npm install --save-dev @expo/cli@latest', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Installation completed successfully!');
} catch (error) {
  console.error('Installation error:', error);
}