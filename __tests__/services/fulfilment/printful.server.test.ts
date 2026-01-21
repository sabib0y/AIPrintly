/**
 * Printful Service Tests
 *
 * Tests for Printful fulfilment provider integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Order, OrderItem } from '@prisma/client'

// Set environment variables BEFORE importing module (must happen at module level)
process.env.PRINTFUL_API_KEY = 'test_api_key'
process.env.PRINTFUL_WEBHOOK_SECRET = 'test_webhook_secret'

// Mock fetch globally
global.fetch = vi.fn()

// Mock Prisma
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    fulfilmentEvent: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock email service
vi.mock('~/services/email.server', () => ({
  sendShippingNotificationEmail: vi.fn(),
}))

// Import after mocks
import { createPrintfulOrder, verifyPrintfulWebhook, handlePrintfulWebhook } from '~/services/fulfilment/printful.server'
import { prisma } from '~/services/prisma.server'

describe('Printful Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set test environment variables
    process.env.PRINTFUL_API_KEY = 'test_api_key'
    process.env.PRINTFUL_WEBHOOK_SECRET = 'test_webhook_secret'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createPrintfulOrder', () => {
    it('should create a Printful order successfully', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'PAID',
        subtotalPence: 2000,
        shippingPence: 500,
        totalPence: 2500,
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Smith',
          addressLine1: '123 High Street',
          addressLine2: 'Flat 4',
          city: 'London',
          postcode: 'SW1A 1AA',
          email: 'john@example.com',
          phone: '07700123456',
        },
        billingAddress: null,
        customerEmail: 'john@example.com',
        customerName: 'John Smith',
        stripePaymentIntentId: 'pi_123',
        stripeCheckoutSessionId: 'cs_123',
        trackingToken: 'track-123',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItems: OrderItem[] = [
        {
          id: 'item-1',
          orderId: 'order-1',
          configurationId: 'config-1',
          productName: 'White Mug',
          variantName: '11oz',
          quantity: 2,
          unitPricePence: 1000,
          totalPricePence: 2000,
          fulfilmentProvider: 'PRINTFUL',
          fulfilmentOrderId: null,
          fulfilmentStatus: 'PENDING',
          trackingNumber: null,
          trackingUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockPrintfulResponse = {
        code: 200,
        result: {
          id: 12345678,
          external_id: 'order-1',
          status: 'draft',
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrintfulResponse,
      })

      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-1',
      })

      const result = await createPrintfulOrder(mockOrder, mockOrderItems)

      expect(result).toBe('12345678')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.printful.com/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test_api_key',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(prisma.fulfilmentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider: 'PRINTFUL',
            eventType: 'order_created',
          }),
        })
      )
    })

    it('should throw error when Printful API fails', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: null,
        status: 'PAID',
        subtotalPence: 2000,
        shippingPence: 500,
        totalPence: 2500,
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Smith',
          addressLine1: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          email: 'john@example.com',
        },
        billingAddress: null,
        customerEmail: 'john@example.com',
        customerName: 'John Smith',
        stripePaymentIntentId: 'pi_123',
        stripeCheckoutSessionId: 'cs_123',
        trackingToken: 'track-123',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItems: OrderItem[] = []

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      })

      await expect(createPrintfulOrder(mockOrder, mockOrderItems)).rejects.toThrow(
        'Invalid API key'
      )
    })

    it('should include correct recipient and item data', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: null,
        status: 'PAID',
        subtotalPence: 2000,
        shippingPence: 500,
        totalPence: 2500,
        currency: 'GBP',
        shippingAddress: {
          fullName: 'Jane Doe',
          addressLine1: '456 Market Street',
          addressLine2: 'Suite 10',
          city: 'Manchester',
          postcode: 'M1 1AA',
          email: 'jane@example.com',
          phone: '07700654321',
        },
        billingAddress: null,
        customerEmail: 'jane@example.com',
        customerName: 'Jane Doe',
        stripePaymentIntentId: 'pi_456',
        stripeCheckoutSessionId: 'cs_456',
        trackingToken: 'track-456',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItems: OrderItem[] = [
        {
          id: 'item-1',
          orderId: 'order-1',
          configurationId: 'config-1',
          productName: 'Black T-Shirt',
          variantName: 'Medium',
          quantity: 1,
          unitPricePence: 2000,
          totalPricePence: 2000,
          fulfilmentProvider: 'PRINTFUL',
          fulfilmentOrderId: null,
          fulfilmentStatus: 'PENDING',
          trackingNumber: null,
          trackingUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          result: { id: 98765432, external_id: 'order-1', status: 'draft' },
        }),
      })

      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-2',
      })

      await createPrintfulOrder(mockOrder, mockOrderItems)

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.recipient).toEqual({
        name: 'Jane Doe',
        address1: '456 Market Street',
        address2: 'Suite 10',
        city: 'Manchester',
        country_code: 'GB',
        zip: 'M1 1AA',
        phone: '07700654321',
        email: 'jane@example.com',
      })
    })
  })

  describe('verifyPrintfulWebhook', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ type: 'package_shipped', data: {} })
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(payload)
        .digest('hex')

      const result = verifyPrintfulWebhook(payload, signature)

      expect(result).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ type: 'package_shipped', data: {} })
      const invalidSignature = 'invalid_signature_12345'

      const result = verifyPrintfulWebhook(payload, invalidSignature)

      expect(result).toBe(false)
    })

    it('should reject webhook with wrong secret', () => {
      const payload = JSON.stringify({ type: 'package_shipped', data: {} })
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(payload)
        .digest('hex')

      const result = verifyPrintfulWebhook(payload, signature)

      expect(result).toBe(false)
    })
  })

  describe('handlePrintfulWebhook', () => {
    it('should handle package_shipped event', async () => {
      const webhookPayload = {
        type: 'package_shipped',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 123456,
        data: {
          order: {
            id: 12345678,
            external_id: 'order-1',
            status: 'fulfilled',
            shipments: [
              {
                carrier: 'Royal Mail',
                service: 'Standard Delivery',
                tracking_number: 'RM123456789GB',
                tracking_url: 'https://track.royalmail.com/RM123456789GB',
                ship_date: '2025-01-20',
              },
            ],
          },
        },
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 'AIP-123456',
        customerEmail: 'john@example.com',
        customerName: 'John Smith',
        items: [{ id: 'item-1', fulfilmentOrderId: '12345678' }],
      })

      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-1',
      })

      ;(prisma.orderItem.update as any).mockResolvedValueOnce({
        id: 'item-1',
      })

      ;(prisma.orderItem.findMany as any).mockResolvedValueOnce([
        { fulfilmentStatus: 'FULFILLED' },
      ])

      ;(prisma.order.update as any).mockResolvedValueOnce({
        id: 'order-1',
      })

      ;(prisma.fulfilmentEvent.updateMany as any).mockResolvedValueOnce({
        count: 1,
      })

      await handlePrintfulWebhook(webhookPayload)

      expect(prisma.fulfilmentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider: 'PRINTFUL',
            eventType: 'package_shipped',
          }),
        })
      )

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fulfilmentStatus: 'FULFILLED',
            trackingNumber: 'RM123456789GB',
            trackingUrl: 'https://track.royalmail.com/RM123456789GB',
          }),
        })
      )
    })

    it('should handle order_failed event', async () => {
      const webhookPayload = {
        type: 'order_failed',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 123456,
        data: {
          order: {
            id: 12345678,
            external_id: 'order-1',
            status: 'failed',
            error: 'Product out of stock',
          },
        },
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 'AIP-123456',
        items: [{ id: 'item-1', fulfilmentOrderId: '12345678' }],
      })

      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-2',
      })

      ;(prisma.orderItem.update as any).mockResolvedValueOnce({
        id: 'item-1',
      })

      ;(prisma.fulfilmentEvent.updateMany as any).mockResolvedValueOnce({
        count: 1,
      })

      await handlePrintfulWebhook(webhookPayload)

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fulfilmentStatus: 'FAILED',
          }),
        })
      )
    })

    it('should handle order_updated event with status mapping', async () => {
      const webhookPayload = {
        type: 'order_updated',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 123456,
        data: {
          order: {
            id: 12345678,
            external_id: 'order-1',
            status: 'inprocess',
          },
        },
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 'AIP-123456',
        items: [{ id: 'item-1', fulfilmentOrderId: '12345678' }],
      })

      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-3',
      })

      ;(prisma.orderItem.update as any).mockResolvedValueOnce({
        id: 'item-1',
      })

      ;(prisma.orderItem.findMany as any).mockResolvedValueOnce([
        { fulfilmentStatus: 'SENT' },
      ])

      ;(prisma.order.update as any).mockResolvedValueOnce({
        id: 'order-1',
      })

      ;(prisma.fulfilmentEvent.updateMany as any).mockResolvedValueOnce({
        count: 1,
      })

      await handlePrintfulWebhook(webhookPayload)

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fulfilmentStatus: 'SENT',
          }),
        })
      )
    })

    it('should gracefully handle webhook for non-existent order', async () => {
      const webhookPayload = {
        type: 'package_shipped',
        created: Math.floor(Date.now() / 1000),
        retries: 0,
        store: 123456,
        data: {
          order: {
            id: 99999999,
            external_id: 'order-nonexistent',
            status: 'fulfilled',
            shipments: [],
          },
        },
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce(null)

      // Should not throw
      await expect(handlePrintfulWebhook(webhookPayload)).resolves.toBeUndefined()

      // Should not create a fulfilment event for non-existent order
      expect(prisma.fulfilmentEvent.create).not.toHaveBeenCalled()
    })
  })
})
