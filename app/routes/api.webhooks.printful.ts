/**
 * Printful Webhook Handler
 *
 * Receives and processes webhook events from Printful.
 * Handles order status updates, shipping notifications, and failures.
 */

import type { ActionFunctionArgs } from 'react-router'
import { handlePrintfulWebhook, verifyPrintfulWebhook, type PrintfulWebhookPayload } from '~/services/fulfilment/printful.server'

/**
 * Handle Printful webhook POST requests
 *
 * Verifies webhook signature and processes the event.
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Get raw body for signature verification
  const rawBody = await request.text()

  // Get signature from header
  const signature = request.headers.get('X-Printful-Signature')

  if (!signature) {
    console.error('Missing X-Printful-Signature header')
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify webhook signature
  const isValid = verifyPrintfulWebhook(rawBody, signature)

  if (!isValid) {
    console.error('Invalid Printful webhook signature')
    return new Response('Unauthorized', { status: 401 })
  }

  // Parse the payload
  let payload: PrintfulWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    console.error('Failed to parse Printful webhook payload:', error)
    return new Response('Bad Request', { status: 400 })
  }

  // Process the webhook asynchronously
  try {
    await handlePrintfulWebhook(payload)

    // Return 200 OK to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    // Log error but still return 200 to prevent retries for permanent failures
    console.error('Error processing Printful webhook:', error)

    // For webhook processing, it's often better to return 200 to acknowledge receipt
    // even if processing fails, to prevent webhook retry storms
    // The error is logged for manual investigation
    return new Response(
      JSON.stringify({ received: true, error: 'Processing failed' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
