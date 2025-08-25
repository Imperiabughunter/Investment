import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const investmentsRoutes = new Hono()

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

const createInvestmentSchema = z.object({
  planId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD')
})

// Get investment plans
investmentsRoutes.get('/plans', async (c) => {
  const mockPlans = [
    {
      id: '1',
      name: 'Conservative Growth',
      description: 'Low risk investment plan with steady returns',
      roi_percentage: 8.5,
      min_amount: 100,
      max_amount: 50000,
      duration_months: 12,
      risk_level: 'low',
      features: ['Capital protection', 'Monthly returns', 'Early withdrawal']
    },
    {
      id: '2', 
      name: 'Balanced Portfolio',
      description: 'Medium risk plan balancing growth and stability',
      roi_percentage: 12.5,
      min_amount: 500,
      max_amount: 100000,
      duration_months: 18,
      risk_level: 'medium',
      features: ['Diversified portfolio', 'Quarterly reports', 'Reinvestment options']
    },
    {
      id: '3',
      name: 'High Growth Fund',
      description: 'Aggressive growth strategy for maximum returns',
      roi_percentage: 18.5,
      min_amount: 1000,
      max_amount: 500000,
      duration_months: 24,
      risk_level: 'high',
      features: ['High growth potential', 'Professional management', 'Tax optimization']
    }
  ]

  return c.json({
    success: true,
    data: mockPlans
  })
})

// Get user's investments
investmentsRoutes.get('/my-investments', jwt({ secret: jwtSecret }), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.userId

    const mockInvestments = [
      {
        id: '1',
        planId: '2',
        planName: 'Balanced Portfolio',
        amount: 2500.00,
        currentValue: 2687.50,
        roi_percentage: 12.5,
        status: 'active',
        startDate: '2024-06-01T00:00:00Z',
        maturityDate: '2025-12-01T00:00:00Z',
        returns_earned: 187.50,
        next_payout: '2024-09-01T00:00:00Z'
      },
      {
        id: '2',
        planId: '1',
        planName: 'Conservative Growth',
        amount: 1000.00,
        currentValue: 1065.00,
        roi_percentage: 8.5,
        status: 'active',
        startDate: '2024-07-15T00:00:00Z',
        maturityDate: '2025-07-15T00:00:00Z',
        returns_earned: 65.00,
        next_payout: '2024-08-15T00:00:00Z'
      }
    ]

    return c.json({
      success: true,
      data: mockInvestments
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch investments' }, 500)
  }
})

// Create new investment
investmentsRoutes.post('/create', jwt({ secret: jwtSecret }), zValidator('json', createInvestmentSchema), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.userId
    const { planId, amount, currency } = c.req.valid('json')

    // TODO: Validate plan exists, user has sufficient balance, etc.
    const investment = {
      id: Date.now().toString(),
      userId,
      planId,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    return c.json({
      success: true,
      message: 'Investment created successfully',
      data: investment
    }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create investment' }, 500)
  }
})
