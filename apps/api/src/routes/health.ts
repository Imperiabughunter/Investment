import { Hono } from 'hono'

export const healthRoutes = new Hono()

// Health check endpoint
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not_configured',
    services: {
      api: 'operational',
      database: process.env.DATABASE_URL ? 'operational' : 'unavailable',
    }
  })
})

// Detailed system status
healthRoutes.get('/status', (c) => {
  const memoryUsage = process.memoryUsage()
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      unit: 'MB'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '3001',
      database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
    }
  })
})
