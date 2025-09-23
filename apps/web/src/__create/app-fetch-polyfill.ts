// Polyfill for app.fetch function
import { Hono } from 'hono';

// Extend the Hono prototype to ensure app.fetch is always available
declare module 'hono' {
  interface Hono {
    fetch: (request: Request, env?: any, executionContext?: any) => Promise<Response>;
  }
}

// Apply the polyfill to ensure app.fetch is available
export function applyAppFetchPolyfill() {
  if (!Hono.prototype.fetch) {
    Hono.prototype.fetch = async function(request: Request, env?: any, executionContext?: any) {
      // This is the standard implementation that should work with Hono
      return this.request(request, env, executionContext);
    };
  }
}

export default applyAppFetchPolyfill;