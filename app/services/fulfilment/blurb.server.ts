/**
 * Blurb Fulfilment Service
 *
 * Handles integration with Blurb API for storybook print-on-demand fulfilment.
 */

import crypto from 'crypto'
import { prisma } from '~/services/prisma.server'
import { sendShippingNotificationEmail } from '~/services/email.server'
import { generateStorybookPDF } from './pdf-generator.server'
import type { Order, OrderItem, StorybookProject, FulfilmentStatus } from '@prisma/client'

const BLURB_API_URL = 'https://api.blurb.com/v1'

/**
 * Get Blurb API key (lazy evaluation for testing)
 */
function getBlurbApiKey(): string | undefined {
  return process.env.BLURB_API_KEY
}

// Warn on module load if not configured (non-test environment)
if (!getBlurbApiKey() && process.env.NODE_ENV !== 'test') {
  console.warn('BLURB_API_KEY not set - Blurb integration disabled')
}

/**
 * Blurb order response
 */
interface BlurbOrderResult {
  order_id: string
  status: string
  created_at: string
}

/**
 * Blurb webhook payload
 */
export interface BlurbWebhookPayload {
  event: string
  order_id: string
  external_id?: string
  status: string
  tracking?: {
    carrier: string
    tracking_number: string
    tracking_url: string
  }
  error_message?: string
  timestamp: string
}

/**
 * Status mapping from Blurb to internal status
 */
const BLURB_STATUS_MAP: Record<string, FulfilmentStatus> = {
  pending: 'PENDING',
  processing: 'SENT',
  printing: 'SENT',
  shipped: 'FULFILLED',
  delivered: 'FULFILLED',
  failed: 'FAILED',
  cancelled: 'FAILED',
}

/**
 * Make authenticated request to Blurb API
 */
async function blurbRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getBlurbApiKey()

  if (!apiKey) {
    throw new Error('Blurb API key not configured')
  }

  const response = await fetch(`${BLURB_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Blurb API error')
  }

  return response.json()
}

/**
 * Create order in Blurb
 *
 * @param order - Order details
 * @param item - Order item to fulfil
 * @param storybookId - Storybook project ID
 * @returns Blurb order ID
 */
export async function createBlurbOrder(
  order: Order,
  item: OrderItem,
  storybookId: string
): Promise<string> {
  // Get storybook project
  const storybook = await prisma.storybookProject.findUnique({
    where: { id: storybookId },
  })

  if (!storybook) {
    throw new Error('Storybook not found')
  }

  // Generate PDF if not already generated
  let pdfUrl = storybook.pdfUrl
  if (!pdfUrl) {
    pdfUrl = await generateStorybookPDF(storybook)
    await prisma.storybookProject.update({
      where: { id: storybookId },
      data: { pdfUrl },
    })
  }

  const shippingAddress = order.shippingAddress as Record<string, string>

  // Build Blurb order request
  const blurbOrderRequest = {
    external_reference: order.id,
    book: {
      pdf_url: pdfUrl,
      title: storybook.title,
      binding: item.variantName.toLowerCase().includes('hardcover') ? 'hardcover' : 'softcover',
      paper_type: 'standard',
      quantity: item.quantity,
    },
    shipping: {
      name: shippingAddress.fullName,
      address1: shippingAddress.addressLine1,
      address2: shippingAddress.addressLine2 || undefined,
      city: shippingAddress.city,
      postcode: shippingAddress.postcode,
      country: 'GB',
      email: order.customerEmail,
      phone: shippingAddress.phone || undefined,
    },
    shipping_method: 'standard',
  }

  const result = await blurbRequest<BlurbOrderResult>('/orders', {
    method: 'POST',
    body: JSON.stringify(blurbOrderRequest),
  })

  // Log fulfilment event
  await prisma.fulfilmentEvent.create({
    data: {
      orderItemId: item.id,
      provider: 'BLURB',
      eventType: 'order_created',
      payload: result as any,
      processed: true,
    },
  })

  return result.order_id
}

/**
 * Verify Blurb webhook token
 *
 * @param authHeader - Authorization header value
 * @returns True if token is valid
 */
export function verifyBlurbWebhook(authHeader: string): boolean {
  const webhookSecret = process.env.BLURB_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('BLURB_WEBHOOK_SECRET not configured')
    return false
  }

  // Blurb uses Bearer token authentication
  const token = authHeader.replace('Bearer ', '')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(webhookSecret)
    )
  } catch {
    return false
  }
}

/**
 * Handle Blurb webhook event
 *
 * @param payload - Webhook payload
 */
export async function handleBlurbWebhook(
  payload: BlurbWebhookPayload
): Promise<void> {
  const { event, order_id, external_id } = payload

  // Find our order by external_id
  let dbOrder
  if (external_id) {
    dbOrder = await prisma.order.findUnique({
      where: { id: external_id },
      include: {
        items: true,
      },
    })
  }

  // If external_id not provided, try to find by Blurb order ID
  if (!dbOrder) {
    dbOrder = await prisma.order.findFirst({
      where: {
        items: {
          some: {
            fulfilmentOrderId: order_id,
          },
        },
      },
      include: {
        items: true,
      },
    })
  }

  // Log the webhook event
  if (dbOrder && dbOrder.items.length > 0) {
    await prisma.fulfilmentEvent.create({
      data: {
        orderItemId: dbOrder.items[0].id,
        provider: 'BLURB',
        eventType: event,
        payload: payload as any,
        processed: false,
      },
    })
  }

  if (!dbOrder) {
    console.warn(`Blurb webhook for unknown order: ${order_id}`)
    return
  }

  // Handle different event types
  switch (event) {
    case 'order.shipped':
      await handleOrderShipped(dbOrder, payload)
      break

    case 'order.delivered':
      await handleOrderDelivered(dbOrder, payload)
      break

    case 'order.failed':
      await handleOrderFailed(dbOrder, payload)
      break

    case 'order.updated':
      await handleOrderUpdated(dbOrder, payload)
      break

    default:
      console.log(`Unhandled Blurb webhook type: ${event}`)
  }

  // Mark event as processed
  if (dbOrder && dbOrder.items.length > 0) {
    await prisma.fulfilmentEvent.updateMany({
      where: {
        orderItemId: dbOrder.items[0].id,
        eventType: event,
        processed: false,
      },
      data: {
        processed: true,
      },
    })
  }
}

/**
 * Handle order shipped event
 */
async function handleOrderShipped(
  order: Order & { items: OrderItem[] },
  payload: BlurbWebhookPayload
): Promise<void> {
  const tracking = payload.tracking

  if (!tracking) {
    console.error('No tracking data in order.shipped event')
    return
  }

  // Find order item(s) for this Blurb order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === payload.order_id
  )

  if (!orderItem) {
    console.error(`No order item found for Blurb order ${payload.order_id}`)
    return
  }

  // Update order item with tracking information
  await prisma.orderItem.update({
    where: { id: orderItem.id },
    data: {
      fulfilmentStatus: 'FULFILLED',
      trackingNumber: tracking.tracking_number,
      trackingUrl: tracking.tracking_url,
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
    tracking.tracking_number,
    tracking.tracking_url,
    tracking.carrier
  )
}

/**
 * Handle order delivered event
 */
async function handleOrderDelivered(
  order: Order & { items: OrderItem[] },
  payload: BlurbWebhookPayload
): Promise<void> {
  // Find order item(s) for this Blurb order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === payload.order_id
  )

  if (!orderItem) {
    console.error(`No order item found for Blurb order ${payload.order_id}`)
    return
  }

  // Check if all items are delivered
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { fulfilmentStatus: true },
  })

  const allDelivered = allItems.every((item) => item.fulfilmentStatus === 'FULFILLED')

  if (allDelivered) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED' },
    })
  }
}

/**
 * Handle order failed event
 */
async function handleOrderFailed(
  order: Order & { items: OrderItem[] },
  payload: BlurbWebhookPayload
): Promise<void> {
  // Find order item(s) for this Blurb order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === payload.order_id
  )

  if (!orderItem) {
    console.error(`No order item found for Blurb order ${payload.order_id}`)
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
    `Blurb order ${payload.order_id} failed: ${payload.error_message || 'Unknown error'}`
  )

  // TODO: Alert admin for manual review
}

/**
 * Handle order updated event
 */
async function handleOrderUpdated(
  order: Order & { items: OrderItem[] },
  payload: BlurbWebhookPayload
): Promise<void> {
  // Map Blurb status to internal status
  const internalStatus = BLURB_STATUS_MAP[payload.status] || 'SENT'

  // Find order item(s) for this Blurb order
  const orderItem = order.items.find(
    (item) => item.fulfilmentOrderId === payload.order_id
  )

  if (!orderItem) {
    console.error(`No order item found for Blurb order ${payload.order_id}`)
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
