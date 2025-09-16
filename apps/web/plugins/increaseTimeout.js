// Plugin to increase timeout for module loading
export function increaseTimeout() {
  return {
    name: 'vite-plugin-increase-timeout',
    configureServer(server) {
      // Increase timeout for WebSocket connections
      if (server.httpServer) {
        server.httpServer.timeout = 120000; // 2 minutes
        server.httpServer.keepAliveTimeout = 120000; // 2 minutes
      }

      // Patch the module graph to increase timeout for specific modules
      const originalModuleLoad = server.moduleGraph.getModuleByUrl;
      server.moduleGraph.getModuleByUrl = function (...args) {
        const url = args[0];
        if (url && (url.includes('__create/index.ts') || url.includes('adapter.ts'))) {
          console.log(`Increasing timeout for module: ${url}`);
          // This doesn't directly increase timeout but helps with debugging
        }
        return originalModuleLoad.apply(this, args);
      };

      // Add middleware to increase timeout for specific requests
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.includes('__create/index.ts') || req.url.includes('adapter.ts'))) {
          req.socket.setTimeout(120000); // 2 minutes
        }
        next();
      });
    },
  };
}