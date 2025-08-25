import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import 'dotenv-flow/config'

// Import routes
import { authRoutes } from './routes/auth.js'
import { usersRoutes } from './routes/users.js'
import { walletsRoutes } from './routes/wallets.js'
import { investmentsRoutes } from './routes/investments.js'
import { loansRoutes } from './routes/loans.js'
import { adminRoutes } from './routes/admin.js'
import { cryptoDepositsRoutes } from './routes/crypto-deposits.js'
import { healthRoutes } from './routes/health.js'

// Initialize Hono app
const app = new Hono()

// Global middleware
app.use(logger())
app.use(prettyJSON())
app.use(secureHeaders())
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:8081',
      'exp://192.168.1.*:8081',
      process.env.WEB_BASE_URL || 'http://localhost:5173',
      process.env.MOBILE_BASE_URL || 'http://localhost:8081',
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// Root route
app.get('/', (c) => {
  return c.json({
    message: 'Investment App API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/users',
      wallets: '/wallets',
      investments: '/investments',
      loans: '/loans',
      cryptoDeposits: '/crypto-deposits',
      admin: '/admin',
    },
  })
})

// Mount routes
app.route('/health', healthRoutes)
app.route('/auth', authRoutes)
app.route('/users', usersRoutes)
app.route('/wallets', walletsRoutes)
app.route('/investments', investmentsRoutes)
app.route('/loans', loansRoutes)
app.route('/crypto-deposits', cryptoDepositsRoutes)
app.route('/admin', adminRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString()
  }, 404)
})

// Error handler
app.onError((error, c) => {
  console.error(`API Error: ${error.message}`, error.stack)
  
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  }, 500)
})

// Start server
const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Investment API Server starting on port ${port}`)
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`💾 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
