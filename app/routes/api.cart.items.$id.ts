/**
 * Cart Item API Route
 *
 * PATCH /api/cart/items/:id - Update cart item quantity
 * DELETE /api/cart/items/:id - Remove item from cart
 */

import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession } from '~/services/session.server'
import {
  getCartItem,
  updateCartItemQuantity,
  removeCartItem,
} from '~/services/cart.server'

/**
 * Request schema for updating cart item
 */
const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
})

/**
 * GET /api/cart/items/:id
 *
 * Returns a single cart item by ID.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const itemId = params.id

  if (!sessionId) {
    return data(
      { error: 'Session not found' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  if (!itemId) {
    return data(
      { error: 'Item ID required' },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    const cartItem = await getCartItem(itemId, sessionId)

    if (!cartItem) {
      return data(
        { error: 'Cart item not found' },
        {
          status: 404,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    return data(
      { cartItem },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    console.error('Error fetching cart item:', error)
    return data(
      { error: 'Failed to fetch cart item' },
      {
        status: 500,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}

/**
 * PATCH/DELETE /api/cart/items/:id
 *
 * PATCH: Updates the quantity of a cart item.
 * DELETE: Removes a cart item.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const itemId = params.id

  if (!sessionId) {
    return data(
      { error: 'Session not found' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  if (!itemId) {
    return data(
      { error: 'Item ID required' },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    // Handle DELETE request
    if (request.method === 'DELETE') {
      const removed = await removeCartItem(itemId, sessionId)

      if (!removed) {
        return data(
          { error: 'Cart item not found' },
          {
            status: 404,
            headers: { 'Set-Cookie': await commitSession(session) },
          }
        )
      }

      return data(
        { success: true, message: 'Item removed from cart' },
        {
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    // Handle PATCH request
    if (request.method === 'PATCH') {
      const body = await request.json()
      const parseResult = updateCartItemSchema.safeParse(body)

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

      const { quantity } = parseResult.data

      const updatedItem = await updateCartItemQuantity(
        itemId,
        sessionId,
        quantity
      )

      if (!updatedItem) {
        return data(
          { error: 'Cart item not found' },
          {
            status: 404,
            headers: { 'Set-Cookie': await commitSession(session) },
          }
        )
      }

      return data(
        { success: true, cartItem: updatedItem },
        {
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    return data(
      { error: 'Method not allowed' },
      {
        status: 405,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed'

    console.error('Error in cart item action:', error)

    return data(
      { error: message },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
