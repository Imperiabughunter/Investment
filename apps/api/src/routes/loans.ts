import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

export const loansRoutes = new Hono()

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Get loan options
loansRoutes.get('/options', async (c) => {
  // TODO: Implement loan options
  return c.json({ message: 'Loan options endpoint' })
})

// Apply for loan
loansRoutes.post('/apply', jwt({ secret: jwtSecret }), async (c) => {
  const payload = c.get('jwtPayload')
  // TODO: Implement loan application
  return c.json({ message: 'Loan application endpoint', userId: payload.userId })
})

// Get user's loans
loansRoutes.get('/my-loans', jwt({ secret: jwtSecret }), async (c) => {
  const payload = c.get('jwtPayload')
  // TODO: Implement user loans fetching
  return c.json({ message: 'User loans endpoint', userId: payload.userId })
})
