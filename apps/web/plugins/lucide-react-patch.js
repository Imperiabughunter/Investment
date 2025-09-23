import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

/**
 * A Vite plugin that patches Lucide React to ensure it has a default export
 * This fixes the "default is not exported by lucide-react" error during build
 */
export function lucideReactPatch() {
  return {
    name: 'vite-plugin-lucide-react-patch',
    enforce: 'pre',
    
    // Apply early in the build process
    configResolved(config) {
      console.log('[lucide-react-patch] Plugin initialized');
      
      // Ensure the src/lucide-react directory exists
      const lucideReactDir = path.resolve(process.cwd(), 'src/lucide-react');
      if (!fs.existsSync(lucideReactDir)) {
        fs.mkdirSync(lucideReactDir, { recursive: true });
        console.log(`[lucide-react-patch] Created directory: ${lucideReactDir}`);
      }
      
      // Create or update the package.json file
      const packageJsonPath = path.join(lucideReactDir, 'package.json');
      const packageJson = {
        "name": "lucide-react-mock",
        "version": "1.0.0",
        "description": "Mock implementation of lucide-react",
        "main": "index.js",
        "type": "module"
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`[lucide-react-patch] Created package.json at: ${packageJsonPath}`);
    },
    
    // Transform Lucide React imports
    transform(code, id) {
      // Only transform Lucide React imports
      if (id.includes('lucide-react') && id.endsWith('.js')) {
        // Check if the file already has a default export
        if (!code.includes('export default') && !code.includes('exports.default =')) {
          // Add a default export that includes all named exports
          const patchCode = `
// Add default export to fix build issues
const LucideReactDefault = {};
Object.keys(exports).forEach(key => {
  LucideReactDefault[key] = exports[key];
});
exports.default = LucideReactDefault;
`;
          // Append the patch code to the end of the file
          return {
            code: code + patchCode,
            map: null
          };
        }
      }
      return null;
    },
    
    // Also handle ESM imports
    resolveId(source) {
      if (source === 'lucide-react') {
        // Check if our custom implementation exists
        const customImplementationPath = path.resolve(process.cwd(), 'src/lucide-react/index.js');
        if (fs.existsSync(customImplementationPath)) {
          return { id: customImplementationPath, moduleSideEffects: true };
        }
        return { id: source, moduleSideEffects: true };
      }
      return null;
    }
  };
}