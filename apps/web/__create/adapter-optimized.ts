/**
 * Optimized adapter module that lazy-loads components to reduce initial load time
 * This helps prevent the 'transport invoke timed out' error in Vite
 */

import type { Adapter } from '@auth/core/adapters';
import type { Pool } from '@neondatabase/serverless';

// Core types that are needed immediately
type CoreTypes = {
  // Minimal types needed for initial load
};

/**
 * Create an optimized Neon adapter with lazy-loaded components
 */
export default function createOptimizedAdapter(client: Pool): Adapter {
  // Only initialize core functionality immediately
  const coreAdapter = {
    // Implement a minimal version of required methods
    // that will be called during initial load
    async getUser(id: string) {
      const sql = 'select * from auth_users where id = $1';
      try {
        const result = await client.query(sql, [id]);
        return result.rowCount === 0 ? null : result.rows[0];
      } catch {
        return null;
      }
    },
    
    // Lazy-load the full adapter implementation when needed
    async getUserByEmail(email: string) {
      // This method is often called during authentication
      const sql = 'select * from auth_users where email = $1';
      const result = await client.query(sql, [email]);
      return result.rowCount === 0 ? null : result.rows[0];
    },
  };

  // Create a proxy that will lazy-load the full implementation when needed
  return new Proxy(coreAdapter as Adapter, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      
      // Lazy-load the full implementation when a method is accessed
      // that isn't in the core adapter
      return async (...args: any[]) => {
        // Dynamic import the full adapter implementation
        const { default: getFullAdapter } = await import('./adapter-full');
        const fullAdapter = getFullAdapter(client);
        
        // Call the method on the full adapter
        const method = fullAdapter[prop as keyof typeof fullAdapter];
        if (typeof method === 'function') {
          return method.apply(fullAdapter, args);
        }
        return method;
      };
    }
  });
}