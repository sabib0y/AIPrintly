/**
 * Cart API Route
 *
 * GET /api/cart - Retrieve the current session's cart
 */

import { type LoaderFunctionArgs, data } from 'react-router'
import { getSession, commitSession } from '~/services/session.server'
import { getCart } from '~/services/cart.server'

/**
 * GET /api/cart
 *
 * Returns the current session's cart with items and totals.
 */
export async function loader({ request }: LoaderFunctionArgs) {
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
    const cart = await getCart(sessionId)

    return data(
      { cart },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    console.error('Error fetching cart:', error)
    return data(
      { error: 'Failed to fetch cart' },
      {
        status: 500,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
