/**
 * Hono Direct Fix - Resolves the "app.fetch is not a function" error
 */

// CommonJS module for direct inclusion in build process
const patchHono = function() {
  // Patch function for individual Hono instances
  return function patchInstance(app) {
    if (app && typeof app.request === 'function' && typeof app.fetch !== 'function') {
      app.fetch = function(request, env, ctx) {
        return this.request(request, env, ctx);
      };
      console.log('[hono-fix] Patched Hono instance');
    }
    return app;
  };
};

// Export the patch function
module.exports = patchHono();