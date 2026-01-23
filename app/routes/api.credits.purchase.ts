/**
 * Credit Purchase API
 *
 * POST /api/credits/purchase - Create Stripe checkout session for credit purchase
 */

import { type ActionFunctionArgs, data } from 'react-router'
import { requireAuth } from '~/services/auth.server'
import { stripe } from '~/services/stripe.server'
import { findCreditPack } from '~/lib/credit-packs'

/**
 * POST /api/credits/purchase
 *
 * Creates a Stripe Checkout session for purchasing credits.
 * Requires authentication.
 *
 * Request body:
 * - packId: string - ID of the credit pack to purchase
 *
 * Response:
 * - success: boolean
 * - url: string - Stripe checkout URL
 * - sessionId: string - Stripe session ID
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  // Require authentication - guests cannot purchase credits
  const user = await requireAuth(request)

  // Parse request body
  let packId: string
  try {
    const body = await request.json()
    packId = body.packId
  } catch {
    return data({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate pack ID
  if (!packId) {
    return data({ error: 'Invalid pack ID' }, { status: 400 })
  }

  // Find the credit pack
  const pack = findCreditPack(packId)
  if (!pack) {
    return data({ error: 'Invalid pack ID' }, { status: 400 })
  }

  // Get app URL for redirects
  const appUrl = process.env.APP_URL || 'http://localhost:5173'

  try {
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: pack.name,
              description: 'AI generation credits for AIPrintly',
            },
            unit_amount: pack.pricePence,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/credits/purchase`,
      metadata: {
        userId: user.id,
        packId: pack.id,
        credits: String(pack.credits),
        type: 'credit_purchase',
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          packId: pack.id,
          credits: String(pack.credits),
          type: 'credit_purchase',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    })

    if (!session.url) {
      throw new Error('Failed to create checkout session')
    }

    return data(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to create credit purchase checkout:', error)
    return data(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * Reject non-POST requests
 */
export function loader() {
  return data({ error: 'Method not allowed' }, { status: 405 })
}
