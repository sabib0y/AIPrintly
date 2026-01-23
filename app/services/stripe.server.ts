/**
 * Stripe Service
 *
 * Server-side Stripe integration for payment processing.
 * Handles checkout session creation and webhook processing.
 */

import Stripe from 'stripe'
import { prisma } from './prisma.server'
import { getCart, clearCart, type CartItemWithConfiguration } from './cart.server'
import type { ShippingAddress } from '~/components/checkout'

// Validate Stripe secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

/**
 * Stripe client instance
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

/**
 * Get webhook secret for signature verification
 */
export const getWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }
  return secret
}

/**
 * Create a Stripe Checkout Session
 */
export interface CreateCheckoutSessionParams {
  sessionId: string
  userId: string | null
  shippingAddress: ShippingAddress
  shippingPence: number
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string
}

/**
 * Create a Stripe Checkout session for cart items
 *
 * @param params - Checkout session parameters
 * @returns Stripe session ID and checkout URL
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const { sessionId, userId, shippingAddress, shippingPence } = params

  // Get cart items
  const cart = await getCart(sessionId)

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  // Build line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map(
    (item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.configuration.product.name,
          description: item.configuration.variant.name,
          images: item.configuration.mockupUrl
            ? [item.configuration.mockupUrl]
            : item.configuration.asset.storageUrl
            ? [item.configuration.asset.storageUrl]
            : undefined,
          metadata: {
            configurationId: item.configurationId,
            productId: item.configuration.productId,
            variantId: item.configuration.variantId,
          },
        },
        unit_amount: item.unitPricePence,
      },
      quantity: item.quantity,
    })
  )

  // Add shipping as a line item
  if (shippingPence > 0) {
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: 'UK Standard Delivery',
          description: 'Estimated 3-5 working days',
        },
        unit_amount: shippingPence,
      },
      quantity: 1,
    })
  }

  // Get app URL for redirects
  const appUrl = process.env.APP_URL || 'http://localhost:5173'

  // Create Stripe Checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: shippingAddress.email,
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['GB'],
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancelled`,
    metadata: {
      sessionId,
      userId: userId || '',
      shippingAddress: JSON.stringify(shippingAddress),
      subtotalPence: String(cart.subtotalPence),
      shippingPence: String(shippingPence),
      itemCount: String(cart.itemCount),
    },
    payment_intent_data: {
      metadata: {
        sessionId,
        userId: userId || '',
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  })

  if (!stripeSession.url) {
    throw new Error('Failed to create checkout session')
  }

  return {
    sessionId: stripeSession.id,
    url: stripeSession.url,
  }
}

/**
 * Verify Stripe webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header value
 * @returns Verified Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = getWebhookSecret()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Retrieve a Stripe Checkout session
 *
 * @param sessionId - Stripe session ID
 * @returns Stripe session object
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'line_items'],
  })
}

/**
 * Handle successful credit purchase
 *
 * Called when checkout.session.completed webhook is received for credit purchases.
 *
 * @param session - Stripe checkout session
 * @returns User ID
 */
export async function handleCreditPurchaseCompleted(
  session: Stripe.Checkout.Session
): Promise<string> {
  const { userId, packId, credits } = session.metadata || {}

  if (!userId) {
    throw new Error('Missing user ID in metadata')
  }

  if (!packId || !credits) {
    throw new Error('Missing pack information in metadata')
  }

  const creditsAmount = Number(credits)

  if (isNaN(creditsAmount) || creditsAmount <= 0) {
    throw new Error('Invalid credits amount')
  }

  // Import credits service (circular dependency prevention)
  const { addCredits } = await import('./credits.server')

  // Add credits to user account
  const result = await addCredits(
    '', // sessionId not needed for registered users
    userId,
    creditsAmount,
    'PURCHASE',
    {
      packId,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
    }
  )

  if (!result.success) {
    throw new Error(`Failed to add credits: ${result.error}`)
  }

  console.log('Credits added:', {
    userId,
    amount: creditsAmount,
    newBalance: result.newBalance,
    packId,
  })

  return userId
}

/**
 * Handle successful checkout
 *
 * Called when checkout.session.completed webhook is received.
 *
 * @param session - Stripe checkout session
 * @returns Created order ID
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<string> {
  const {
    sessionId: appSessionId,
    userId,
    shippingAddress: shippingAddressJson,
    subtotalPence,
    shippingPence,
    type,
  } = session.metadata || {}

  // Check if this is a credit purchase
  if (type === 'credit_purchase') {
    await handleCreditPurchaseCompleted(session)
    return 'credit_purchase'
  }

  if (!appSessionId) {
    throw new Error('Missing session ID in metadata')
  }

  // Parse shipping address
  let shippingAddress: ShippingAddress
  try {
    shippingAddress = JSON.parse(shippingAddressJson || '{}')
  } catch {
    throw new Error('Invalid shipping address in metadata')
  }

  // Get cart items for order creation
  const cart = await getCart(appSessionId)

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  // Import order service (circular dependency prevention)
  const { createOrderFromCart } = await import('./orders.server')

  // Create order
  const order = await createOrderFromCart({
    sessionId: appSessionId,
    userId: userId || null,
    shippingAddress,
    subtotalPence: Number(subtotalPence),
    shippingPence: Number(shippingPence),
    stripePaymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null,
    stripeCheckoutSessionId: session.id,
    cartItems: cart.items,
  })

  // Clear the cart after successful order
  await clearCart(appSessionId)

  // Import email service
  const { sendOrderConfirmationEmail } = await import('./email.server')

  // Send confirmation email
  try {
    await sendOrderConfirmationEmail(order.id)
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    // Don't throw - order is already created
  }

  // Route order to fulfilment providers
  try {
    const { routeOrderToProviders } = await import('./fulfilment/order-router.server')
    const routingResult = await routeOrderToProviders(order.id)

    if (!routingResult.success) {
      console.error('Fulfilment routing had errors:', routingResult.errors)
      // Don't throw - order is created, items marked as failed for retry
    } else {
      console.log('Order routed to providers:', routingResult.providerOrders)
    }
  } catch (error) {
    console.error('Failed to route order to fulfilment:', error)
    // Don't throw - order is created, can be manually processed
  }

  return order.id
}

/**
 * Handle failed payment
 *
 * Called when payment_intent.payment_failed webhook is received.
 *
 * @param paymentIntent - Stripe payment intent
 */
export async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { sessionId, userId } = paymentIntent.metadata || {}

  console.warn('Payment failed:', {
    paymentIntentId: paymentIntent.id,
    sessionId,
    userId,
    error: paymentIntent.last_payment_error?.message,
  })

  // Could implement:
  // - Send abandoned cart email
  // - Log for analytics
  // - Alert support for high-value carts
}

/**
 * Get Stripe publishable key for frontend
 */
export function getPublishableKey(): string {
  const key = process.env.STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is required')
  }
  return key
}

/**
 * Create a refund for an order
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @param amountPence - Amount to refund in pence (optional, full refund if not specified)
 * @param reason - Refund reason
 * @returns Stripe refund object
 */
export async function createRefund(
  paymentIntentId: string,
  amountPence?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountPence,
    reason,
  })
}
