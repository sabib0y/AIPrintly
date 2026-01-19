/**
 * Orders Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  order: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  asset: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('~/services/prisma.server', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  generateOrderNumber,
  generateTrackingToken,
  getOrderById,
  getOrderByNumber,
  getOrderByTrackingToken,
  getOrdersByUserId,
  updateOrderStatus,
  isOrderFullyFulfilled,
} from '../orders.server'

describe('Orders Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOrderNumber', () => {
    it('should generate order number in AIP-XXXXXX format', () => {
      const orderNumber = generateOrderNumber()

      expect(orderNumber).toMatch(/^AIP-[A-Z0-9]{6}$/)
    })

    it('should generate unique order numbers', () => {
      const numbers = new Set()
      for (let i = 0; i < 100; i++) {
        numbers.add(generateOrderNumber())
      }

      // All 100 should be unique (statistically very likely)
      expect(numbers.size).toBe(100)
    })

    it('should not include confusing characters (I and O)', () => {
      // Generate many order numbers and check none contain I or O
      for (let i = 0; i < 50; i++) {
        const orderNumber = generateOrderNumber()
        expect(orderNumber).not.toMatch(/[IO]/)
      }
    })
  })

  describe('generateTrackingToken', () => {
    it('should generate 24 character token', () => {
      const token = generateTrackingToken()

      expect(token).toHaveLength(24)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateTrackingToken())
      }

      expect(tokens.size).toBe(100)
    })
  })

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AIP-ABC123',
        status: 'PAID',
        items: [],
      }

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

      const result = await getOrderById('order-1')

      expect(result).toEqual(mockOrder)
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
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
    })

    it('should return null when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null)

      const result = await getOrderById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getOrderByNumber', () => {
    it('should return order when found by order number', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AIP-ABC123',
        status: 'PAID',
        items: [],
      }

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

      const result = await getOrderByNumber('AIP-ABC123')

      expect(result).toEqual(mockOrder)
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: 'AIP-ABC123' },
        include: expect.any(Object),
      })
    })
  })

  describe('getOrderByTrackingToken', () => {
    it('should return order when found by tracking token', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AIP-ABC123',
        trackingToken: 'abc123xyz789token12345678',
        status: 'PAID',
        items: [],
      }

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

      const result = await getOrderByTrackingToken('abc123xyz789token12345678')

      expect(result).toEqual(mockOrder)
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { trackingToken: 'abc123xyz789token12345678' },
        include: expect.any(Object),
      })
    })
  })

  describe('getOrdersByUserId', () => {
    it('should return orders for user with pagination', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'AIP-ABC123', items: [] },
        { id: 'order-2', orderNumber: 'AIP-DEF456', items: [] },
      ]

      mockPrisma.order.findMany.mockResolvedValue(mockOrders)

      const result = await getOrdersByUserId('user-1', 10, 0)

      expect(result).toEqual(mockOrders)
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      })
    })

    it('should use default pagination values', async () => {
      mockPrisma.order.findMany.mockResolvedValue([])

      await getOrdersByUserId('user-1')

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        })
      )
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'SHIPPED',
      }

      mockPrisma.order.update.mockResolvedValue(mockOrder)

      const result = await updateOrderStatus('order-1', 'SHIPPED')

      expect(result).toEqual(mockOrder)
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'SHIPPED' },
      })
    })
  })

  describe('isOrderFullyFulfilled', () => {
    it('should return true when all items are fulfilled', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([
        { fulfilmentStatus: 'FULFILLED' },
        { fulfilmentStatus: 'FULFILLED' },
      ])

      const result = await isOrderFullyFulfilled('order-1')

      expect(result).toBe(true)
    })

    it('should return false when some items are not fulfilled', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([
        { fulfilmentStatus: 'FULFILLED' },
        { fulfilmentStatus: 'PENDING' },
      ])

      const result = await isOrderFullyFulfilled('order-1')

      expect(result).toBe(false)
    })

    it('should return true for empty order', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([])

      const result = await isOrderFullyFulfilled('order-1')

      expect(result).toBe(true)
    })
  })
})
