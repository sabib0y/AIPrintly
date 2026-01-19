/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe - Handles Stripe webhook events
 */

import { type ActionFunctionArgs, data } from 'react-router'
import type Stripe from 'stripe'
import {
  verifyWebhookSignature,
  handleCheckoutCompleted,
  handlePaymentFailed,
} from '~/services/stripe.server'

/**
 * POST /api/webhooks/stripe
 *
 * Handles incoming Stripe webhook events.
 * Verifies signature before processing.
 *
 * Events handled:
 * - checkout.session.completed - Order creation and email
 * - payment_intent.payment_failed - Logging and notifications
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  // Get raw body for signature verification
  const payload = await request.text()

  // Get Stripe signature header
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing Stripe signature header')
    return data(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  let event: Stripe.Event

  try {
    event = verifyWebhookSignature(payload, signature)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature'
    console.error('Webhook signature verification failed:', message)
    return data(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Log event for debugging
  console.log('Stripe webhook received:', {
    type: event.type,
    id: event.id,
  })

  // Handle event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process completed payments
        if (session.payment_status === 'paid') {
          const orderId = await handleCheckoutCompleted(session)
          console.log('Order created from webhook:', orderId)
        } else {
          console.log('Checkout session completed but payment not confirmed:', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
          })
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        // Handle async payment methods (e.g., bank transfers)
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = await handleCheckoutCompleted(session)
        console.log('Async payment succeeded, order created:', orderId)
        break
      }

      case 'checkout.session.async_payment_failed': {
        // Handle failed async payment
        const session = event.data.object as Stripe.Checkout.Session
        console.warn('Async payment failed:', {
          sessionId: session.id,
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      case 'payment_intent.succeeded': {
        // Already handled via checkout.session.completed
        // Log for completeness
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded:', paymentIntent.id)
        break
      }

      case 'charge.refunded': {
        // Handle refund events if needed
        const charge = event.data.object as Stripe.Charge
        console.log('Charge refunded:', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
        })
        // Could update order status to REFUNDED here
        break
      }

      case 'charge.dispute.created': {
        // Handle dispute/chargeback
        const dispute = event.data.object as Stripe.Dispute
        console.warn('Dispute created:', {
          disputeId: dispute.id,
          chargeId: dispute.charge,
          amount: dispute.amount,
          reason: dispute.reason,
        })
        // Could alert support team here
        break
      }

      default:
        // Log unhandled event types
        console.log('Unhandled webhook event type:', event.type)
    }

    // Return success
    return data(
      { received: true, type: event.type },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    console.error('Webhook handler error:', error)

    // Return 500 to trigger Stripe retry
    return data(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * Reject non-POST requests
 */
export function loader() {
  return data(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
