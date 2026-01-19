/**
 * Single Order API Route
 *
 * GET /api/orders/:id - Get order by ID or tracking token
 */

import { type LoaderFunctionArgs, data } from 'react-router'
import { getSession, commitSession, getUserIdFromSession } from '~/services/session.server'
import {
  getOrderById,
  getOrderByTrackingToken,
  getOrderByNumber,
} from '~/services/orders.server'
import { formatPrice, formatDate } from '~/lib/utils'

/**
 * GET /api/orders/:id
 *
 * Returns order details by ID, order number, or tracking token.
 * Access control:
 * - Order owner (by userId or sessionId) can access by ID
 * - Anyone can access by tracking token
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const userId = await getUserIdFromSession(request)
  const orderId = params.id

  if (!orderId) {
    return data(
      { error: 'Order ID required' },
      { status: 400 }
    )
  }

  try {
    let order

    // Try to find order by different identifiers
    // First, check if it's a tracking token (24 characters, alphanumeric)
    if (/^[a-zA-Z0-9_-]{24}$/.test(orderId)) {
      order = await getOrderByTrackingToken(orderId)
    }

    // Then try order number (AIP-XXXXXX format)
    if (!order && /^AIP-[A-Z0-9]{6}$/i.test(orderId)) {
      order = await getOrderByNumber(orderId.toUpperCase())
    }

    // Finally try UUID
    if (!order) {
      order = await getOrderById(orderId)
    }

    if (!order) {
      return data(
        { error: 'Order not found' },
        {
          status: 404,
          headers: sessionId ? { 'Set-Cookie': await commitSession(session) } : undefined,
        }
      )
    }

    // Check access rights (unless accessed via tracking token, which is public)
    const isOwner =
      (userId && order.userId === userId) ||
      (sessionId && order.sessionId === sessionId)

    const accessedViaTrackingToken = orderId === order.trackingToken

    // If not accessed via tracking token, verify ownership
    if (!accessedViaTrackingToken && !isOwner) {
      return data(
        { error: 'Order not found' },
        {
          status: 404,
          headers: sessionId ? { 'Set-Cookie': await commitSession(session) } : undefined,
        }
      )
    }

    // Format order for response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotalPence: order.subtotalPence,
      shippingPence: order.shippingPence,
      totalPence: order.totalPence,
      currency: order.currency,
      customerName: order.customerName,
      customerEmail: accessedViaTrackingToken
        ? maskEmail(order.customerEmail)
        : order.customerEmail,
      shippingAddress: accessedViaTrackingToken
        ? maskAddress(order.shippingAddress as Record<string, string>)
        : order.shippingAddress,
      trackingToken: order.trackingToken,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        totalPricePence: item.totalPricePence,
        fulfilmentStatus: item.fulfilmentStatus,
        trackingNumber: item.trackingNumber,
        trackingUrl: item.trackingUrl,
        configuration: item.configuration ? {
          mockupUrl: item.configuration.mockupUrl,
          product: {
            name: item.configuration.product.name,
            category: item.configuration.product.category,
          },
        } : null,
      })),
    }

    return data(
      { order: formattedOrder },
      {
        headers: sessionId ? { 'Set-Cookie': await commitSession(session) } : undefined,
      }
    )
  } catch (error) {
    console.error('Error fetching order:', error)
    return data(
      { error: 'Failed to fetch order' },
      {
        status: 500,
        headers: sessionId ? { 'Set-Cookie': await commitSession(session) } : undefined,
      }
    )
  }
}

/**
 * Mask email for privacy (e.g., j***@example.com)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'

  const maskedLocal = local.length > 1
    ? `${local[0]}${'*'.repeat(Math.min(local.length - 1, 4))}`
    : '*'

  return `${maskedLocal}@${domain}`
}

/**
 * Mask address for privacy (show city and postcode only)
 */
function maskAddress(address: Record<string, string>): Record<string, string> {
  return {
    city: address.city || '',
    postcode: address.postcode || '',
    country: address.country || 'United Kingdom',
  }
}
