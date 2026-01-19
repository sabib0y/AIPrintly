/**
 * Image Generation API Tests
 *
 * Tests for the POST /api/generate/image endpoint.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies
vi.mock('~/services/session.server', () => ({
  getSessionId: vi.fn().mockResolvedValue('test-session-id'),
  getUserIdFromSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('~/services/prisma.server', () => ({
  prisma: {
    generationJob: {
      create: vi.fn().mockResolvedValue({
        id: 'job-123',
        sessionId: 'test-session-id',
        type: 'IMAGE',
        status: 'PENDING',
        provider: 'replicate',
        inputParams: {},
        createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'job-123',
        status: 'COMPLETED',
      }),
    },
    asset: {
      create: vi.fn().mockResolvedValue({
        id: 'asset-123',
        storageUrl: 'https://cdn.example.com/generated.jpg',
      }),
    },
  },
}))

vi.mock('~/services/credits.server', () => ({
  checkCredits: vi.fn().mockResolvedValue({ hasCredits: true, balance: 5 }),
  deductCredit: vi.fn().mockResolvedValue({ success: true, newBalance: 4 }),
  refundCredit: vi.fn().mockResolvedValue({ success: true, newBalance: 5 }),
}))

vi.mock('~/services/rate-limiter.server', () => ({
  checkGenerationRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  checkConcurrentJobLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

vi.mock('~/services/ai', () => ({
  getPrimaryProvider: vi.fn().mockReturnValue({
    name: 'replicate',
    isAvailable: () => true,
    generateImage: vi.fn().mockResolvedValue({
      success: true,
      imageUrl: 'https://replicate.delivery/output.png',
      width: 1024,
      height: 1024,
      provider: 'replicate',
      providerJobId: 'pred_123',
    }),
    getEstimatedTime: () => 45,
  }),
  getFallbackProvider: vi.fn().mockReturnValue(null),
  validatePrompt: vi.fn().mockReturnValue({
    isValid: true,
    errors: [],
    sanitised: 'A beautiful sunset',
  }),
  STYLE_PRESETS: {
    photorealistic: { name: 'Photorealistic' },
    cartoon: { name: 'Cartoon' },
  },
}))

vi.mock('~/services/storage.server', () => ({
  uploadFile: vi.fn().mockResolvedValue({
    key: 'generated/test.jpg',
    url: 'https://cdn.example.com/generated.jpg',
    size: 500000,
  }),
  generateStorageKey: vi.fn().mockReturnValue('generated/test.jpg'),
  calculateRetentionExpiry: vi.fn().mockReturnValue(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ),
}))

describe('Image Generation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/generate/image', () => {
    it('should start a generation job successfully', async () => {
      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A beautiful sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.jobId).toBeDefined()
    })

    it('should reject empty prompts', async () => {
      const { validatePrompt } = await import('~/services/ai')
      vi.mocked(validatePrompt).mockReturnValue({
        isValid: false,
        errors: ['Prompt cannot be empty'],
      })

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', '')
      formData.append('style', 'cartoon')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('empty')
    })

    it('should reject invalid styles', async () => {
      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A test')
      formData.append('style', 'invalid_style')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('style')
    })

    it('should block when out of credits', async () => {
      const { checkCredits } = await import('~/services/credits.server')
      vi.mocked(checkCredits).mockResolvedValue({
        hasCredits: false,
        balance: 0,
      })

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A sunset')
      formData.append('style', 'photorealistic')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toContain('credits')
    })

    it('should enforce rate limits', async () => {
      const { checkGenerationRateLimit } = await import(
        '~/services/rate-limiter.server'
      )
      vi.mocked(checkGenerationRateLimit).mockResolvedValue({
        allowed: false,
        retryAfter: 60,
        reason: 'Rate limit exceeded',
      })

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A test')
      formData.append('style', 'cartoon')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(429)
    })

    it('should enforce concurrent job limits', async () => {
      const { checkConcurrentJobLimit } = await import(
        '~/services/rate-limiter.server'
      )
      vi.mocked(checkConcurrentJobLimit).mockResolvedValue({
        allowed: false,
        reason: 'Maximum concurrent jobs reached',
      })

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A test')
      formData.append('style', 'cartoon')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('concurrent')
    })

    it('should refund credit on generation failure', async () => {
      const { getPrimaryProvider } = await import('~/services/ai')
      vi.mocked(getPrimaryProvider).mockReturnValue({
        name: 'replicate',
        isAvailable: () => true,
        generateImage: vi.fn().mockResolvedValue({
          success: false,
          error: 'Generation failed',
          provider: 'replicate',
        }),
        getEstimatedTime: () => 45,
      } as any)

      const { refundCredit } = await import('~/services/credits.server')

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A test')
      formData.append('style', 'photorealistic')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} })

      expect(refundCredit).toHaveBeenCalled()
    })

    it('should try fallback provider on primary failure', async () => {
      const { getPrimaryProvider, getFallbackProvider } = await import(
        '~/services/ai'
      )

      const mockFallback = {
        name: 'openai',
        isAvailable: () => true,
        generateImage: vi.fn().mockResolvedValue({
          success: true,
          imageUrl: 'https://openai.com/image.png',
          width: 1024,
          height: 1024,
          provider: 'openai',
        }),
        getEstimatedTime: () => 20,
      }

      vi.mocked(getPrimaryProvider).mockReturnValue({
        name: 'replicate',
        isAvailable: () => true,
        generateImage: vi.fn().mockResolvedValue({
          success: false,
          error: 'Provider error',
          provider: 'replicate',
        }),
        getEstimatedTime: () => 45,
      } as any)

      vi.mocked(getFallbackProvider).mockReturnValue(mockFallback as any)

      const { action } = await import('../../api.generate.image')

      const formData = new FormData()
      formData.append('prompt', 'A test')
      formData.append('style', 'photorealistic')
      formData.append('width', '1024')
      formData.append('height', '1024')

      const request = new Request('http://localhost/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request, params: {}, context: {} })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockFallback.generateImage).toHaveBeenCalled()
    })
  })
})
