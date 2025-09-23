// hono-fix.js
// This file should be imported at the entry point of your application

// Monkey patch the Hono class to ensure fetch method is available
export function applyHonoFix() {
  try {
    // For ESM environments
    import('hono').then(({ Hono }) => {
      if (!Hono.prototype.fetch) {
        Hono.prototype.fetch = function(request, env, executionContext) {
          return this.request(request, env, executionContext);
        };
        console.log('[hono-fix] Successfully patched Hono.prototype.fetch in ESM environment');
      }
    }).catch(err => {
      console.error('[hono-fix] Error importing Hono:', err);
    });
  } catch (error) {
    console.error('[hono-fix] Error applying Hono fix:', error);
  }
}

// Apply the fix immediately
applyHonoFix();

// Export a function that can be used to patch a specific Hono instance
export function patchHonoInstance(app) {
  if (app && typeof app.request === 'function' && typeof app.fetch !== 'function') {
    app.fetch = function(request, env, executionContext) {
      return this.request(request, env, executionContext);
    };
    console.log('[hono-fix] Successfully patched specific Hono instance');
  }
  return app;
}