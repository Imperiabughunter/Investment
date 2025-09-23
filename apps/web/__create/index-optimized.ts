/**
 * Optimized version of the index.ts file that uses code splitting and lazy loading
 * to reduce initial load time and prevent Vite timeout errors
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import * as serializeErrorModule from 'serialize-error';

// Apply Hono fix to ensure app.fetch is available
if (!Hono.prototype.fetch) {
  Hono.prototype.fetch = function(request, env, executionContext) {
    return this.request(request, env, executionContext);
  };
  console.log('Patched Hono.prototype.fetch globally');
}
import ws from 'ws';
import createOptimizedAdapter from './adapter-optimized';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { API_BASENAME } from './route-builder';

// Configure Neon database
neonConfig.webSocketConstructor = ws;

const serializeError = serializeErrorModule.serializeError;

// Setup async local storage for request ID tracking
const als = new AsyncLocalStorage<{ requestId: string }>();

// Configure console logging with request ID
for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Use the optimized adapter that lazy-loads components
const adapter = createOptimizedAdapter(pool);

// Create Hono app
const app = new Hono();

// Fix for "app.fetch is not a function" error
// Define it directly on the app instance
app.fetch = function(request, env, executionContext) {
  return this.request(request, env, executionContext);
};

// Also define it on the prototype to ensure it's available for all instances
if (!Hono.prototype.fetch) {
  Hono.prototype.fetch = function(request, env, executionContext) {
    return this.request(request, env, executionContext);
  };
}

// Add middleware for request ID
app.use('*', requestId());

// Set up request ID in async local storage
app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

// Add context storage middleware
app.use(contextStorage());

// Error handling middleware
app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

// CORS configuration
if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

// Lazy-load auth configuration to reduce initial load time
const setupAuth = async () => {
  if (process.env.AUTH_SECRET) {
    const { skipCSRFCheck } = await import('@auth/core');
    const { authHandler, initAuthConfig } = await import('@hono/auth-js');
    const Credentials = (await import('@auth/core/providers/credentials')).default;
    const { isAuthAction } = await import('./is-auth-action');
    
    app.use(
      '*',
      initAuthConfig((c) => ({
        secret: c.env.AUTH_SECRET,
        pages: {
          signIn: '/account/signin',
          signOut: '/account/logout',
        },
        skipCSRFCheck,
        session: {
          strategy: 'jwt',
        },
        callbacks: {
          session({ session, token }) {
            if (token.sub) {
              session.user.id = token.sub;
            }
            return session;
          },
        },
        cookies: {
          csrfToken: {
            options: {
              secure: true,
              sameSite: 'none',
            },
          },
        },
        adapter,
        providers: [
          Credentials({
            name: 'credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize({ email, password }, { adapter }) {
              if (!email || !password) return null;
              const user = await adapter?.getUserByEmail(email);
              if (!user) return null;
              const account = user.accounts?.find(
                (a) => a.provider === 'credentials'
              );
              if (!account?.password) return null;
              const isValid = await verify(account.password, password);
              if (!isValid) return null;
              return user;
            },
          }),
        ],
      }))
    );

    app.use('/api/auth/*', authHandler());

    app.post('/api/auth/signup', async (c) => {
      const { email, password, name } = await c.req.json();
      if (!email || !password) {
        return c.json({ error: 'Missing email or password' }, 400);
      }

      const existingUser = await adapter.getUserByEmail(email);
      if (existingUser) {
        return c.json({ error: 'User already exists' }, 400);
      }

      const user = await adapter.createUser({
        email,
        name,
        emailVerified: null,
      });

      await pool.query(
        'INSERT INTO auth_accounts ("userId", provider, "providerAccountId", "password") VALUES ($1, $2, $3, $4)',
        [user.id, 'credentials', user.id, await hash(password)]
      );

      return c.json({ success: true });
    });
  }
};

// Setup API routes
const setupApi = async () => {
  const { api } = await import('./route-builder');
  app.route(API_BASENAME, api);
};

// Setup React Router
const setupReactRouter = async () => {
  const { createHonoServer } = await import('react-router-hono-server/node');
  const { proxy } = await import('hono/proxy');
  
  // Initialize auth first if needed
  if (process.env.AUTH_SECRET) {
    await setupAuth();
  }
  
  // Initialize API routes
  await setupApi();
  
  // Set up React Router server
  const server = createHonoServer({
    app,
    isAction: isAuthAction,
  });
  
  // Add proxy middleware if needed
  if (process.env.PROXY_URL) {
    app.use(
      '/proxy/*',
      proxy(process.env.PROXY_URL, {
        stripPrefix: true,
      })
    );
  }
  
  return server;
};

// Export a function that initializes the server
export default async function createServer() {
  // Initialize React Router server
  return setupReactRouter();
}

// For immediate use without async initialization
export { app, pool, adapter };