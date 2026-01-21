/**
 * Blurb Webhook Handler
 *
 * POST /api/webhooks/blurb
 *
 * Receives webhook events from Blurb for storybook order status updates.
 * Verifies request authenticity via Bearer token and updates order status.
 */

import { data } from 'react-router'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  verifyBlurbWebhook,
  handleBlurbWebhook,
  type BlurbWebhookPayload,
} from '~/services/fulfilment/blurb.server'

/**
 * POST handler for Blurb webhooks
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  // Get authorisation header
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    console.error('Blurb webhook: Missing Authorization header')
    return data({ error: 'Unauthorised' }, { status: 401 })
  }

  // Verify webhook authenticity
  if (!verifyBlurbWebhook(authHeader)) {
    console.error('Blurb webhook: Invalid Authorization token')
    return data({ error: 'Unauthorised' }, { status: 401 })
  }

  // Parse JSON body
  let payload: BlurbWebhookPayload

  try {
    payload = await request.json()
  } catch {
    console.error('Blurb webhook: Invalid JSON body')
    return data({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate payload structure
  if (!payload.event || !payload.order_id) {
    console.error('Blurb webhook: Invalid payload structure')
    return data({ error: 'Invalid payload' }, { status: 400 })
  }

  // Process the webhook event
  try {
    await handleBlurbWebhook(payload)

    // Return 200 to acknowledge receipt
    // We return success even if processing fails to prevent retry storms
    return data({ received: true })
  } catch (error) {
    // Log error but still return 200 to prevent Blurb from retrying
    // The event is logged for manual investigation
    console.error('Blurb webhook processing error:', error)
    return data({ received: true, warning: 'Processing error logged' })
  }
}

/**
 * GET handler - Health check
 */
export async function loader({ request }: LoaderFunctionArgs) {
  return data({ status: 'ok', service: 'blurb-webhook' })
}
