import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

export const usersRoutes = new Hono()

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Get user profile
usersRoutes.get('/profile', jwt({ secret: jwtSecret }), async (c) => {
  const payload = c.get('jwtPayload')
  // TODO: Implement user profile fetching
  return c.json({ message: 'User profile endpoint', userId: payload.userId })
})

// Update user profile  
usersRoutes.put('/profile', jwt({ secret: jwtSecret }), async (c) => {
  const payload = c.get('jwtPayload')
  // TODO: Implement user profile update
  return c.json({ message: 'Profile updated', userId: payload.userId })
})
