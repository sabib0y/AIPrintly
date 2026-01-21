/**
 * Printful Webhook Route Tests
 *
 * Tests for the Printful webhook handler route.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// Set environment variables before importing
process.env.PRINTFUL_WEBHOOK_SECRET = 'test_webhook_secret'
process.env.PRINTFUL_API_KEY = 'test_api_key'

// Mock the Printful service
vi.mock('~/services/fulfilment/printful.server', () => ({
  handlePrintfulWebhook: vi.fn(),
  verifyPrintfulWebhook: vi.fn(),
  PrintfulWebhookPayload: {},
}))

// Import after mocks
import { action } from '~/routes/api.webhooks.printful'
import { handlePrintfulWebhook, verifyPrintfulWebhook } from '~/services/fulfilment/printful.server'

describe('Printful Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject non-POST requests', async () => {
    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'GET',
    })

    const response = await action({ request, params: {}, context: {} })

    expect(response.status).toBe(405)
    expect(await response.text()).toBe('Method not allowed')
  })

  it('should reject requests without signature header', async () => {
    const payload = {
      type: 'package_shipped',
      data: { order: { id: 123, external_id: 'order-1', status: 'fulfilled' } },
    }

    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const response = await action({ request, params: {}, context: {} })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should reject requests with invalid signature', async () => {
    const payload = {
      type: 'package_shipped',
      data: { order: { id: 123, external_id: 'order-1', status: 'fulfilled' } },
    }

    const body = JSON.stringify(payload)

    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printful-Signature': 'invalid_signature',
      },
      body,
    })

    ;(verifyPrintfulWebhook as any).mockReturnValue(false)

    const response = await action({ request, params: {}, context: {} })

    expect(response.status).toBe(401)
    expect(verifyPrintfulWebhook).toHaveBeenCalledWith(body, 'invalid_signature')
  })

  it('should process valid webhook successfully', async () => {
    const payload = {
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
              service: 'Standard',
              tracking_number: 'RM123456789GB',
              tracking_url: 'https://track.royalmail.com/RM123456789GB',
              ship_date: '2025-01-20',
            },
          ],
        },
      },
    }

    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'test_webhook_secret')
      .update(body)
      .digest('hex')

    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printful-Signature': signature,
      },
      body,
    })

    ;(verifyPrintfulWebhook as any).mockReturnValue(true)
    ;(handlePrintfulWebhook as any).mockResolvedValue(undefined)

    const response = await action({ request, params: {}, context: {} })

    expect(response.status).toBe(200)
    expect(verifyPrintfulWebhook).toHaveBeenCalledWith(body, signature)
    expect(handlePrintfulWebhook).toHaveBeenCalledWith(payload)

    const responseData = await response.json()
    expect(responseData).toEqual({ received: true })
  })

  it('should return 200 even if processing fails (to prevent retries)', async () => {
    const payload = {
      type: 'package_shipped',
      created: Math.floor(Date.now() / 1000),
      retries: 0,
      store: 123456,
      data: {
        order: {
          id: 12345678,
          external_id: 'order-1',
          status: 'fulfilled',
        },
      },
    }

    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'test_webhook_secret')
      .update(body)
      .digest('hex')

    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printful-Signature': signature,
      },
      body,
    })

    ;(verifyPrintfulWebhook as any).mockReturnValue(true)
    ;(handlePrintfulWebhook as any).mockRejectedValue(new Error('Database error'))

    const response = await action({ request, params: {}, context: {} })

    // Should still return 200 to prevent webhook retries
    expect(response.status).toBe(200)

    const responseData = await response.json()
    expect(responseData).toEqual({ received: true, error: 'Processing failed' })
  })

  it('should return 400 for malformed JSON', async () => {
    const invalidBody = '{invalid json'
    const signature = crypto
      .createHmac('sha256', 'test_webhook_secret')
      .update(invalidBody)
      .digest('hex')

    const request = new Request('http://localhost/api/webhooks/printful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printful-Signature': signature,
      },
      body: invalidBody,
    })

    ;(verifyPrintfulWebhook as any).mockReturnValue(true)

    const response = await action({ request, params: {}, context: {} })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Bad Request')
  })
})
