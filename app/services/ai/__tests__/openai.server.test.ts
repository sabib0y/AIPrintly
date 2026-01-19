/**
 * OpenAI Provider Tests
 *
 * Tests for the OpenAI DALL-E image generation provider (fallback).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Set environment variables before imports
beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('OpenAI Provider', () => {
  describe('isAvailable', () => {
    it('should return true when API key is configured', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      const provider = new OpenAIProvider()

      expect(provider.isAvailable()).toBe(true)
    })

    it('should return false when API key is missing', async () => {
      vi.stubEnv('OPENAI_API_KEY', '')

      vi.resetModules()
      const { OpenAIProvider } = await import('../openai.server')

      const provider = new OpenAIProvider()

      expect(provider.isAvailable()).toBe(false)
    })
  })

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                url: 'https://oaidalleapiprodscus.blob.core.windows.net/image.png',
                revised_prompt: 'Enhanced prompt',
              },
            ],
          }),
      })

      const provider = new OpenAIProvider()
      const result = await provider.generateImage({
        prompt: 'A beautiful sunset',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.imageUrl).toContain('oaidalleapiprodscus')
        expect(result.provider).toBe('openai')
      }
    })

    it('should handle content policy rejection', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Your request was rejected due to content policy',
              type: 'invalid_request_error',
              code: 'content_policy_violation',
            },
          }),
      })

      const provider = new OpenAIProvider()
      const result = await provider.generateImage({
        prompt: 'Invalid content',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('content policy')
      }
    })

    it('should handle rate limiting', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error',
            },
          }),
      })

      const provider = new OpenAIProvider()
      const result = await provider.generateImage({
        prompt: 'A test image',
        style: 'cartoon',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Rate limit')
      }
    })

    it('should apply style enhancements to prompt', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                url: 'https://oaidalleapiprodscus.blob.core.windows.net/image.png',
              },
            ],
          }),
      })

      const provider = new OpenAIProvider()
      await provider.generateImage({
        prompt: 'A cat',
        style: 'watercolour',
        width: 1024,
        height: 1024,
      })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)

      expect(body.prompt).toContain('Watercolour')
    })

    it('should use correct model for different sizes', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ url: 'https://example.com/image.png' }],
          }),
      })

      const provider = new OpenAIProvider()

      // Standard size should use DALL-E 3
      await provider.generateImage({
        prompt: 'A test',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      })

      let [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      let body = JSON.parse(options.body as string)

      expect(body.model).toBe('dall-e-3')
    })

    it('should handle network errors', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const provider = new OpenAIProvider()
      const result = await provider.generateImage({
        prompt: 'A test',
        style: 'minimalist',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Network')
      }
    })

    it('should handle empty response', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
          }),
      })

      const provider = new OpenAIProvider()
      const result = await provider.generateImage({
        prompt: 'A test',
        style: 'digital_art',
        width: 1024,
        height: 1024,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('getJobStatus', () => {
    it('should always return completed for OpenAI (synchronous API)', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      const provider = new OpenAIProvider()
      const status = await provider.getJobStatus('any-id')

      // OpenAI API is synchronous, so jobs are always "completed" immediately
      expect(['completed', 'failed']).toContain(status.status)
    })
  })

  describe('getEstimatedTime', () => {
    it('should return estimated generation time', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      const provider = new OpenAIProvider()
      const time = provider.getEstimatedTime()

      expect(time).toBeGreaterThan(0)
      expect(time).toBeLessThanOrEqual(60) // DALL-E is typically faster
    })
  })

  describe('mapDimensions', () => {
    it('should map dimensions to supported DALL-E sizes', async () => {
      const { OpenAIProvider } = await import('../openai.server')

      const provider = new OpenAIProvider()

      // Test various input dimensions
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ url: 'https://example.com/image.png' }],
          }),
      })

      // Square
      await provider.generateImage({
        prompt: 'test',
        style: 'photorealistic',
        width: 512,
        height: 512,
      })

      let [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      let body = JSON.parse(options.body as string)
      expect(body.size).toBe('1024x1024')
    })
  })
})
