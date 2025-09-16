/**
 * This script helps optimize large modules by analyzing imports and dependencies
 * to identify potential circular dependencies and suggest module splitting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROBLEMATIC_MODULES = [
  path.resolve(__dirname, '../__create/index.ts'),
  path.resolve(__dirname, '../__create/adapter.ts'),
];

const MAX_MODULE_SIZE = 100 * 1024; // 100KB

// Helper functions
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error.message);
    return 0;
  }
}

function analyzeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+(?:{[^}]*}\s+from\s+)?['"](.*)['"];?/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch (error) {
    console.error(`Error analyzing imports for ${filePath}:`, error.message);
    return [];
  }
}

function suggestModuleSplitting(filePath) {
  const fileSize = getFileSize(filePath);
  if (fileSize > MAX_MODULE_SIZE) {
    console.log(`\n[WARNING] Module is too large: ${filePath} (${(fileSize / 1024).toFixed(2)}KB)`); 
    console.log('Suggestion: Split this module into smaller modules');
    
    // Analyze imports to find potential splitting points
    const imports = analyzeImports(filePath);
    console.log(`Found ${imports.length} imports in this module`);
    
    // Group imports by type (node built-ins, npm packages, local modules)
    const nodeBuiltins = imports.filter(imp => !imp.startsWith('.') && !imp.startsWith('@'));
    const npmPackages = imports.filter(imp => imp.startsWith('@') || (!imp.startsWith('.') && !nodeBuiltins.includes(imp)));
    const localModules = imports.filter(imp => imp.startsWith('.'));
    
    console.log('Suggested splitting strategy:');
    console.log('1. Create separate modules for these groups:');
    console.log(`   - Core functionality (keep in ${path.basename(filePath)})`); 
    console.log('   - External dependencies (move to a new file)'); 
    console.log('   - Local utilities (move to a new file)'); 
    console.log('2. Use dynamic imports for non-critical functionality');
  }
}

// Main execution
console.log('=== Module Optimization Analysis ===');

PROBLEMATIC_MODULES.forEach(modulePath => {
  if (fs.existsSync(modulePath)) {
    console.log(`\nAnalyzing: ${modulePath}`);
    suggestModuleSplitting(modulePath);
  } else {
    console.error(`Module not found: ${modulePath}`);
  }
});

console.log('\n=== Optimization Complete ===');
console.log('Run this script periodically to identify modules that may cause timeout issues.');