/**
 * Account Delete API Route Tests
 *
 * Tests for the GDPR-compliant account deletion endpoint.
 * This is a critical, destructive operation and must be thoroughly tested.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Mock environment variables
process.env.SESSION_SECRET = 'test_session_secret'

// Mock Prisma - using inline functions to avoid hoisting issues
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    asset: {
      deleteMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    userCredits: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    authToken: {
      deleteMany: vi.fn(),
    },
    creditTransaction: {
      deleteMany: vi.fn(),
    },
    generationJob: {
      deleteMany: vi.fn(),
    },
    productConfiguration: {
      deleteMany: vi.fn(),
    },
  },
}))

// Mock session service
vi.mock('~/services/session.server', () => ({
  getSession: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    unset: vi.fn(),
  }),
  commitSession: vi.fn().mockResolvedValue('session-cookie'),
  destroySession: vi.fn().mockResolvedValue('destroyed-session-cookie'),
  getUserIdFromSession: vi.fn(),
}))

// Mock rate limiter
vi.mock('~/services/rate-limiter.server', () => ({
  checkAuthRateLimit: vi.fn(),
  getClientIp: vi.fn(),
}))

// Import after mocks
import { action } from '~/routes/api.account.delete'
import { prisma } from '~/services/prisma.server'
import { checkAuthRateLimit, getClientIp } from '~/services/rate-limiter.server'
import { getUserIdFromSession } from '~/services/session.server'

describe('Account Delete API Route', () => {
  const validPasswordHash = bcrypt.hashSync('ValidPassword123!', 12)
  const testUserId = 'test-user-id-123'

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset default mocks
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1')
    vi.mocked(checkAuthRateLimit).mockResolvedValue({ allowed: true, remaining: 5 })

    // Default: authenticated user
    vi.mocked(getUserIdFromSession).mockResolvedValue(testUserId)

    // Default user exists with valid password
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      passwordHash: validPasswordHash,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    } as any)

    // Default successful operations
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: testUserId,
      email: `deleted_${testUserId}@deleted.local`,
      passwordHash: null,
    } as any)
    vi.mocked(prisma.asset.deleteMany).mockResolvedValue({ count: 5 })
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.userCredits.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 })
    vi.mocked(prisma.authToken.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.creditTransaction.deleteMany).mockResolvedValue({ count: 10 })
    vi.mocked(prisma.generationJob.deleteMany).mockResolvedValue({ count: 2 })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getUserIdFromSession).mockResolvedValue(null)

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should reject requests for non-existent users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  describe('Password Verification', () => {
    it('should reject requests without password', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({}),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors.password).toBeDefined()
    })

    it('should reject requests with incorrect password', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'WrongPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Incorrect password')
    })

    it('should reject magic-link-only users (no password set)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: testUserId,
        email: 'test@example.com',
        passwordHash: null, // Magic link only user
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      } as any)

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'AnyPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('password')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({
        allowed: false,
        retryAfter: 900,
        reason: 'Rate limit exceeded',
      })

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many')
      expect(checkAuthRateLimit).toHaveBeenCalledWith('127.0.0.1')
    })
  })

  describe('Successful Deletion', () => {
    it('should anonymise user data', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)

      expect(response.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          email: `deleted_${testUserId}@deleted.local`,
          passwordHash: null,
        },
      })
    })

    it('should delete user assets', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
      })
    })

    it('should delete user cart items', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { session: { userId: testUserId } },
      })
    })

    it('should delete user credits', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.userCredits.deleteMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
      })
    })

    it('should delete all user sessions', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
      })
    })

    it('should delete user auth tokens', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.authToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
      })
    })

    it('should delete credit transactions for user credits', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.creditTransaction.deleteMany).toHaveBeenCalledWith({
        where: { userCredits: { userId: testUserId } },
      })
    })

    it('should delete generation jobs for user sessions', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      await action({ request, params: {}, context: {} } as any)

      expect(prisma.generationJob.deleteMany).toHaveBeenCalledWith({
        where: { session: { userId: testUserId } },
      })
    })

    it('should return success message with appropriate headers', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database connection failed'))

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('failed')
    })

    it('should handle partial deletion failures', async () => {
      // Asset deletion fails
      vi.mocked(prisma.asset.deleteMany).mockRejectedValue(new Error('Storage error'))

      const request = new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('HTTP Method Validation', () => {
    it('should only accept POST requests', async () => {
      const request = new Request('http://localhost/api/account/delete', {
        method: 'GET',
      })

      const response = await action({ request, params: {}, context: {} } as any)

      expect(response.status).toBe(405)
    })
  })
})
