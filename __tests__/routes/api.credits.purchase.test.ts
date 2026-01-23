/**
 * Tests for Credit Purchase API Endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('~/services/auth.server', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('~/services/stripe.server', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('~/lib/credit-packs', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    findCreditPack: vi.fn(),
  }
})

import { action } from '~/routes/api.credits.purchase'
import { requireAuth } from '~/services/auth.server'
import { stripe } from '~/services/stripe.server'
import { findCreditPack } from '~/lib/credit-packs'

describe('POST /api/credits/purchase', () => {
  const mockUserId = 'user-123'
  const mockEmail = 'test@example.com'

  beforeEach(() => {
    vi.clearAllMocks()

    // Default auth mock
    vi.mocked(requireAuth).mockResolvedValue({
      id: mockUserId,
      email: mockEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  it('should reject non-POST requests', async () => {
    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'GET',
    })

    const result: any = await action({ request } as any)

    expect(result.init.status).toBe(405)
    expect(result.data.error).toBe('Method not allowed')
  })

  it('should require authentication', async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new Response(null, { status: 401 })
    )

    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packId: 'pack_100' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await expect(action({ request } as any)).rejects.toThrow()

    expect(requireAuth).toHaveBeenCalledWith(request)
  })

  it('should reject missing packId', async () => {
    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const result: any = await action({ request } as any)

    expect(result.init.status).toBe(400)
    expect(result.data.error).toBe('Invalid pack ID')
  })

  it('should reject invalid packId', async () => {
    vi.mocked(findCreditPack).mockReturnValue(undefined)

    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packId: 'invalid_pack' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const result: any = await action({ request } as any)

    expect(result.init.status).toBe(400)
    expect(result.data.error).toBe('Invalid pack ID')
  })

  it('should create Stripe checkout session for valid pack', async () => {
    const mockPack = {
      id: 'pack_100',
      credits: 100,
      pricePence: 499,
      name: '100 Credits',
    }

    const mockCheckoutSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    }

    vi.mocked(findCreditPack).mockReturnValue(mockPack)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
      mockCheckoutSession as any
    )

    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packId: 'pack_100' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const result: any = await action({ request } as any)

    expect(result.init.status).toBe(200)
    expect(result.data.success).toBe(true)
    expect(result.data.url).toBe(mockCheckoutSession.url)
    expect(result.data.sessionId).toBe(mockCheckoutSession.id)

    // Verify Stripe session creation
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: mockEmail,
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: '100 Credits',
                description: 'AI generation credits for AIPrintly',
              },
              unit_amount: 499,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: mockUserId,
          packId: 'pack_100',
          credits: '100',
          type: 'credit_purchase',
        },
      })
    )
  })

  it('should handle Stripe errors gracefully', async () => {
    const mockPack = {
      id: 'pack_100',
      credits: 100,
      pricePence: 499,
      name: '100 Credits',
    }

    vi.mocked(findCreditPack).mockReturnValue(mockPack)
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
      new Error('Stripe API error')
    )

    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packId: 'pack_100' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const result: any = await action({ request } as any)

    expect(result.init.status).toBe(500)
    expect(result.data.error).toBe('Failed to create checkout session')
  })

  it('should create checkout session with correct success and cancel URLs', async () => {
    const mockPack = {
      id: 'pack_250',
      credits: 250,
      pricePence: 999,
      name: '250 Credits',
    }

    vi.mocked(findCreditPack).mockReturnValue(mockPack)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      id: 'cs_test_250',
      url: 'https://checkout.stripe.com/pay/cs_test_250',
    } as any)

    const request = new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packId: 'pack_250' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await action({ request } as any)

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('/credits/success'),
        cancel_url: expect.stringContaining('/credits/purchase'),
      })
    )
  })
})

