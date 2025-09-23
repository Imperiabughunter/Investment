/**
 * Metro Fix Script
 * Addresses common Metro/Expo timeout issues
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Paths
const METRO_CONFIG_PATH = path.join(__dirname, 'metro.config.js');

// Update Metro configuration
function updateMetroConfig() {
  console.log('Updating Metro configuration...');
  
  try {
    // Read the current Metro config
    let metroConfig = fs.readFileSync(METRO_CONFIG_PATH, 'utf8');
    
    // Add timeout configuration if not present
    if (!metroConfig.includes('maxWorkers:')) {
      const insertPosition = metroConfig.lastIndexOf('module.exports = config;');
      if (insertPosition !== -1) {
        const updatedConfig = [
          metroConfig.slice(0, insertPosition),
          `// Timeout and performance optimizations
config.server = {
  ...config.server,
  port: process.env.EXPO_METRO_PORT || 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase timeout for all requests
      req.setTimeout(120000); // 2 minutes
      return middleware(req, res, next);
    };
  },
};

// Increase worker count for faster builds
config.maxWorkers = 4;

`,
          metroConfig.slice(insertPosition),
        ].join('');
        
        fs.writeFileSync(METRO_CONFIG_PATH, updatedConfig);
        console.log('✅ Updated Metro config with timeout optimizations');
      } else {
        console.log('⚠️ Could not find insertion point in Metro config');
      }
    } else {
      console.log('✅ Metro config already contains optimizations');
    }
  } catch (error) {
    console.error('Error updating Metro config:', error.message);
  }
}

// Run all fixes
console.log('=== Applying Metro/Expo Fixes ===');
updateMetroConfig();
console.log('\n=== Fix Complete ===');
console.log('To start the app with the new configuration, run: npm run start');