import type { Plugin } from 'vite';

/**
 * A Vite plugin that patches the Hono application to ensure app.fetch is available
 * This fixes the "app.fetch is not a function" error in the Hono Vite dev server
 * Enhanced with more robust patching mechanisms
 */
export function honoFetchPatch(): Plugin {
  return {
    name: 'vite-hono-fetch-patch',
    apply: 'serve',
    enforce: 'pre',
    
    transform(code, id) {
      // Only transform Hono imports
      if (id.includes('hono') && (id.endsWith('.js') || id.endsWith('.mjs') || id.endsWith('.ts'))) {
        // Add the fetch method to Hono prototype if it doesn't exist
        const patchCode = `
// Enhanced patch for app.fetch is not a function error
(function patchHono() {
  if (typeof Hono !== 'undefined' && Hono.prototype && !Hono.prototype.fetch) {
    Hono.prototype.fetch = function(request, env, executionContext) {
      return this.request(request, env, executionContext);
    };
    console.log('[hono-fetch-patch] Successfully patched Hono.prototype.fetch');
  }
})();
`;
        // Prepend the patch code to ensure it runs before any Hono usage
        return {
          code: patchCode + code,
          map: null
        };
      }
      return null;
    },
    
    configureServer(server) {
      // Patch the Hono app in the server context
      server.middlewares.use((req, res, next) => {
        try {
          // Attempt to patch Hono in the server context
          const honoPath = require.resolve('hono');
          if (honoPath) {
            const honoModule = require(honoPath);
            const Hono = honoModule.Hono || honoModule.default;
            
            if (Hono && Hono.prototype && !Hono.prototype.fetch) {
              Hono.prototype.fetch = function(request, env, executionContext) {
                return this.request(request, env, executionContext);
              };
              console.log('[hono-fetch-patch] Successfully patched Hono in server middleware');
            }
          }
        } catch (e) {
          // Ignore errors, just continue
        }
        next();
      });
    }
  };
}