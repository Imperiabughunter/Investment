import { Hono } from 'hono'
import { jwt, sign, verify } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'

export const authRoutes = new Hono()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
})

const refreshSchema = z.object({
  refreshToken: z.string()
})

// JWT middleware
const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Register endpoint
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, firstName, lastName, phone } = c.req.valid('json')
    
    // TODO: Check if user already exists in database
    // TODO: Hash password and save user
    
    const hashedPassword = await bcrypt.hash(password, 12)
    const userId = nanoid()
    
    // TODO: Save user to database
    const user = {
      id: userId,
      email,
      firstName,
      lastName,
      phone: phone || null,
      createdAt: new Date().toISOString(),
      emailVerified: false
    }
    
    // Generate tokens
    const accessToken = await sign(
      { 
        userId: user.id, 
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
      }, 
      jwtSecret
    )
    
    const refreshToken = await sign(
      { 
        userId: user.id,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
      }, 
      jwtSecret
    )
    
    return c.json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    }, 201)
    
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({
      error: 'Registration failed',
      message: 'Unable to create account'
    }, 500)
  }
})

// Login endpoint  
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    
    // TODO: Fetch user from database
    // This should be replaced with actual database lookup
    // For demonstration, we'll simulate a database lookup
    
    // Attempt to find user by email (simulated)
    let user = null
    try {
      // This would be a database query in production
      // Simulating potential database errors
      user = {
        id: nanoid(),
        email,
        firstName: 'User',
        lastName: 'Account',
        hashedPassword: await bcrypt.hash(password, 12) // For testing only
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return c.json({
        error: 'Service unavailable',
        message: 'Unable to connect to authentication service'
      }, 503)
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword)
    
    if (!isValidPassword) {
      return c.json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      }, 401)
    }
    
    // Generate tokens
    const accessToken = await sign(
      { 
        userId: user.id, 
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
      }, 
      jwtSecret
    )
    
    const refreshToken = await sign(
      { 
        userId: user.id,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
      }, 
      jwtSecret
    )
    
    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return c.json({
      error: 'Login failed',
      message: 'Unable to authenticate'
    }, 500)
  }
})

// Refresh token endpoint
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')
    
    // Verify refresh token
    const payload = await verify(refreshToken, jwtSecret)
    
    if (payload.type !== 'refresh') {
      return c.json({
        error: 'Invalid token',
        message: 'Invalid refresh token'
      }, 401)
    }
    
    // Generate new access token
    const newAccessToken = await sign(
      { 
        userId: payload.userId, 
        email: payload.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
      }, 
      jwtSecret
    )
    
    return c.json({
      accessToken: newAccessToken,
      expiresIn: 3600
    })
    
  } catch (error) {
    return c.json({
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    }, 401)
  }
})

// Get current user (protected route)
authRoutes.get('/me', jwt({ secret: jwtSecret }), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    
    // TODO: Fetch full user data from database
    const user = {
      id: payload.userId,
      email: payload.email,
      firstName: 'Demo',
      lastName: 'User',
      phone: null,
      emailVerified: true,
      createdAt: new Date().toISOString()
    }
    
    return c.json({ user })
    
  } catch (error) {
    return c.json({
      error: 'User fetch failed',
      message: 'Unable to get user information'
    }, 500)
  }
})

// Logout endpoint
authRoutes.post('/logout', jwt({ secret: jwtSecret }), async (c) => {
  // TODO: Invalidate refresh token in database
  return c.json({
    message: 'Logout successful'
  })
})
