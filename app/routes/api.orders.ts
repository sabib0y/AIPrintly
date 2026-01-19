/**
 * Orders API Route
 *
 * GET /api/orders - Get orders for authenticated user
 */

import { type LoaderFunctionArgs, data } from 'react-router'
import { getSession, commitSession, getUserIdFromSession } from '~/services/session.server'
import { getOrdersByUserId, getOrdersBySessionId, getOrderCountByUserId } from '~/services/orders.server'

/**
 * GET /api/orders
 *
 * Returns orders for the current user or session.
 *
 * Query parameters:
 * - limit: Maximum number of orders (default: 10, max: 50)
 * - offset: Number of orders to skip (default: 0)
 */
export async function loader({ request }: LoaderFunctionArgs) {
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

  // Parse query parameters
  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const offsetParam = url.searchParams.get('offset')

  const limit = Math.min(Math.max(parseInt(limitParam || '10', 10), 1), 50)
  const offset = Math.max(parseInt(offsetParam || '0', 10), 0)

  try {
    let orders
    let totalCount = 0

    if (userId) {
      // Get orders for authenticated user
      orders = await getOrdersByUserId(userId, limit, offset)
      totalCount = await getOrderCountByUserId(userId)
    } else {
      // Get orders for guest session
      orders = await getOrdersBySessionId(sessionId)
      totalCount = orders.length
    }

    return data(
      {
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalPence: order.totalPence,
          itemCount: order.items.length,
          customerName: order.customerName,
          createdAt: order.createdAt,
          trackingToken: order.trackingToken,
        })),
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
      },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)
    return data(
      { error: 'Failed to fetch orders' },
      {
        status: 500,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
