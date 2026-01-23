/**
 * Image Generation API - Resolution Tests
 *
 * Tests for default preview resolution and print-quality generation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { action } from '~/routes/api.generate.image'
import { PREVIEW_RESOLUTION } from '~/services/ai/provider.interface'

// Mock all dependencies
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    generationJob: {
      create: vi.fn().mockResolvedValue({ id: 'job-123' }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    asset: {
      create: vi.fn().mockResolvedValue({
        id: 'asset-123',
        storageUrl: 'https://example.com/image.png',
        width: 1024,
        height: 1024,
      }),
    },
  },
}))

vi.mock('~/services/session.server', () => ({
  getSessionId: vi.fn().mockResolvedValue('session-123'),
  getUserIdFromSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('~/services/rate-limiter.server', () => ({
  checkGenerationRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  checkConcurrentJobLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

vi.mock('~/services/credits.server', () => ({
  checkCredits: vi.fn().mockResolvedValue({ hasCredits: true }),
  deductCredit: vi.fn().mockResolvedValue({ success: true, newBalance: 5 }),
  refundCredit: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('~/services/storage.server', async () => {
  const actual = await vi.importActual('~/services/storage.server')
  return {
    ...actual,
    uploadFile: vi.fn().mockResolvedValue({
      key: 'test-key',
      url: 'https://example.com/stored.png',
      size: 12345,
    }),
    generateStorageKey: vi.fn().mockReturnValue('storage-key'),
    calculateRetentionExpiry: vi.fn().mockReturnValue(new Date()),
    getProxyUrl: vi.fn((id: string) => `https://proxy.example.com/${id}`),
  }
})

// Mock AI provider
const mockGenerateImage = vi.fn()
vi.mock('~/services/ai', async () => {
  const actual = await vi.importActual('~/services/ai')
  return {
    ...actual,
    getPrimaryProvider: vi.fn(() => ({
      name: 'replicate',
      generateImage: mockGenerateImage,
      getEstimatedTime: () => 45,
    })),
    getFallbackProvider: vi.fn(() => null),
    validatePrompt: vi.fn((prompt) => ({
      isValid: true,
      errors: [],
      sanitised: prompt,
    })),
  }
})

vi.mock('~/services/watermark.server', () => ({
  addWatermark: vi.fn((buffer: Buffer) => Promise.resolve(buffer)),
  createWatermarkedMetadata: vi.fn((metadata: any) => metadata),
}))

// Mock fetch for image download
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(1000),
})

describe('Image Generation API - Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateImage.mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/generated.png',
      width: 1024,
      height: 1024,
      provider: 'replicate',
      providerJobId: 'provider-123',
    })
  })

  describe('Default Preview Resolution', () => {
    it('should use preview resolution (1024x1024) when no dimensions specified', async () => {
      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} } as any)

      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: PREVIEW_RESOLUTION,
          height: PREVIEW_RESOLUTION,
        })
      )
    })

    it('should use preview resolution when explicitly requested', async () => {
      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} } as any)

      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1024,
          height: 1024,
        })
      )
    })

    it('should store resolution metadata in asset', async () => {
      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const { prisma } = await import('~/services/prisma.server')

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            width: 1024,
            height: 1024,
            metadata: expect.objectContaining({
              resolution: '1024',
              isPrintQuality: 'false',
            }),
          }),
        })
      )
    })
  })

  describe('Print Resolution Support', () => {
    it('should allow print resolution (2048x2048) when explicitly requested', async () => {
      mockGenerateImage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated.png',
        width: 2048,
        height: 2048,
        provider: 'replicate',
        providerJobId: 'provider-123',
      })

      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '2048')
      formData.append('height', '2048')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} } as any)

      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 2048,
          height: 2048,
        })
      )
    })

    it('should mark print-quality assets with isPrintQuality flag', async () => {
      mockGenerateImage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated.png',
        width: 2048,
        height: 2048,
        provider: 'replicate',
        providerJobId: 'provider-123',
      })

      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '2048')
      formData.append('height', '2048')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const { prisma } = await import('~/services/prisma.server')

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            width: 2048,
            height: 2048,
            metadata: expect.objectContaining({
              resolution: '2048',
              isPrintQuality: 'true',
            }),
          }),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should reject invalid dimensions', async () => {
      const formData = new FormData()
      formData.append('prompt', 'a beautiful sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '999')
      formData.append('height', '999')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errorCode).toBe('INVALID_DIMENSIONS')
    })
  })
})
