/**
 * OpenAI Provider Resolution Tests
 *
 * Tests for resolution parameter handling in OpenAI provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from '~/services/ai/openai.server'
import { PREVIEW_RESOLUTION, PRINT_RESOLUTION } from '~/services/ai/provider.interface'

// Mock fetch
global.fetch = vi.fn()

describe('OpenAIProvider - Resolution Support', () => {
  let provider: OpenAIProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new OpenAIProvider()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  describe('Preview Resolution Mapping', () => {
    it('should map 1024x1024 to DALL-E 1024x1024 size', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PREVIEW_RESOLUTION,
        height: PREVIEW_RESOLUTION,
      })

      const call = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(call[1].body)

      expect(requestBody.size).toBe('1024x1024')
    })

    it('should return correct dimensions for 1024x1024', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      const result = await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PREVIEW_RESOLUTION,
        height: PREVIEW_RESOLUTION,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.width).toBe(1024)
        expect(result.height).toBe(1024)
      }
    })
  })

  describe('Print Resolution Mapping', () => {
    it('should map 2048x2048 to closest DALL-E size (1024x1024)', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PRINT_RESOLUTION,
        height: PRINT_RESOLUTION,
      })

      const call = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(call[1].body)

      // DALL-E doesn't support 2048x2048, should map to 1024x1024
      expect(requestBody.size).toBe('1024x1024')
    })

    it('should include resolution metadata in result', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      const result = await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PRINT_RESOLUTION,
        height: PRINT_RESOLUTION,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.metadata).toBeDefined()
        expect(result.metadata?.size).toBeDefined()
      }
    })
  })

  describe('Aspect Ratio Mapping', () => {
    it('should map landscape ratios to 1792x1024', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: 1792,
        height: 1024,
      })

      const call = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(call[1].body)

      expect(requestBody.size).toBe('1792x1024')
    })

    it('should map portrait ratios to 1024x1792', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              url: 'https://example.com/image.png',
            },
          ],
        }),
      })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: 1024,
        height: 1792,
      })

      const call = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(call[1].body)

      expect(requestBody.size).toBe('1024x1792')
    })
  })
})
