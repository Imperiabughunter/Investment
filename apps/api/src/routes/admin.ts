import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

export const adminRoutes = new Hono()

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Dashboard stats
adminRoutes.get('/dashboard-stats', jwt({ secret: jwtSecret }), async (c) => {
  // TODO: Add admin role check
  return c.json({
    totalUsers: 1250,
    totalInvestments: 45000000,
    totalLoans: 12000000,
    monthlyGrowth: 8.5
  })
})

// Get all users (admin only)
adminRoutes.get('/users', jwt({ secret: jwtSecret }), async (c) => {
  // TODO: Add admin role check and implement user listing
  return c.json({ message: 'Admin users endpoint' })
})
