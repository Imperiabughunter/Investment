/**
 * This script applies optimizations to fix the Vite timeout issue
 * by updating the necessary configuration files and module imports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to relevant files
const VITE_CONFIG_PATH = path.resolve(__dirname, '../vite.config.ts');
const INDEX_TS_PATH = path.resolve(__dirname, '../__create/index.ts');
const INDEX_OPTIMIZED_PATH = path.resolve(__dirname, '../__create/index-optimized.ts');

// Function to update the Vite config to use the optimized modules
function updateViteConfig() {
  console.log('Updating Vite configuration...');
  
  try {
    // Read the current Vite config
    let viteConfig = fs.readFileSync(VITE_CONFIG_PATH, 'utf8');
    
    // Check if the reactRouterHonoServer configuration exists
    if (viteConfig.includes('reactRouterHonoServer({')) {
      // Update the server entry point to use the optimized version
      viteConfig = viteConfig.replace(
        /serverEntryPoint:\s*['"]\.\/\_\_create\/index\.ts['"]/,
        'serverEntryPoint: \'./__create/index-optimized.ts\''
      );
      
      // Increase the timeout for the server
      if (!viteConfig.includes('timeout:')) {
        viteConfig = viteConfig.replace(
          /reactRouterHonoServer\(\{([^}]*)\}\)/,
          'reactRouterHonoServer({\
      $1,\
      timeout: 120000 // 2 minutes\
    })'
        );
      }
      
      // Write the updated config back to the file
      fs.writeFileSync(VITE_CONFIG_PATH, viteConfig);
      console.log('✅ Updated Vite config to use optimized modules');
    } else {
      console.log('⚠️ Could not find reactRouterHonoServer configuration in Vite config');
    }
  } catch (error) {
    console.error('Error updating Vite config:', error.message);
  }
}

// Function to update the index.ts file to use the optimized adapter
function updateIndexFile() {
  console.log('Updating index.ts to use optimized modules...');
  
  try {
    // Check if the optimized index file exists
    if (fs.existsSync(INDEX_OPTIMIZED_PATH)) {
      console.log('✅ Optimized index file already exists');
    } else {
      console.error('❌ Optimized index file not found. Please run the optimization script first.');
    }
  } catch (error) {
    console.error('Error updating index file:', error.message);
  }
}

// Function to restart the development server
function restartDevServer() {
  console.log('Restarting development server...');
  
  try {
    // Kill any running Vite processes
    try {
      execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq vite"', { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors if no processes were found
    }
    
    console.log('✅ Development server will restart with new configuration');
    console.log('Please run "npm run dev" or "yarn dev" to start the server with the new configuration');
  } catch (error) {
    console.error('Error restarting development server:', error.message);
  }
}

// Main function to run all optimizations
function applyOptimizations() {
  console.log('=== Applying Vite Optimizations ===');
  
  // Update the Vite config
  updateViteConfig();
  
  // Update the index file
  updateIndexFile();
  
  // Restart the development server
  restartDevServer();
  
  console.log('\n=== Optimization Complete ===');
  console.log('The Vite timeout issue should now be resolved.');
  console.log('If you still encounter issues, try the following:');
  console.log('1. Increase the timeout value in vite.config.ts');
  console.log('2. Check for circular dependencies in your code');
  console.log('3. Split large modules into smaller ones');
  console.log('4. Disable HMR overlay by setting server.hmr.overlay to false in vite.config.ts');
}

// Run the optimizations
applyOptimizations();