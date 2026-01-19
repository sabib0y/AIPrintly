/**
 * Cart Items API Route
 *
 * POST /api/cart/items - Add an item to the cart
 */

import { type ActionFunctionArgs, data } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession } from '~/services/session.server'
import { addToCart } from '~/services/cart.server'

/**
 * Request schema for adding items to cart
 */
const addToCartSchema = z.object({
  configurationId: z.string().uuid('Invalid configuration ID'),
  quantity: z.number().int().min(1).max(99).optional().default(1),
})

/**
 * POST /api/cart/items
 *
 * Adds a product configuration to the cart.
 *
 * Request body:
 * - configurationId: UUID of the product configuration
 * - quantity: Number of items to add (default: 1, max: 99)
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  const session = await getSession(request)
  const sessionId = session.get('id')

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
    const body = await request.json()
    const parseResult = addToCartSchema.safeParse(body)

    if (!parseResult.success) {
      return data(
        {
          error: 'Invalid request',
          details: parseResult.error.flatten(),
        },
        {
          status: 400,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    const { configurationId, quantity } = parseResult.data

    const cartItem = await addToCart(sessionId, configurationId, quantity)

    return data(
      {
        success: true,
        cartItem,
      },
      {
        status: 201,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add item to cart'
    const status = message.includes('not found') ? 404 : 400

    console.error('Error adding to cart:', error)

    return data(
      { error: message },
      {
        status,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
