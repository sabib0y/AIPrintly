/**
 * Blurb Service Tests
 *
 * Tests for Blurb storybook fulfilment provider integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Order, OrderItem, StorybookProject } from '@prisma/client'

// Set environment variables before importing
process.env.BLURB_API_KEY = 'test_blurb_api_key'
process.env.BLURB_WEBHOOK_SECRET = 'test_blurb_webhook_secret'

// Mock fetch globally
global.fetch = vi.fn()

// Mock Prisma
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    storybookProject: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    fulfilmentEvent: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock PDF generation service
vi.mock('~/services/fulfilment/pdf-generator.server', () => ({
  generateStorybookPDF: vi.fn(),
}))

// Mock email service
vi.mock('~/services/email.server', () => ({
  sendShippingNotificationEmail: vi.fn(),
}))

// Import after mocks
import { createBlurbOrder, verifyBlurbWebhook, handleBlurbWebhook } from '~/services/fulfilment/blurb.server'
import { prisma } from '~/services/prisma.server'
import { generateStorybookPDF } from '~/services/fulfilment/pdf-generator.server'

describe('Blurb Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createBlurbOrder', () => {
    it('should create a Blurb order successfully', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'PAID',
        subtotalPence: 2500,
        shippingPence: 500,
        totalPence: 3000,
        currency: 'GBP',
        shippingAddress: {
          fullName: 'Sarah Johnson',
          addressLine1: '456 Oak Avenue',
          city: 'Manchester',
          postcode: 'M1 1AA',
          email: 'sarah@example.com',
          phone: '07700123456',
        },
        billingAddress: null,
        customerEmail: 'sarah@example.com',
        customerName: 'Sarah Johnson',
        stripePaymentIntentId: 'pi_123',
        stripeCheckoutSessionId: 'cs_123',
        trackingToken: 'track-123',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItem: OrderItem = {
        id: 'item-1',
        orderId: 'order-1',
        configurationId: 'config-1',
        productName: 'Hardcover Storybook',
        variantName: '8x8 Hardcover',
        quantity: 1,
        unitPricePence: 2500,
        totalPricePence: 2500,
        fulfilmentProvider: 'BLURB',
        fulfilmentOrderId: null,
        fulfilmentStatus: 'PENDING',
        trackingNumber: null,
        trackingUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockStorybook: StorybookProject = {
        id: 'storybook-1',
        configurationId: 'config-1',
        title: 'Emma\'s Space Adventure',
        childName: 'Emma',
        childAge: 5,
        theme: 'space',
        pageCount: 20,
        pages: [],
        coverAssetId: 'asset-1',
        pdfUrl: 'https://storage.example.com/storybook-1.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockBlurbResponse = {
        order_id: 'BLURB-98765',
        status: 'processing',
        created_at: new Date().toISOString(),
      }

      ;(prisma.storybookProject.findUnique as any).mockResolvedValueOnce(mockStorybook)
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlurbResponse,
      })
      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-1',
      })

      const result = await createBlurbOrder(mockOrder, mockOrderItem, 'storybook-1')

      expect(result).toBe('BLURB-98765')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.blurb.com/v1/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test_blurb_api_key',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(prisma.fulfilmentEvent.create).toHaveBeenCalled()
    })

    it('should generate PDF if not already present', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: null,
        status: 'PAID',
        subtotalPence: 2500,
        shippingPence: 500,
        totalPence: 3000,
        currency: 'GBP',
        shippingAddress: {
          fullName: 'Sarah Johnson',
          addressLine1: '456 Oak Avenue',
          city: 'Manchester',
          postcode: 'M1 1AA',
          email: 'sarah@example.com',
        },
        billingAddress: null,
        customerEmail: 'sarah@example.com',
        customerName: 'Sarah Johnson',
        stripePaymentIntentId: 'pi_123',
        stripeCheckoutSessionId: 'cs_123',
        trackingToken: 'track-123',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItem: OrderItem = {
        id: 'item-1',
        orderId: 'order-1',
        configurationId: 'config-1',
        productName: 'Hardcover Storybook',
        variantName: '8x8 Hardcover',
        quantity: 1,
        unitPricePence: 2500,
        totalPricePence: 2500,
        fulfilmentProvider: 'BLURB',
        fulfilmentOrderId: null,
        fulfilmentStatus: 'PENDING',
        trackingNumber: null,
        trackingUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockStorybook: StorybookProject = {
        id: 'storybook-1',
        configurationId: 'config-1',
        title: 'Emma\'s Space Adventure',
        childName: 'Emma',
        childAge: 5,
        theme: 'space',
        pageCount: 20,
        pages: [],
        coverAssetId: 'asset-1',
        pdfUrl: null, // No PDF yet
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.storybookProject.findUnique as any).mockResolvedValueOnce(mockStorybook)
      ;(generateStorybookPDF as any).mockResolvedValueOnce('https://storage.example.com/storybook-1.pdf')
      ;(prisma.storybookProject.update as any).mockResolvedValueOnce({
        ...mockStorybook,
        pdfUrl: 'https://storage.example.com/storybook-1.pdf',
      })
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order_id: 'BLURB-98765', status: 'processing' }),
      })
      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-1',
      })

      await createBlurbOrder(mockOrder, mockOrderItem, 'storybook-1')

      expect(generateStorybookPDF).toHaveBeenCalledWith(mockStorybook)
      expect(prisma.storybookProject.update).toHaveBeenCalledWith({
        where: { id: 'storybook-1' },
        data: { pdfUrl: 'https://storage.example.com/storybook-1.pdf' },
      })
    })

    it('should throw error when storybook not found', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        orderNumber: 'AIP-123456',
        sessionId: 'session-1',
        userId: null,
        status: 'PAID',
        subtotalPence: 2500,
        shippingPence: 500,
        totalPence: 3000,
        currency: 'GBP',
        shippingAddress: {},
        billingAddress: null,
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        stripePaymentIntentId: null,
        stripeCheckoutSessionId: null,
        trackingToken: 'track-123',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderItem: OrderItem = {
        id: 'item-1',
        orderId: 'order-1',
        configurationId: 'config-1',
        productName: 'Hardcover Storybook',
        variantName: '8x8 Hardcover',
        quantity: 1,
        unitPricePence: 2500,
        totalPricePence: 2500,
        fulfilmentProvider: 'BLURB',
        fulfilmentOrderId: null,
        fulfilmentStatus: 'PENDING',
        trackingNumber: null,
        trackingUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.storybookProject.findUnique as any).mockResolvedValueOnce(null)

      await expect(
        createBlurbOrder(mockOrder, mockOrderItem, 'nonexistent-storybook')
      ).rejects.toThrow('Storybook not found')
    })
  })

  describe('verifyBlurbWebhook', () => {
    it('should verify valid webhook token', () => {
      const authHeader = 'Bearer test_blurb_webhook_secret'

      const result = verifyBlurbWebhook(authHeader)

      expect(result).toBe(true)
    })

    it('should reject invalid webhook token', () => {
      const authHeader = 'Bearer wrong_token'

      const result = verifyBlurbWebhook(authHeader)

      expect(result).toBe(false)
    })

    it('should reject malformed auth header', () => {
      const authHeader = 'InvalidFormat'

      const result = verifyBlurbWebhook(authHeader)

      expect(result).toBe(false)
    })
  })

  describe('handleBlurbWebhook', () => {
    it('should handle order.shipped event', async () => {
      const webhookPayload = {
        event: 'order.shipped',
        order_id: 'BLURB-98765',
        external_id: 'order-1',
        status: 'shipped',
        tracking: {
          carrier: 'DPD',
          tracking_number: 'DPD123456789',
          tracking_url: 'https://track.dpd.co.uk/DPD123456789',
        },
        timestamp: new Date().toISOString(),
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 'AIP-123456',
        customerEmail: 'sarah@example.com',
        items: [{ id: 'item-1', fulfilmentOrderId: 'BLURB-98765' }],
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

      await handleBlurbWebhook(webhookPayload)

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fulfilmentStatus: 'FULFILLED',
            trackingNumber: 'DPD123456789',
            trackingUrl: 'https://track.dpd.co.uk/DPD123456789',
          }),
        })
      )
    })

    it('should handle order.failed event', async () => {
      const webhookPayload = {
        event: 'order.failed',
        order_id: 'BLURB-98765',
        external_id: 'order-1',
        status: 'failed',
        error_message: 'Print quality check failed',
        timestamp: new Date().toISOString(),
      }

      ;(prisma.order.findUnique as any).mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 'AIP-123456',
        items: [{ id: 'item-1', fulfilmentOrderId: 'BLURB-98765' }],
      })
      ;(prisma.fulfilmentEvent.create as any).mockResolvedValueOnce({
        id: 'event-1',
      })
      ;(prisma.orderItem.update as any).mockResolvedValueOnce({
        id: 'item-1',
      })
      ;(prisma.fulfilmentEvent.updateMany as any).mockResolvedValueOnce({
        count: 1,
      })

      await handleBlurbWebhook(webhookPayload)

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fulfilmentStatus: 'FAILED',
          }),
        })
      )
    })
  })
})
