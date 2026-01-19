/**
 * Rate Limiter Service Tests
 *
 * Tests for per-session and per-IP rate limiting, concurrent job limiting,
 * and abuse detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the cache/store for rate limiting
const mockCache = new Map<string, { count: number; resetAt: number }>()

vi.mock('~/services/prisma.server', () => ({
  prisma: {
    generationJob: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

describe('Rate Limiter Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCache.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('checkUploadRateLimit', () => {
    it('should allow upload when under rate limit', async () => {
      const { checkUploadRateLimit } = await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      const result = await checkUploadRateLimit('session-1', request)

      expect(result.allowed).toBe(true)
    })

    it('should block upload when rate limit exceeded', async () => {
      const { checkUploadRateLimit, UPLOAD_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Exhaust the rate limit
      for (let i = 0; i < UPLOAD_RATE_LIMIT.maxRequests; i++) {
        await checkUploadRateLimit('session-1', request)
      }

      const result = await checkUploadRateLimit('session-1', request)

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset rate limit after window expires', async () => {
      const { checkUploadRateLimit, UPLOAD_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Exhaust the rate limit
      for (let i = 0; i < UPLOAD_RATE_LIMIT.maxRequests; i++) {
        await checkUploadRateLimit('session-1', request)
      }

      // Advance time past the window
      vi.advanceTimersByTime(UPLOAD_RATE_LIMIT.windowMs + 1000)

      const result = await checkUploadRateLimit('session-1', request)

      expect(result.allowed).toBe(true)
    })

    it('should track rate limits per session independently', async () => {
      const { checkUploadRateLimit, UPLOAD_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Exhaust session-1's rate limit
      for (let i = 0; i < UPLOAD_RATE_LIMIT.maxRequests; i++) {
        await checkUploadRateLimit('session-1', request)
      }

      // session-2 should still be allowed
      const result = await checkUploadRateLimit('session-2', request)

      expect(result.allowed).toBe(true)
    })
  })

  describe('checkGenerationRateLimit', () => {
    it('should allow generation when under rate limit', async () => {
      const { checkGenerationRateLimit } = await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      const result = await checkGenerationRateLimit('session-1', request)

      expect(result.allowed).toBe(true)
    })

    it('should have stricter limits than upload', async () => {
      const { UPLOAD_RATE_LIMIT, GENERATION_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      expect(GENERATION_RATE_LIMIT.maxRequests).toBeLessThan(
        UPLOAD_RATE_LIMIT.maxRequests
      )
    })

    it('should block generation when rate limit exceeded', async () => {
      const { checkGenerationRateLimit, GENERATION_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Exhaust the rate limit
      for (let i = 0; i < GENERATION_RATE_LIMIT.maxRequests; i++) {
        await checkGenerationRateLimit('session-1', request)
      }

      const result = await checkGenerationRateLimit('session-1', request)

      expect(result.allowed).toBe(false)
    })
  })

  describe('checkConcurrentJobLimit', () => {
    it('should allow job when under concurrent limit', async () => {
      const { checkConcurrentJobLimit } = await import('../rate-limiter.server')
      const { prisma } = await import('~/services/prisma.server')

      vi.mocked(prisma.generationJob.count).mockResolvedValue(0)

      const result = await checkConcurrentJobLimit('session-1')

      expect(result.allowed).toBe(true)
    })

    it('should block job when concurrent limit exceeded', async () => {
      const { checkConcurrentJobLimit, MAX_CONCURRENT_JOBS } = await import(
        '../rate-limiter.server'
      )
      const { prisma } = await import('~/services/prisma.server')

      vi.mocked(prisma.generationJob.count).mockResolvedValue(MAX_CONCURRENT_JOBS)

      const result = await checkConcurrentJobLimit('session-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('concurrent')
    })
  })

  describe('checkIpRateLimit', () => {
    it('should track rate limits by IP address', async () => {
      const { checkIpRateLimit, IP_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      // Exhaust the IP rate limit
      for (let i = 0; i < IP_RATE_LIMIT.maxRequests; i++) {
        await checkIpRateLimit('192.168.1.1')
      }

      const result = await checkIpRateLimit('192.168.1.1')

      expect(result.allowed).toBe(false)
    })

    it('should allow different IPs independently', async () => {
      const { checkIpRateLimit, IP_RATE_LIMIT } = await import(
        '../rate-limiter.server'
      )

      // Exhaust one IP's rate limit
      for (let i = 0; i < IP_RATE_LIMIT.maxRequests; i++) {
        await checkIpRateLimit('192.168.1.1')
      }

      // Different IP should still be allowed
      const result = await checkIpRateLimit('192.168.1.2')

      expect(result.allowed).toBe(true)
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from X-Forwarded-For header', async () => {
      const { getClientIp } = await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '203.0.113.1, 198.51.100.1' },
      })

      const ip = getClientIp(request)

      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from X-Real-IP header', async () => {
      const { getClientIp } = await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Real-IP': '203.0.113.2' },
      })

      const ip = getClientIp(request)

      expect(ip).toBe('203.0.113.2')
    })

    it('should fallback to unknown when no IP headers present', async () => {
      const { getClientIp } = await import('../rate-limiter.server')

      const request = new Request('http://localhost')

      const ip = getClientIp(request)

      expect(ip).toBe('unknown')
    })
  })

  describe('detectAbuse', () => {
    it('should flag rapid-fire requests as abuse', async () => {
      const { detectAbuse, ABUSE_THRESHOLD } = await import(
        '../rate-limiter.server'
      )

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Simulate rapid-fire requests
      for (let i = 0; i < ABUSE_THRESHOLD.requestsPerSecond * 2; i++) {
        await detectAbuse('session-1', request)
      }

      const result = await detectAbuse('session-1', request)

      expect(result.isAbusive).toBe(true)
    })

    it('should not flag normal request patterns as abuse', async () => {
      const { detectAbuse } = await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      const result = await detectAbuse('session-1', request)

      expect(result.isAbusive).toBe(false)
    })

    it('should block abusive sessions', async () => {
      const { detectAbuse, checkUploadRateLimit, ABUSE_THRESHOLD } =
        await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Trigger abuse detection
      for (let i = 0; i < ABUSE_THRESHOLD.requestsPerSecond * 3; i++) {
        await detectAbuse('abusive-session', request)
      }

      // Should be blocked even though rate limit not technically exceeded
      const result = await checkUploadRateLimit('abusive-session', request)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('abuse')
    })
  })

  describe('cleanupExpiredEntries', () => {
    it('should remove expired rate limit entries', async () => {
      const { checkUploadRateLimit, cleanupExpiredEntries, UPLOAD_RATE_LIMIT } =
        await import('../rate-limiter.server')

      const request = new Request('http://localhost', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      })

      // Create some entries
      await checkUploadRateLimit('session-1', request)
      await checkUploadRateLimit('session-2', request)

      // Advance time past expiry
      vi.advanceTimersByTime(UPLOAD_RATE_LIMIT.windowMs * 2)

      // Cleanup
      const cleaned = await cleanupExpiredEntries()

      expect(cleaned).toBeGreaterThan(0)
    })
  })
})
