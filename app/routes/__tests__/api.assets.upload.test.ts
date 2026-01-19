/**
 * Asset Upload API Tests
 *
 * Tests for the POST /api/assets/upload endpoint including file validation,
 * processing, storage, and database operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies
vi.mock('~/services/session.server', () => ({
  getSession: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === 'id') return 'test-session-id'
      if (key === 'userId') return null
      return null
    }),
  }),
  getSessionId: vi.fn().mockResolvedValue('test-session-id'),
  getUserIdFromSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('~/services/prisma.server', () => ({
  prisma: {
    asset: {
      create: vi.fn().mockResolvedValue({
        id: 'test-asset-id',
        sessionId: 'test-session-id',
        userId: null,
        source: 'UPLOAD',
        assetType: 'IMAGE',
        storageKey: 'uploads/test-file.jpg',
        storageUrl: 'https://cdn.example.com/uploads/test-file.jpg',
        mimeType: 'image/jpeg',
        width: 2000,
        height: 1500,
        fileSize: 500000,
        originalFilename: 'test.jpg',
        status: 'TEMPORARY',
        storageTier: 'HOT',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        retentionDays: 1,
        createdAt: new Date(),
        metadata: {},
      }),
    },
  },
}))

vi.mock('~/services/storage.server', () => ({
  uploadFile: vi.fn().mockResolvedValue({
    key: 'uploads/test-file.jpg',
    url: 'https://cdn.example.com/uploads/test-file.jpg',
    size: 500000,
  }),
  generateStorageKey: vi.fn().mockReturnValue('uploads/test-key.jpg'),
  calculateRetentionExpiry: vi.fn().mockReturnValue(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  ),
}))

vi.mock('~/services/image-processing.server', () => ({
  processUploadedImage: vi.fn().mockResolvedValue({
    buffer: Buffer.from('processed image'),
    metadata: {
      width: 2000,
      height: 1500,
      format: 'jpeg',
      dpi: 300,
      sizeBytes: 500000,
    },
    mimeType: 'image/jpeg',
  }),
  validateImageQuality: vi.fn().mockResolvedValue({
    isValid: true,
    warnings: [],
    errors: [],
    metadata: {
      width: 2000,
      height: 1500,
      format: 'jpeg',
      dpi: 300,
      sizeBytes: 500000,
    },
  }),
  isSupportedMimeType: vi.fn().mockReturnValue(true),
  SUPPORTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
}))

vi.mock('~/services/rate-limiter.server', () => ({
  checkUploadRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

describe('Asset Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/assets/upload', () => {
    it('should successfully upload a valid image', async () => {
      const { action } = await import('../../api.assets.upload')
      const { prisma } = await import('~/services/prisma.server')

      // Create a mock FormData with a file
      const formData = new FormData()
      const file = new File(['fake image content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.asset).toBeDefined()
      expect(data.asset.id).toBe('test-asset-id')
    })

    it('should reject requests without a file', async () => {
      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('No file')
    })

    it('should reject unsupported file types', async () => {
      const { isSupportedMimeType } = await import(
        '~/services/image-processing.server'
      )
      vi.mocked(isSupportedMimeType).mockReturnValue(false)

      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['fake pdf content'], 'test.pdf', {
        type: 'application/pdf',
      })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unsupported')
    })

    it('should reject files that fail quality validation', async () => {
      const { validateImageQuality } = await import(
        '~/services/image-processing.server'
      )
      vi.mocked(validateImageQuality).mockResolvedValue({
        isValid: false,
        warnings: [],
        errors: ['Image is too small'],
        metadata: {
          width: 100,
          height: 100,
          format: 'jpeg',
          dpi: 72,
          sizeBytes: 5000,
        },
      })

      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['tiny image'], 'small.jpg', {
        type: 'image/jpeg',
      })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Image is too small')
    })

    it('should include quality warnings in successful response', async () => {
      const { validateImageQuality } = await import(
        '~/services/image-processing.server'
      )
      vi.mocked(validateImageQuality).mockResolvedValue({
        isValid: true,
        warnings: ['Image has low DPI'],
        errors: [],
        metadata: {
          width: 2000,
          height: 1500,
          format: 'jpeg',
          dpi: 72,
          sizeBytes: 500000,
        },
      })

      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['low dpi image'], 'lowdpi.jpg', {
        type: 'image/jpeg',
      })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.warnings).toContain('Image has low DPI')
    })

    it('should enforce rate limits', async () => {
      const { checkUploadRateLimit } = await import(
        '~/services/rate-limiter.server'
      )
      vi.mocked(checkUploadRateLimit).mockResolvedValue({
        allowed: false,
        retryAfter: 60,
        reason: 'Too many uploads',
      })

      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many')
    })

    it('should set correct retention for guest users', async () => {
      const { calculateRetentionExpiry } = await import(
        '~/services/storage.server'
      )
      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} })

      expect(calculateRetentionExpiry).toHaveBeenCalledWith(false, 'upload')
    })

    it('should set correct retention for authenticated users', async () => {
      const { getUserIdFromSession } = await import('~/services/session.server')
      vi.mocked(getUserIdFromSession).mockResolvedValue('user-123')

      const { calculateRetentionExpiry } = await import(
        '~/services/storage.server'
      )
      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} })

      expect(calculateRetentionExpiry).toHaveBeenCalledWith(true, 'upload')
    })

    it('should handle storage errors gracefully', async () => {
      const { uploadFile } = await import('~/services/storage.server')
      vi.mocked(uploadFile).mockRejectedValue(new Error('Storage unavailable'))

      const { action } = await import('../../api.assets.upload')

      const formData = new FormData()
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new Request('http://localhost/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('upload')
    })
  })
})
