import type { Plugin } from 'vite';

/**
 * A Vite plugin that increases the WebSocket timeout for module loading
 * to prevent "transport invoke timed out" errors with large modules.
 */
export function increaseTimeout(): Plugin {
  return {
    name: 'vite-increase-timeout',
    apply: 'serve',
    configureServer(server) {
      // Increase WebSocket timeout to 2 minutes (120000ms)
      if (server.ws) {
        const originalSend = server.ws.send;
        server.ws.send = function(payload) {
          if (payload.type === 'custom' && payload.event === 'vite:invoke') {
            // Set a longer timeout for module fetching operations
            payload.timeout = 120000; // 2 minutes
          }
          return originalSend.call(this, payload);
        };
      }
    },
    config(config) {
      // Ensure HMR overlay is disabled to prevent blocking UI
      if (!config.server) {
        config.server = {};
      }
      
      if (!config.server.hmr) {
        config.server.hmr = {};
      }
      
      config.server.hmr.overlay = false;
      
      // Increase other timeouts
      return {
        server: {
          ...config.server,
          hmr: {
            ...config.server.hmr,
            timeout: 120000,
          },
          watch: {
            ...config.server.watch,
            usePolling: true,
          },
        },
      };
    },
  };
}