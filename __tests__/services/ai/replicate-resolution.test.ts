/**
 * Replicate Provider Resolution Tests
 *
 * Tests for resolution parameter handling in Replicate provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReplicateProvider } from '~/services/ai/replicate.server'
import { PREVIEW_RESOLUTION, PRINT_RESOLUTION } from '~/services/ai/provider.interface'

// Mock fetch
global.fetch = vi.fn()

describe('ReplicateProvider - Resolution Support', () => {
  let provider: ReplicateProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new ReplicateProvider()
    process.env.REPLICATE_API_TOKEN = 'test-token'
  })

  describe('Preview Resolution Generation', () => {
    it('should use preview resolution (1024x1024) when specified', async () => {
      const mockPrediction = {
        id: 'test-prediction',
        status: 'starting',
      }

      const mockCompletedPrediction = {
        id: 'test-prediction',
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrediction,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockCompletedPrediction,
        })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PREVIEW_RESOLUTION,
        height: PREVIEW_RESOLUTION,
      })

      const createCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(createCall[1].body)

      expect(requestBody.input.width).toBe(1024)
      expect(requestBody.input.height).toBe(1024)
    })

    it('should return correct dimensions in result for preview', async () => {
      const mockPrediction = {
        id: 'test-prediction',
        status: 'starting',
      }

      const mockCompletedPrediction = {
        id: 'test-prediction',
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrediction,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockCompletedPrediction,
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

  describe('Print Resolution Generation', () => {
    it('should use print resolution (2048x2048) when specified', async () => {
      const mockPrediction = {
        id: 'test-prediction',
        status: 'starting',
      }

      const mockCompletedPrediction = {
        id: 'test-prediction',
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrediction,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockCompletedPrediction,
        })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PRINT_RESOLUTION,
        height: PRINT_RESOLUTION,
      })

      const createCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(createCall[1].body)

      expect(requestBody.input.width).toBe(2048)
      expect(requestBody.input.height).toBe(2048)
    })

    it('should return correct dimensions in result for print quality', async () => {
      const mockPrediction = {
        id: 'test-prediction',
        status: 'starting',
      }

      const mockCompletedPrediction = {
        id: 'test-prediction',
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrediction,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockCompletedPrediction,
        })

      const result = await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: PRINT_RESOLUTION,
        height: PRINT_RESOLUTION,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.width).toBe(2048)
        expect(result.height).toBe(2048)
      }
    })
  })

  describe('Custom Dimensions', () => {
    it('should support custom width and height', async () => {
      const mockPrediction = {
        id: 'test-prediction',
        status: 'starting',
      }

      const mockCompletedPrediction = {
        id: 'test-prediction',
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPrediction,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockCompletedPrediction,
        })

      await provider.generateImage({
        prompt: 'a cat',
        style: 'photorealistic',
        width: 768,
        height: 1024,
      })

      const createCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(createCall[1].body)

      expect(requestBody.input.width).toBe(768)
      expect(requestBody.input.height).toBe(1024)
    })
  })
})
