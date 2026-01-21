/**
 * Printful Fulfilment Service
 *
 * Handles integration with Printful API for print-on-demand fulfilment.
 * Supports mugs, apparel, prints, and posters.
 */

import crypto from 'crypto'
import { prisma } from '~/services/prisma.server'
import { sendShippingNotificationEmail } from '~/services/email.server'
import type { Order, OrderItem, FulfilmentStatus } from '@prisma/client'

const PRINTFUL_API_URL = 'https://api.printful.com'

/**
 * Get Printful API key (lazy evaluation for testing)
 */
function getPrintfulApiKey(): string | undefined {
  return process.env.PRINTFUL_API_KEY
}

// Warn on module load if not configured (non-test environment)
if (!getPrintfulApiKey() && process.env.NODE_ENV !== 'test') {
  console.warn('PRINTFUL_API_KEY not set - Printful integration disabled')
}

/**
 * Printful API response wrapper
 */
interface PrintfulResponse<T> {
  code: number
  result: T
  error?: {
    code: number
    message: string
  }
}

/**
 * Printful order response
 */
interface PrintfulOrderResult {
  id: number
  external_id: string
  status: string
  shipping: string
  created: number
  updated: number
}

/**
 * Printful webhook payload
 */
export interface PrintfulWebhookPayload {
  type: string
  created: number
  retries: number
  store: number
  data: {
    order: {
      id: number
      external_id: string
      status: string
      error?: string
      shipments?: Array<{
        carrier: string
        service: string
        tracking_number: string
        tracking_url: string
        ship_date: string
      }>
    }
  }
}

/**
 * Status mapping from Printful to internal status
 */
const PRINTFUL_STATUS_MAP: Record<string, FulfilmentStatus> = {
  draft: 'PENDING',
  pending: 'SENT',
  failed: 'FAILED',
  canceled: 'FAILED',
  cancelled: 'FAILED',
  inprocess: 'SENT',
  onhold: 'SENT',
  partial: 'SENT',
  fulfilled: 'FULFILLED',
}

/**
 * Make authenticated request to Printful API
 */
async function printfulRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getPrintfulApiKey()

  if (!apiKey) {
    throw new Error('Printful API key not configured')
  }

  const response = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || error.result || 'Printful API error')
  }

  const data: PrintfulResponse<T> = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result
}

/**
 * Create order in Printful
 *
 * @param order - Order details
 * @param items - Order items to fulfil
 * @returns Printful order ID
 */
export async function createPrintfulOrder(
  order: Order,
  items: OrderItem[]
): Promise<string> {
  const shippingAddress = order.shippingAddress as Record<string, string>

  // Build Printful order request
  const printfulOrderRequest = {
    external_id: order.id,
    recipient: {
      name: shippingAddress.fullName,
      address1: shippingAddress.addressLine1,
      address2: shippingAddress.addressLine2 || undefined,
      city: shippingAddress.city,
      country_code: 'GB',
      zip: shippingAddress.postcode,
      phone: shippingAddress.phone || undefined,
      email: order.customerEmail,
    },
    items: items.map((item) => {
      // Extract configuration data (would come from joined relation in real use)
      // For now, we'll use metadata or external IDs
      return {
        variant_id: 0, // This would come from configuration.variant.externalId
        quantity: item.quantity,
        files: [
          {
            type: 'default',
            url: '', // This would come from configuration.asset.storageUrl
          },
        ],
      }
    }),
    retail_costs: {
      currency: order.currency,
      subtotal: (order.subtotalPence / 100).toFixed(2),
      shipping: (order.shippingPence / 100).toFixed(2),
      tax: '0.00',
    },
  }

  const result = await printfulRequest<PrintfulOrderResult>('/orders', {
    method: 'POST',
    body: JSON.stringify(printfulOrderRequest),
  })

  // Log fulfilment event
  await prisma.fulfilmentEvent.create({
    data: {
      orderItemId: items[0].id, // Associate with first item
      provider: 'PRINTFUL',
      eventType: 'order_created',
      payload: result as any,
      processed: true,
    },
  })

  return String(result.id)
}

/**
 * Confirm Printful order (moves from draft to production)
 *
 * @param printfulOrderId - Printful order ID
 */
export async function confirmPrintfulOrder(printfulOrderId: string): Promise<void> {
  await printfulRequest(`/orders/${printfulOrderId}/confirm`, {
    method: 'POST',
  })
}

/**
 * Cancel Printful order
 *
 * @param printfulOrderId - Printful order ID
 */
export async function cancelPrintfulOrder(printfulOrderId: string): Promise<void> {
  await printfulRequest(`/orders/${printfulOrderId}`, {
    method: 'DELETE',
  })
}

/**
 * Verify Printful webhook signature
 *
 * @param payload - Raw webhook payload (string)
 * @param signature - Signature from X-Printful-Signature header
 * @returns True if signature is valid
 */
export function verifyPrintfulWebhook(payload: string, signature: string): boolean {
  const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('PRINTFUL_WEBHOOK_SECRET not configured')
    return false
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Handle Printful webhook event
 *
 * @param payload - Webhook payload
 */
export async function handlePrintfulWebhook(
  payload: PrintfulWebhookPayload
): Promise<void> {
  const { type, data } = payload
  const { order } = data

  // Find our order by external_id
  const dbOrder = await prisma.order.findUnique({
    where: { id: order.external_id },
    include: {
      items: true,
    },
  })

  // Log the webhook event
  if (dbOrder && dbOrder.items.length > 0) {
    await prisma.fulfilmentEvent.create({
      data: {
        orderItemId: dbOrder.items[0].id,
        provider: 'PRINTFUL',
        eventType: type,
        payload: payload as any,
        processed: false,
      },
    })
  }

  if (!dbOrder) {
    console.warn(`Printful webhook for unknown order: ${order.external_id}`)
    return
  }

  // Handle different event types
  switch (type) {
    case 'package_shipped':
      await handlePackageShipped(dbOrder, order)
      break

    case 'order_failed':
      await handleOrderFailed(dbOrder, order)
      break

    case 'order_updated':
      await handleOrderUpdated(dbOrder, order)
      break

    case 'order_canceled':
    case 'order_cancelled':
      await handleOrderCancelled(dbOrder, order)
      break

    default:
      console.log(`Unhandled Printful webhook type: ${type}`)
  }

  // Mark event as processed
  if (dbOrder && dbOrder.items.length > 0) {
    await prisma.fulfilmentEvent.updateMany({
      where: {
        orderItemId: dbOrder.items[0].id,
        eventType: type,
        processed: false,
      },
      data: {
        processed: true,
      },
    })
  }
}

/**
 * Handle package shipped event
 */
async function handlePackageShipped(
  order: Order & { items: OrderItem[] },
  printfulOrder: PrintfulWebhookPayload['data']['order']
): Promise<void> {
  const shipment = printfulOrder.shipments?.[0]

  if (!shipment) {
    console.error('No shipment data in package_shipped event')
    return
  }

  // Find order item(s) for this Printful order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === String(printfulOrder.id)
  )

  if (!orderItem) {
    console.error(`No order item found for Printful order ${printfulOrder.id}`)
    return
  }

  // Update order item with tracking information
  await prisma.orderItem.update({
    where: { id: orderItem.id },
    data: {
      fulfilmentStatus: 'FULFILLED',
      trackingNumber: shipment.tracking_number,
      trackingUrl: shipment.tracking_url,
    },
  })

  // Check if all items are fulfilled
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { fulfilmentStatus: true },
  })

  const allFulfilled = allItems.every((item) => item.fulfilmentStatus === 'FULFILLED')

  if (allFulfilled) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED' },
    })
  }

  // Send shipping notification email
  await sendShippingNotificationEmail(
    order.id,
    shipment.tracking_number,
    shipment.tracking_url,
    shipment.carrier
  )
}

/**
 * Handle order failed event
 */
async function handleOrderFailed(
  order: Order & { items: OrderItem[] },
  printfulOrder: PrintfulWebhookPayload['data']['order']
): Promise<void> {
  // Find order item(s) for this Printful order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === String(printfulOrder.id)
  )

  if (!orderItem) {
    console.error(`No order item found for Printful order ${printfulOrder.id}`)
    return
  }

  // Update order item status to failed
  await prisma.orderItem.update({
    where: { id: orderItem.id },
    data: {
      fulfilmentStatus: 'FAILED',
    },
  })

  // Log error for manual intervention
  console.error(
    `Printful order ${printfulOrder.id} failed: ${printfulOrder.error || 'Unknown error'}`
  )

  // TODO: Alert admin for manual review
}

/**
 * Handle order updated event
 */
async function handleOrderUpdated(
  order: Order & { items: OrderItem[] },
  printfulOrder: PrintfulWebhookPayload['data']['order']
): Promise<void> {
  // Map Printful status to internal status
  const internalStatus = PRINTFUL_STATUS_MAP[printfulOrder.status] || 'SENT'

  // Find order item(s) for this Printful order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === String(printfulOrder.id)
  )

  if (!orderItem) {
    console.error(`No order item found for Printful order ${printfulOrder.id}`)
    return
  }

  // Update order item status
  await prisma.orderItem.update({
    where: { id: orderItem.id },
    data: {
      fulfilmentStatus: internalStatus,
    },
  })

  // Update order status based on all items
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { fulfilmentStatus: true },
  })

  const allSent = allItems.every((item) => item.fulfilmentStatus === 'SENT')
  const anyFailed = allItems.some((item) => item.fulfilmentStatus === 'FAILED')

  if (allSent && !anyFailed) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING' },
    })
  }
}

/**
 * Handle order cancelled event
 */
async function handleOrderCancelled(
  order: Order & { items: OrderItem[] },
  printfulOrder: PrintfulWebhookPayload['data']['order']
): Promise<void> {
  // Find order item(s) for this Printful order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === String(printfulOrder.id)
  )

  if (!orderItem) {
    console.error(`No order item found for Printful order ${printfulOrder.id}`)
    return
  }

  // Update order item status to failed
  await prisma.orderItem.update({
    where: { id: orderItem.id },
    data: {
      fulfilmentStatus: 'FAILED',
    },
  })

  // Check if all items are failed/cancelled
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { fulfilmentStatus: true },
  })

  const allFailed = allItems.every((item) => item.fulfilmentStatus === 'FAILED')

  if (allFailed) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    })
  }
}
