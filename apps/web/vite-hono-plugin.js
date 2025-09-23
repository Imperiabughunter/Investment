// vite-hono-plugin.js
// This plugin ensures Hono instances have the fetch method available

export default function honoFetchPlugin() {
  return {
    name: 'vite-plugin-hono-fetch',
    enforce: 'pre',
    
    // Apply early in the build process
    configResolved(config) {
      console.log('[vite-plugin-hono-fetch] Plugin initialized');
    },
    
    // Transform Hono imports to include our patch
    transform(code, id) {
      // Only transform files that import Hono
      if (code.includes('import') && code.includes('hono')) {
        // Add our patch code to ensure fetch method is available
        const patchCode = `
// Patching Hono.prototype to ensure fetch method is available
import { Hono } from 'hono';
if (!Hono.prototype.fetch) {
  Hono.prototype.fetch = function(request, env, executionContext) {
    return this.request(request, env, executionContext);
  };
  console.log('[vite-plugin-hono-fetch] Successfully patched Hono.prototype.fetch');
}
`;
        
        // Add the patch code at the beginning of the file
        return {
          code: patchCode + code,
          map: null
        };
      }
      
      return null; // Return null to keep the original code for other files
    }
  };
}