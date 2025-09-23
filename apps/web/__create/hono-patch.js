// This file patches the Hono prototype to ensure app.fetch is always available
// It should be imported before any Hono usage

// Patch Hono.prototype to add fetch method if it doesn't exist
if (typeof require !== 'undefined') {
  try {
    // For CommonJS environments
    const Hono = require('hono').Hono;
    if (Hono && !Hono.prototype.fetch) {
      Hono.prototype.fetch = function(request, env, executionContext) {
        return this.request(request, env, executionContext);
      };
      console.log('[hono-patch] Successfully patched Hono.prototype.fetch in CommonJS environment');
    }
  } catch (error) {
    console.error('[hono-patch] Error patching Hono in CommonJS environment:', error);
  }
} else {
  // For ESM/browser environments
  try {
    // This will run in browser context
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        if (typeof Hono !== 'undefined' && !Hono.prototype.fetch) {
          Hono.prototype.fetch = function(request, env, executionContext) {
            return this.request(request, env, executionContext);
          };
          console.log('[hono-patch] Successfully patched Hono.prototype.fetch in browser environment');
        }
      });
    }
  } catch (error) {
    console.error('[hono-patch] Error patching Hono in browser environment:', error);
  }
}