// Patch for Hono app.fetch issue
(function() {
  // This script patches the Hono app to ensure app.fetch is available
  // It's loaded before the main application code
  
  // Check if we're in a module context
  if (typeof module !== 'undefined' && module.exports) {
    // CommonJS environment
    const Hono = require('hono');
    if (Hono && Hono.prototype && !Hono.prototype.fetch) {
      Hono.prototype.fetch = function(request, env, executionContext) {
        return this.request(request, env, executionContext);
      };
    }
  } else if (typeof window !== 'undefined') {
    // Browser environment - wait for Hono to be defined
    const checkAndPatch = () => {
      if (window.Hono && window.Hono.prototype && !window.Hono.prototype.fetch) {
        window.Hono.prototype.fetch = function(request, env, executionContext) {
          return this.request(request, env, executionContext);
        };
      }
    };
    
    // Try immediately
    checkAndPatch();
    
    // Also try after window load
    window.addEventListener('load', checkAndPatch);
  }
})();