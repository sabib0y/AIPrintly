/**
 * Order Router Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Order, OrderItem, FulfilmentProvider } from '@prisma/client'

// Mock dependencies
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    fulfilmentEvent: {
      create: vi.fn(),
    },
  },
}))

vi.mock('~/services/fulfilment/printful.server', () => ({
  createPrintfulOrder: vi.fn(),
  confirmPrintfulOrder: vi.fn(),
}))

vi.mock('~/services/fulfilment/blurb.server', () => ({
  createBlurbOrder: vi.fn(),
}))

import { prisma } from '~/services/prisma.server'
import { createPrintfulOrder, confirmPrintfulOrder } from '~/services/fulfilment/printful.server'
import { createBlurbOrder } from '~/services/fulfilment/blurb.server'
import {
  routeOrderToProviders,
  getOrderFulfilmentStatus,
  isPrintfulConfigured,
  isBlurbConfigured,
  getAvailableProviders,
} from '~/services/fulfilment/order-router.server'

describe('Order Router Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('routeOrderToProviders', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'AIP-123456',
      sessionId: 'session-1',
      userId: null,
      status: 'PAID',
      subtotalPence: 2500,
      shippingPence: 499,
      totalPence: 2999,
      currency: 'GBP',
      shippingAddress: {
        fullName: 'John Smith',
        addressLine1: '123 Test St',
        city: 'London',
        postcode: 'SW1A 1AA',
      },
      customerEmail: 'john@example.com',
      customerName: 'John Smith',
      trackingToken: 'track-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockPrintfulItem = {
      id: 'item-1',
      orderId: 'order-123',
      configurationId: 'config-1',
      productName: 'Custom Mug',
      variantName: '11oz White',
      quantity: 1,
      unitPricePence: 1500,
      totalPricePence: 1500,
      fulfilmentProvider: 'PRINTFUL' as FulfilmentProvider,
      fulfilmentStatus: 'PENDING',
      fulfilmentOrderId: null,
      trackingNumber: null,
      trackingUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      configuration: {
        id: 'config-1',
        customisation: {},
        product: {
          id: 'prod-1',
          externalId: 'printful-mug-1',
          name: 'Custom Mug',
          category: 'MUG',
        },
        variant: {
          id: 'var-1',
          externalId: 'printful-mug-variant-1',
          name: '11oz White',
          size: null,
          colour: 'White',
        },
        asset: {
          id: 'asset-1',
          storageUrl: 'https://storage.example.com/image.png',
          width: 1000,
          height: 1000,
        },
        storybook: null,
      },
    }

    const mockBlurbItem = {
      id: 'item-2',
      orderId: 'order-123',
      configurationId: 'config-2',
      productName: 'Custom Storybook',
      variantName: 'Hardcover',
      quantity: 1,
      unitPricePence: 1999,
      totalPricePence: 1999,
      fulfilmentProvider: 'BLURB' as FulfilmentProvider,
      fulfilmentStatus: 'PENDING',
      fulfilmentOrderId: null,
      trackingNumber: null,
      trackingUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      configuration: {
        id: 'config-2',
        customisation: {},
        product: {
          id: 'prod-2',
          externalId: 'blurb-storybook-1',
          name: 'Custom Storybook',
          category: 'STORYBOOK',
        },
        variant: {
          id: 'var-2',
          externalId: 'blurb-hardcover-1',
          name: 'Hardcover',
          size: null,
          colour: null,
        },
        asset: {
          id: 'asset-2',
          storageUrl: 'https://storage.example.com/cover.png',
          width: 1000,
          height: 1000,
        },
        storybook: {
          id: 'storybook-1',
          title: 'My Story',
          childName: 'Emma',
          pageCount: 24,
          pdfUrl: null,
        },
      },
    }

    it('should route Printful items successfully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [mockPrintfulItem],
      } as any)

      vi.mocked(createPrintfulOrder).mockResolvedValue('printful-order-123')
      vi.mocked(confirmPrintfulOrder).mockResolvedValue(undefined)
      vi.mocked(prisma.orderItem.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any)

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.providerOrders).toHaveLength(1)
      expect(result.providerOrders[0]).toEqual({
        provider: 'PRINTFUL',
        providerOrderId: 'printful-order-123',
        itemIds: ['item-1'],
      })

      expect(createPrintfulOrder).toHaveBeenCalledOnce()
      expect(confirmPrintfulOrder).toHaveBeenCalledWith('printful-order-123')
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: { status: 'PROCESSING' },
      })
    })

    it('should route Blurb items successfully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [mockBlurbItem],
      } as any)

      vi.mocked(createBlurbOrder).mockResolvedValue('blurb-order-456')
      vi.mocked(prisma.orderItem.update).mockResolvedValue(mockBlurbItem as any)
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any)

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.providerOrders).toHaveLength(1)
      expect(result.providerOrders[0]).toEqual({
        provider: 'BLURB',
        providerOrderId: 'blurb-order-456',
        itemIds: ['item-2'],
      })

      expect(createBlurbOrder).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'order-123' }),
        expect.objectContaining({ id: 'item-2' }),
        'storybook-1'
      )
    })

    it('should route mixed order items to both providers', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [mockPrintfulItem, mockBlurbItem],
      } as any)

      vi.mocked(createPrintfulOrder).mockResolvedValue('printful-order-123')
      vi.mocked(confirmPrintfulOrder).mockResolvedValue(undefined)
      vi.mocked(createBlurbOrder).mockResolvedValue('blurb-order-456')
      vi.mocked(prisma.orderItem.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.orderItem.update).mockResolvedValue(mockBlurbItem as any)
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any)

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.providerOrders).toHaveLength(2)

      expect(createPrintfulOrder).toHaveBeenCalledOnce()
      expect(createBlurbOrder).toHaveBeenCalledOnce()
    })

    it('should handle Printful API errors gracefully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [mockPrintfulItem],
      } as any)

      vi.mocked(createPrintfulOrder).mockRejectedValue(new Error('Printful API error'))
      vi.mocked(prisma.orderItem.updateMany).mockResolvedValue({ count: 1 })

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        itemId: 'item-1',
        provider: 'PRINTFUL',
        error: 'Printful API error',
      })

      // Items should be marked as failed
      expect(prisma.orderItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['item-1'] } },
        data: { fulfilmentStatus: 'FAILED' },
      })
    })

    it('should handle Blurb API errors gracefully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [mockBlurbItem],
      } as any)

      vi.mocked(createBlurbOrder).mockRejectedValue(new Error('Blurb API error'))
      vi.mocked(prisma.orderItem.update).mockResolvedValue(mockBlurbItem as any)

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        itemId: 'item-2',
        provider: 'BLURB',
        error: 'Blurb API error',
      })
    })

    it('should throw error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

      await expect(routeOrderToProviders('order-123')).rejects.toThrow(
        'Order not found: order-123'
      )
    })

    it('should fail Blurb item when storybook config is missing', async () => {
      const itemWithoutStorybook = {
        ...mockBlurbItem,
        configuration: {
          ...mockBlurbItem.configuration,
          storybook: null,
        },
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        items: [itemWithoutStorybook],
      } as any)

      vi.mocked(prisma.orderItem.update).mockResolvedValue(itemWithoutStorybook as any)

      const result = await routeOrderToProviders('order-123')

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Storybook configuration not found')
    })
  })

  describe('getOrderFulfilmentStatus', () => {
    it('should return correct status summary', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        {
          id: 'item-1',
          fulfilmentProvider: 'PRINTFUL',
          fulfilmentStatus: 'FULFILLED',
          trackingNumber: 'TRACK-123',
          trackingUrl: 'https://track.example.com/123',
        },
        {
          id: 'item-2',
          fulfilmentProvider: 'BLURB',
          fulfilmentStatus: 'SENT',
          trackingNumber: null,
          trackingUrl: null,
        },
      ] as any)

      const status = await getOrderFulfilmentStatus('order-123')

      expect(status.allPending).toBe(false)
      expect(status.allSent).toBe(false)
      expect(status.allFulfilled).toBe(false)
      expect(status.hasFailed).toBe(false)
      expect(status.items).toHaveLength(2)
    })

    it('should detect all items fulfilled', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        { id: 'item-1', fulfilmentProvider: 'PRINTFUL', fulfilmentStatus: 'FULFILLED', trackingNumber: '123', trackingUrl: null },
        { id: 'item-2', fulfilmentProvider: 'BLURB', fulfilmentStatus: 'FULFILLED', trackingNumber: '456', trackingUrl: null },
      ] as any)

      const status = await getOrderFulfilmentStatus('order-123')

      expect(status.allFulfilled).toBe(true)
    })

    it('should detect failed items', async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        { id: 'item-1', fulfilmentProvider: 'PRINTFUL', fulfilmentStatus: 'SENT', trackingNumber: null, trackingUrl: null },
        { id: 'item-2', fulfilmentProvider: 'BLURB', fulfilmentStatus: 'FAILED', trackingNumber: null, trackingUrl: null },
      ] as any)

      const status = await getOrderFulfilmentStatus('order-123')

      expect(status.hasFailed).toBe(true)
    })
  })

  describe('provider configuration checks', () => {
    const originalEnv = process.env

    beforeEach(() => {
      vi.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('isPrintfulConfigured returns true when API key is set', () => {
      process.env.PRINTFUL_API_KEY = 'test-key'
      expect(isPrintfulConfigured()).toBe(true)
    })

    it('isPrintfulConfigured returns false when API key is not set', () => {
      delete process.env.PRINTFUL_API_KEY
      expect(isPrintfulConfigured()).toBe(false)
    })

    it('isBlurbConfigured returns true when API key is set', () => {
      process.env.BLURB_API_KEY = 'test-key'
      expect(isBlurbConfigured()).toBe(true)
    })

    it('isBlurbConfigured returns false when API key is not set', () => {
      delete process.env.BLURB_API_KEY
      expect(isBlurbConfigured()).toBe(false)
    })

    it('getAvailableProviders returns configured providers', () => {
      process.env.PRINTFUL_API_KEY = 'test-key'
      process.env.BLURB_API_KEY = 'test-key'

      const providers = getAvailableProviders()
      expect(providers).toContain('PRINTFUL')
      expect(providers).toContain('BLURB')
    })

    it('getAvailableProviders returns empty array when no providers configured', () => {
      delete process.env.PRINTFUL_API_KEY
      delete process.env.BLURB_API_KEY

      const providers = getAvailableProviders()
      expect(providers).toHaveLength(0)
    })
  })
})
