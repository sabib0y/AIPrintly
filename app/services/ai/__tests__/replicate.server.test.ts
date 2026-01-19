/**
 * Replicate Provider Tests
 *
 * Tests for the Replicate SDXL image generation provider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Set environment variables before imports
beforeEach(() => {
  vi.stubEnv('REPLICATE_API_TOKEN', 'test-replicate-token')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Replicate Provider', () => {
  describe('isAvailable', () => {
    it('should return true when API token is configured', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      const provider = new ReplicateProvider()

      expect(provider.isAvailable()).toBe(true)
    })

    it('should return false when API token is missing', async () => {
      vi.stubEnv('REPLICATE_API_TOKEN', '')

      // Need to reimport to pick up new env value
      vi.resetModules()
      const { ReplicateProvider } = await import('../replicate.server')

      const provider = new ReplicateProvider()

      expect(provider.isAvailable()).toBe(false)
    })
  })

  describe('generateImage', () => {
    it('should create a prediction and poll for result', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      // Mock successful prediction creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_123',
              status: 'starting',
            }),
        })
        // Mock status check - completed
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_123',
              status: 'succeeded',
              output: ['https://replicate.delivery/output.png'],
            }),
        })

      const provider = new ReplicateProvider()
      const result = await provider.generateImage({
        prompt: 'A beautiful sunset',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.imageUrl).toBe('https://replicate.delivery/output.png')
        expect(result.provider).toBe('replicate')
        expect(result.providerJobId).toBe('pred_123')
      }
    })

    it('should handle prediction failure', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      // Mock failed prediction
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_456',
              status: 'starting',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_456',
              status: 'failed',
              error: 'Content policy violation',
            }),
        })

      const provider = new ReplicateProvider()
      const result = await provider.generateImage({
        prompt: 'Invalid content',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Content policy')
      }
    })

    it('should handle API errors gracefully', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: 'Invalid API token',
          }),
      })

      const provider = new ReplicateProvider()
      const result = await provider.generateImage({
        prompt: 'A test image',
        style: 'cartoon',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
    })

    it('should apply style-specific parameters', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_789',
              status: 'starting',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_789',
              status: 'succeeded',
              output: ['https://replicate.delivery/output.png'],
            }),
        })

      const provider = new ReplicateProvider()
      await provider.generateImage({
        prompt: 'A cat',
        style: 'cartoon',
        width: 1024,
        height: 1024,
      })

      // Check that the API was called with enhanced prompt
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)

      expect(body.input.prompt).toContain('Cartoon')
    })

    it('should respect negative prompt parameter', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_neg',
              status: 'starting',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pred_neg',
              status: 'succeeded',
              output: ['https://replicate.delivery/output.png'],
            }),
        })

      const provider = new ReplicateProvider()
      await provider.generateImage({
        prompt: 'A dog',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
        negativePrompt: 'blurry, low quality',
      })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)

      expect(body.input.negative_prompt).toContain('blurry')
    })

    it('should handle network errors', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const provider = new ReplicateProvider()
      const result = await provider.generateImage({
        prompt: 'A test',
        style: 'minimalist',
        width: 512,
        height: 512,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Network')
      }
    })

    it('should timeout after maximum wait time', async () => {
      vi.useFakeTimers()

      const { ReplicateProvider } = await import('../replicate.server')

      // Mock prediction that stays in processing state
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pred_timeout',
            status: 'processing',
          }),
      })

      const provider = new ReplicateProvider()
      const resultPromise = provider.generateImage({
        prompt: 'A slow image',
        style: 'oil_painting',
        width: 1024,
        height: 1024,
      })

      // Advance time to trigger timeout
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000) // 5 minutes

      const result = await resultPromise

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('timeout')
      }

      vi.useRealTimers()
    })
  })

  describe('getJobStatus', () => {
    it('should return current status of a prediction', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pred_status',
            status: 'processing',
            logs: 'Processing 50%',
          }),
      })

      const provider = new ReplicateProvider()
      const status = await provider.getJobStatus('pred_status')

      expect(status.status).toBe('processing')
    })

    it('should return completed result when done', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pred_done',
            status: 'succeeded',
            output: ['https://replicate.delivery/final.png'],
          }),
      })

      const provider = new ReplicateProvider()
      const status = await provider.getJobStatus('pred_done')

      expect(status.status).toBe('completed')
      expect(status.result?.success).toBe(true)
    })

    it('should return failed status with error', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pred_fail',
            status: 'failed',
            error: 'Generation failed',
          }),
      })

      const provider = new ReplicateProvider()
      const status = await provider.getJobStatus('pred_fail')

      expect(status.status).toBe('failed')
      expect(status.result?.success).toBe(false)
    })
  })

  describe('getEstimatedTime', () => {
    it('should return estimated generation time', async () => {
      const { ReplicateProvider } = await import('../replicate.server')

      const provider = new ReplicateProvider()
      const time = provider.getEstimatedTime()

      expect(time).toBeGreaterThan(0)
      expect(time).toBeLessThanOrEqual(120) // Max 2 minutes
    })
  })
})
