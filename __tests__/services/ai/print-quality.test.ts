/**
 * Print Quality Generation Tests
 *
 * Tests for generating high-resolution print-quality versions after payment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PRINT_RESOLUTION } from '~/services/ai/provider.interface'

// Mock dependencies - must be defined before vi.mock calls
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    asset: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    generationJob: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('~/services/ai', async () => {
  const actual = await vi.importActual('~/services/ai')
  return {
    ...actual,
    getPrimaryProvider: vi.fn(() => ({
      name: 'replicate',
      generateImage: vi.fn(),
      getEstimatedTime: () => 45,
    })),
    getFallbackProvider: vi.fn(() => null),
  }
})

vi.mock('~/services/storage.server', () => ({
  uploadFile: vi.fn(),
  generateStorageKey: vi.fn(() => 'storage-key'),
  calculateRetentionExpiry: vi.fn(() => new Date('2027-01-01')),
}))

// Mock fetch for image download
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(10000),
})

// Import after mocks are set up
const { generatePrintQuality, batchGeneratePrintQuality } = await import(
  '~/services/ai/print-quality.server'
)
const { prisma } = await import('~/services/prisma.server')
const { uploadFile } = await import('~/services/storage.server')
const { getPrimaryProvider } = await import('~/services/ai')

describe('Print Quality Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(prisma.generationJob.create).mockResolvedValue({
      id: 'job-123',
    } as any)

    vi.mocked(prisma.generationJob.update).mockResolvedValue({} as any)

    vi.mocked(uploadFile).mockResolvedValue({
      key: 'print-key',
      url: 'https://example.com/print.png',
      size: 10000,
    })

    const mockProvider = vi.mocked(getPrimaryProvider)()
    if (mockProvider) {
      vi.mocked(mockProvider.generateImage).mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated-print.png',
        width: PRINT_RESOLUTION,
        height: PRINT_RESOLUTION,
        provider: 'replicate',
        providerJobId: 'provider-print-123',
      })
    }
  })

  describe('generatePrintQuality', () => {
    it('should generate print-quality version of preview asset', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        width: 1024,
        height: 1024,
        storageUrl: 'https://example.com/preview.png',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: false,
          resolution: 1024,
        },
      } as any)

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-print',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
      } as any)

      const result = await generatePrintQuality('asset-preview', 'user-123')

      expect(result.success).toBe(true)
      expect(result.asset).toBeDefined()
      expect(result.asset?.width).toBe(2048)
      expect(result.asset?.height).toBe(2048)
    })

    it('should use print resolution (2048x2048) for generation', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: false,
        },
      })

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-print',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
      })

      await generatePrintQuality('asset-preview', 'user-123')

      expect(vi.mocked(getPrimaryProvider()!.generateImage)).toHaveBeenCalledWith(
        expect.objectContaining({
          width: PRINT_RESOLUTION,
          height: PRINT_RESOLUTION,
        })
      )
    })

    it('should preserve original prompt and style', async () => {
      const originalPrompt = 'a majestic mountain landscape'
      const originalStyle = 'watercolour'

      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        metadata: {
          prompt: originalPrompt,
          style: originalStyle,
          isPrintQuality: false,
        },
      })

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-print',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
      })

      await generatePrintQuality('asset-preview', 'user-123')

      expect(vi.mocked(getPrimaryProvider()!.generateImage)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: originalPrompt,
          style: originalStyle,
        })
      )
    })

    it('should mark generated asset as print quality', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: false,
        },
      })

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-print',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
      })

      await generatePrintQuality('asset-preview', 'user-123')

      expect(vi.mocked(prisma.asset.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              isPrintQuality: true,
              resolution: PRINT_RESOLUTION,
            }),
          }),
        })
      )
    })

    it('should set status to PERMANENT for print quality assets', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: false,
        },
      })

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-print',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
      })

      await generatePrintQuality('asset-preview', 'user-123')

      expect(vi.mocked(prisma.asset.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PERMANENT',
            storageTier: 'HOT',
          }),
        })
      )
    })

    it('should return existing asset if already print quality', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-print',
        userId: 'user-123',
        sessionId: 'session-123',
        storageUrl: 'https://example.com/print.png',
        width: 2048,
        height: 2048,
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: true,
          resolution: 2048,
        },
      })

      const result = await generatePrintQuality('asset-print', 'user-123')

      expect(result.success).toBe(true)
      expect(vi.mocked(getPrimaryProvider()!.generateImage)).not.toHaveBeenCalled()
      expect(result.asset?.id).toBe('asset-print')
    })

    it('should reject if asset belongs to different user', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-456',
        sessionId: 'session-123',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
        },
      })

      const result = await generatePrintQuality('asset-preview', 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorised')
      expect(vi.mocked(getPrimaryProvider()!.generateImage)).not.toHaveBeenCalled()
    })

    it('should handle generation failures gracefully', async () => {
      vi.mocked(prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-preview',
        userId: 'user-123',
        sessionId: 'session-123',
        metadata: {
          prompt: 'a beautiful sunset',
          style: 'photorealistic',
          isPrintQuality: false,
        },
      })

      vi.mocked(getPrimaryProvider()!.generateImage).mockResolvedValue({
        success: false,
        error: 'Generation failed',
        provider: 'replicate',
      })

      const result = await generatePrintQuality('asset-preview', 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(vi.mocked(prisma.asset.create)).not.toHaveBeenCalled()
    })
  })

  describe('batchGeneratePrintQuality', () => {
    it('should generate print quality for multiple assets', async () => {
      vi.mocked(prisma.asset.findUnique)
        .mockResolvedValueOnce({
          id: 'asset-1',
          userId: 'user-123',
          sessionId: 'session-123',
          metadata: {
            prompt: 'sunset',
            style: 'photorealistic',
            isPrintQuality: false,
          },
        })
        .mockResolvedValueOnce({
          id: 'asset-2',
          userId: 'user-123',
          sessionId: 'session-123',
          metadata: {
            prompt: 'mountain',
            style: 'watercolour',
            isPrintQuality: false,
          },
        })

      vi.mocked(prisma.asset.create)
        .mockResolvedValueOnce({
          id: 'print-1',
          storageUrl: 'https://example.com/print-1.png',
          width: 2048,
          height: 2048,
        })
        .mockResolvedValueOnce({
          id: 'print-2',
          storageUrl: 'https://example.com/print-2.png',
          width: 2048,
          height: 2048,
        })

      const results = await batchGeneratePrintQuality(['asset-1', 'asset-2'], 'user-123')

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })

    it('should handle partial failures in batch', async () => {
      vi.mocked(prisma.asset.findUnique)
        .mockResolvedValueOnce({
          id: 'asset-1',
          userId: 'user-123',
          sessionId: 'session-123',
          metadata: {
            prompt: 'sunset',
            style: 'photorealistic',
            isPrintQuality: false,
          },
        })
        .mockResolvedValueOnce({
          id: 'asset-2',
          userId: 'user-456', // Different user - should fail
          sessionId: 'session-123',
          metadata: {
            prompt: 'mountain',
            style: 'watercolour',
            isPrintQuality: false,
          },
        })

      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'print-1',
        storageUrl: 'https://example.com/print-1.png',
        width: 2048,
        height: 2048,
      })

      const results = await batchGeneratePrintQuality(['asset-1', 'asset-2'], 'user-123')

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })
})
