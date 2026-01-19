/**
 * Orders Service
 *
 * Server-side order operations including creation, retrieval,
 * and status management.
 */

import { nanoid } from 'nanoid'
import { prisma } from './prisma.server'
import type { Order, OrderItem, OrderStatus, Product, ProductVariant, Asset, ProductConfiguration } from '@prisma/client'
import type { CartItemWithConfiguration } from './cart.server'
import type { ShippingAddress } from '~/components/checkout'

/**
 * Order item with configuration relation
 */
export type OrderItemWithConfiguration = OrderItem & {
  configuration: (ProductConfiguration & {
    product: Product
    variant: ProductVariant
    asset: Asset
  }) | null
}

/**
 * Order with items included
 */
export type OrderWithItems = Order & {
  items: OrderItemWithConfiguration[]
}

/**
 * Parameters for creating an order from cart
 */
export interface CreateOrderParams {
  sessionId: string
  userId: string | null
  shippingAddress: ShippingAddress
  subtotalPence: number
  shippingPence: number
  stripePaymentIntentId: string | null
  stripeCheckoutSessionId: string | null
  cartItems: CartItemWithConfiguration[]
}

/**
 * Generate order number in format AIP-XXXXXX
 *
 * Uses nanoid for randomness and uppercase alphanumeric characters.
 */
export function generateOrderNumber(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Excludes I and O to avoid confusion
  let number = ''
  for (let i = 0; i < 6; i++) {
    number += chars[Math.floor(Math.random() * chars.length)]
  }
  return `AIP-${number}`
}

/**
 * Generate tracking token
 *
 * Used for anonymous order tracking access.
 */
export function generateTrackingToken(): string {
  return nanoid(24)
}

/**
 * Create an order from cart items
 *
 * @param params - Order creation parameters
 * @returns Created order with items
 */
export async function createOrderFromCart(
  params: CreateOrderParams
): Promise<OrderWithItems> {
  const {
    sessionId,
    userId,
    shippingAddress,
    subtotalPence,
    shippingPence,
    stripePaymentIntentId,
    stripeCheckoutSessionId,
    cartItems,
  } = params

  // Generate unique order number (with retry on collision)
  let orderNumber: string
  let attempts = 0
  const maxAttempts = 5

  do {
    orderNumber = generateOrderNumber()
    const existing = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    })

    if (!existing) break
    attempts++
  } while (attempts < maxAttempts)

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique order number')
  }

  // Generate tracking token
  const trackingToken = generateTrackingToken()

  // Calculate total
  const totalPence = subtotalPence + shippingPence

  // Create order with items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        sessionId,
        userId,
        status: 'PAID',
        subtotalPence,
        shippingPence,
        totalPence,
        currency: 'GBP',
        shippingAddress: shippingAddress as unknown as { [key: string]: string | number | boolean },
        customerEmail: shippingAddress.email,
        customerName: shippingAddress.fullName,
        stripePaymentIntentId,
        stripeCheckoutSessionId,
        trackingToken,
      },
    })

    // Create order items
    const orderItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        // Determine fulfilment provider based on product category
        const provider =
          cartItem.configuration.product.category === 'STORYBOOK'
            ? 'BLURB'
            : 'PRINTFUL'

        return tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            configurationId: cartItem.configurationId,
            productName: cartItem.configuration.product.name,
            variantName: cartItem.configuration.variant.name,
            quantity: cartItem.quantity,
            unitPricePence: cartItem.unitPricePence,
            totalPricePence: cartItem.unitPricePence * cartItem.quantity,
            fulfilmentProvider: provider,
            fulfilmentStatus: 'PENDING',
          },
        })
      })
    )

    // Update asset status to ORDERED
    await tx.asset.updateMany({
      where: {
        id: {
          in: cartItems.map((item) => item.configuration.assetId),
        },
      },
      data: {
        status: 'ORDERED',
      },
    })

    return {
      ...newOrder,
      items: orderItems,
    } as OrderWithItems
  })

  return order
}

/**
 * Get order by ID
 *
 * @param orderId - Order ID
 * @returns Order with items or null
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
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
            },
          },
        },
      },
    },
  })
  return order as OrderWithItems | null
}

/**
 * Get order by order number
 *
 * @param orderNumber - Order number (AIP-XXXXXX)
 * @returns Order with items or null
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      },
    },
  })
  return order as OrderWithItems | null
}

/**
 * Get order by tracking token
 *
 * @param trackingToken - Tracking token for anonymous access
 * @returns Order with items or null
 */
export async function getOrderByTrackingToken(
  trackingToken: string
): Promise<OrderWithItems | null> {
  const order = await prisma.order.findUnique({
    where: { trackingToken },
    include: {
      items: {
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      },
    },
  })
  return order as OrderWithItems | null
}

/**
 * Get orders for a user
 *
 * @param userId - User ID
 * @param limit - Maximum number of orders to return
 * @param offset - Number of orders to skip
 * @returns List of orders with items
 */
export async function getOrdersByUserId(
  userId: string,
  limit = 10,
  offset = 0
): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  }) as Promise<OrderWithItems[]>
}

/**
 * Get orders for a session (guest orders)
 *
 * @param sessionId - Session ID
 * @returns List of orders with items
 */
export async function getOrdersBySessionId(
  sessionId: string
): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    where: { sessionId },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  }) as Promise<OrderWithItems[]>
}

/**
 * Update order status
 *
 * @param orderId - Order ID
 * @param status - New status
 * @returns Updated order
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  })
}

/**
 * Update order item fulfilment status
 *
 * @param orderItemId - Order item ID
 * @param status - New fulfilment status
 * @param trackingNumber - Tracking number (optional)
 * @param trackingUrl - Tracking URL (optional)
 * @returns Updated order item
 */
export async function updateOrderItemFulfilment(
  orderItemId: string,
  status: 'PENDING' | 'SENT' | 'FULFILLED' | 'FAILED',
  trackingNumber?: string,
  trackingUrl?: string
): Promise<OrderItem> {
  return prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      fulfilmentStatus: status,
      trackingNumber,
      trackingUrl,
    },
  })
}

/**
 * Get order count for user
 *
 * @param userId - User ID
 * @returns Total number of orders
 */
export async function getOrderCountByUserId(userId: string): Promise<number> {
  return prisma.order.count({
    where: { userId },
  })
}

/**
 * Check if all order items are fulfilled
 *
 * @param orderId - Order ID
 * @returns True if all items are fulfilled
 */
export async function isOrderFullyFulfilled(orderId: string): Promise<boolean> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { fulfilmentStatus: true },
  })

  return items.every((item) => item.fulfilmentStatus === 'FULFILLED')
}

/**
 * Get recent orders (admin function)
 *
 * @param limit - Maximum number of orders
 * @param status - Filter by status (optional)
 * @returns List of orders
 */
export async function getRecentOrders(
  limit = 20,
  status?: OrderStatus
): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }) as Promise<OrderWithItems[]>
}

/**
 * Calculate order statistics
 *
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Order statistics
 */
export async function getOrderStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  statusBreakdown: Record<OrderStatus, number>
}> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      totalPence: true,
      status: true,
    },
  })

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPence, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const statusBreakdown = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>
  )

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    statusBreakdown,
  }
}
