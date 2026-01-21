/**
 * Order Routing Service
 *
 * Routes order items to the appropriate fulfilment provider
 * (Printful for merchandise, Blurb for storybooks).
 *
 * Orchestrates the submission of orders to providers after
 * successful payment.
 */

import { prisma } from '~/services/prisma.server'
import { createPrintfulOrder, confirmPrintfulOrder } from './printful.server'
import { createBlurbOrder } from './blurb.server'
import type { Order, OrderItem, FulfilmentProvider } from '@prisma/client'

/**
 * Order item with configuration for fulfilment
 */
interface OrderItemForFulfilment extends OrderItem {
  configuration: {
    id: string
    customisation: Record<string, unknown>
    product: {
      id: string
      externalId: string
      name: string
      category: string
    }
    variant: {
      id: string
      externalId: string
      name: string
      size: string | null
      colour: string | null
    }
    asset: {
      id: string
      storageUrl: string
      width: number
      height: number
    }
    storybook?: {
      id: string
      title: string
      childName: string
      pageCount: number
      pdfUrl: string | null
    } | null
  }
}

/**
 * Order with items for fulfilment routing
 */
interface OrderForFulfilment extends Order {
  items: OrderItemForFulfilment[]
}

/**
 * Result of routing an order
 */
export interface RoutingResult {
  success: boolean
  errors: Array<{
    itemId: string
    provider: FulfilmentProvider
    error: string
  }>
  providerOrders: Array<{
    provider: FulfilmentProvider
    providerOrderId: string
    itemIds: string[]
  }>
}

/**
 * Route order items to fulfilment providers
 *
 * Groups items by provider and submits to each.
 * Updates order items with provider order IDs.
 *
 * @param orderId - Order ID to route
 * @returns Routing result with success status and any errors
 */
export async function routeOrderToProviders(
  orderId: string
): Promise<RoutingResult> {
  const result: RoutingResult = {
    success: true,
    errors: [],
    providerOrders: [],
  }

  // Fetch order with all relations needed for fulfilment
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
              storybook: true,
            },
          },
        },
      },
    },
  }) as OrderForFulfilment | null

  if (!order) {
    throw new Error(`Order not found: ${orderId}`)
  }

  // Group items by provider
  const printfulItems = order.items.filter(
    (item) => item.fulfilmentProvider === 'PRINTFUL'
  )
  const blurbItems = order.items.filter(
    (item) => item.fulfilmentProvider === 'BLURB'
  )

  // Submit Printful items
  if (printfulItems.length > 0) {
    try {
      const printfulOrderId = await createPrintfulOrder(order, printfulItems)

      // Update items with provider order ID
      await prisma.orderItem.updateMany({
        where: {
          id: { in: printfulItems.map((item) => item.id) },
        },
        data: {
          fulfilmentOrderId: printfulOrderId,
          fulfilmentStatus: 'SENT',
        },
      })

      // Confirm the order to start production
      await confirmPrintfulOrder(printfulOrderId)

      result.providerOrders.push({
        provider: 'PRINTFUL',
        providerOrderId: printfulOrderId,
        itemIds: printfulItems.map((item) => item.id),
      })
    } catch (error) {
      result.success = false
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      for (const item of printfulItems) {
        result.errors.push({
          itemId: item.id,
          provider: 'PRINTFUL',
          error: errorMessage,
        })
      }

      // Update items as failed
      await prisma.orderItem.updateMany({
        where: {
          id: { in: printfulItems.map((item) => item.id) },
        },
        data: {
          fulfilmentStatus: 'FAILED',
        },
      })

      console.error('Printful order creation failed:', errorMessage)
    }
  }

  // Submit Blurb items (one order per storybook)
  for (const item of blurbItems) {
    try {
      // Get storybook ID from configuration
      const storybookId = item.configuration.storybook?.id

      if (!storybookId) {
        throw new Error('Storybook configuration not found for item')
      }

      const blurbOrderId = await createBlurbOrder(order, item, storybookId)

      // Update item with provider order ID
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          fulfilmentOrderId: blurbOrderId,
          fulfilmentStatus: 'SENT',
        },
      })

      result.providerOrders.push({
        provider: 'BLURB',
        providerOrderId: blurbOrderId,
        itemIds: [item.id],
      })
    } catch (error) {
      result.success = false
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      result.errors.push({
        itemId: item.id,
        provider: 'BLURB',
        error: errorMessage,
      })

      // Update item as failed
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          fulfilmentStatus: 'FAILED',
        },
      })

      console.error('Blurb order creation failed:', errorMessage)
    }
  }

  // Update order status based on results
  if (result.errors.length === 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    })
  } else if (result.errors.length === order.items.length) {
    // All items failed - keep as PAID for manual review
    console.error(`All items failed for order ${orderId}`)
  } else {
    // Partial failure - still move to PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    })
  }

  return result
}

/**
 * Retry failed fulfilment for an order item
 *
 * @param orderItemId - Order item ID to retry
 * @returns Success status
 */
export async function retryFulfilment(orderItemId: string): Promise<boolean> {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      configuration: {
        include: {
          product: true,
          variant: true,
          asset: true,
          storybook: true,
        },
      },
    },
  }) as (OrderItem & {
    order: Order
    configuration: OrderItemForFulfilment['configuration']
  }) | null

  if (!item) {
    throw new Error(`Order item not found: ${orderItemId}`)
  }

  if (item.fulfilmentStatus !== 'FAILED') {
    throw new Error(`Item is not in failed status: ${item.fulfilmentStatus}`)
  }

  try {
    if (item.fulfilmentProvider === 'PRINTFUL') {
      const printfulOrderId = await createPrintfulOrder(item.order, [item as unknown as OrderItem])
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: {
          fulfilmentOrderId: printfulOrderId,
          fulfilmentStatus: 'SENT',
        },
      })
      await confirmPrintfulOrder(printfulOrderId)
    } else if (item.fulfilmentProvider === 'BLURB') {
      const storybookId = item.configuration.storybook?.id
      if (!storybookId) {
        throw new Error('Storybook configuration not found for item')
      }
      const blurbOrderId = await createBlurbOrder(item.order, item as unknown as OrderItem, storybookId)
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: {
          fulfilmentOrderId: blurbOrderId,
          fulfilmentStatus: 'SENT',
        },
      })
    }

    return true
  } catch (error) {
    console.error(`Retry failed for item ${orderItemId}:`, error)
    return false
  }
}

/**
 * Get fulfilment status summary for an order
 *
 * @param orderId - Order ID
 * @returns Status summary
 */
export async function getOrderFulfilmentStatus(orderId: string): Promise<{
  allPending: boolean
  allSent: boolean
  allFulfilled: boolean
  hasFailed: boolean
  items: Array<{
    id: string
    provider: FulfilmentProvider
    status: string
    trackingNumber: string | null
    trackingUrl: string | null
  }>
}> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      id: true,
      fulfilmentProvider: true,
      fulfilmentStatus: true,
      trackingNumber: true,
      trackingUrl: true,
    },
  })

  const allPending = items.every((item) => item.fulfilmentStatus === 'PENDING')
  const allSent = items.every((item) => item.fulfilmentStatus === 'SENT')
  const allFulfilled = items.every((item) => item.fulfilmentStatus === 'FULFILLED')
  const hasFailed = items.some((item) => item.fulfilmentStatus === 'FAILED')

  return {
    allPending,
    allSent,
    allFulfilled,
    hasFailed,
    items: items.map((item) => ({
      id: item.id,
      provider: item.fulfilmentProvider,
      status: item.fulfilmentStatus,
      trackingNumber: item.trackingNumber,
      trackingUrl: item.trackingUrl,
    })),
  }
}

/**
 * Check if Printful API is configured
 */
export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY)
}

/**
 * Check if Blurb API is configured
 */
export function isBlurbConfigured(): boolean {
  return Boolean(process.env.BLURB_API_KEY)
}

/**
 * Get available fulfilment providers
 */
export function getAvailableProviders(): FulfilmentProvider[] {
  const providers: FulfilmentProvider[] = []

  if (isPrintfulConfigured()) {
    providers.push('PRINTFUL')
  }

  if (isBlurbConfigured()) {
    providers.push('BLURB')
  }

  return providers
}
