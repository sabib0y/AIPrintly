/**
 * Create Stripe Checkout Session API Route
 *
 * POST /api/checkout/create-session - Creates a Stripe Checkout session
 */

import { type ActionFunctionArgs, type LoaderFunctionArgs, data, redirect } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession, getUserIdFromSession } from '~/services/session.server'
import { createCheckoutSession } from '~/services/stripe.server'
import { validateCart } from '~/services/cart.server'

// UK shipping rate in pence
const UK_SHIPPING_PENCE = 499

/**
 * Shipping address validation schema
 */
const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional().default(''),
  postcode: z.string().min(5, 'Please enter a valid UK postcode'),
  country: z.string().default('United Kingdom'),
})

/**
 * GET handler - Redirect to checkout page (for form redirects)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  return redirect('/checkout')
}

/**
 * POST /api/checkout/create-session
 *
 * Creates a Stripe Checkout session and returns the URL.
 *
 * Request body:
 * - shippingAddress: Full shipping address object
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  const session = await getSession(request)
  const sessionId = session.get('id')
  const userId = await getUserIdFromSession(request)

  if (!sessionId) {
    return data(
      { error: 'Session not found' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    // Parse request body
    const body = await request.json()

    // Validate shipping address
    const parseResult = shippingAddressSchema.safeParse(body.shippingAddress)

    if (!parseResult.success) {
      return data(
        {
          error: 'Invalid shipping address',
          details: parseResult.error.flatten(),
        },
        {
          status: 400,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    const shippingAddress = parseResult.data

    // Validate cart before creating session
    const validation = await validateCart(sessionId)

    if (!validation.isValid) {
      return data(
        {
          error: 'Please resolve cart issues before checkout',
          cartIssues: validation.items
            .filter((v) => !v.validation.isValid)
            .map((v) => ({
              itemId: v.itemId,
              errors: v.validation.errors,
            })),
        },
        {
          status: 400,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    // Create Stripe Checkout session
    const checkoutSession = await createCheckoutSession({
      sessionId,
      userId,
      shippingAddress,
      shippingPence: UK_SHIPPING_PENCE,
    })

    return data(
      {
        success: true,
        sessionId: checkoutSession.sessionId,
        url: checkoutSession.url,
      },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'

    console.error('Error creating checkout session:', error)

    return data(
      { error: message },
      {
        status: 500,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
