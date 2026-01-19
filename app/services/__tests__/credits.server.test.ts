/**
 * Credits Service Tests
 *
 * Tests for credit operations including check, deduct, refund, and initialisation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    userCredits: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
    },
  },
}))

describe('Credits Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('checkCredits', () => {
    it('should return true when user has credits', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 5,
        totalUsed: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { checkCredits } = await import('../credits.server')

      const result = await checkCredits('session-1', null)

      expect(result.hasCredits).toBe(true)
      expect(result.balance).toBe(5)
    })

    it('should return false when user has no credits', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 0,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { checkCredits } = await import('../credits.server')

      const result = await checkCredits('session-1', null)

      expect(result.hasCredits).toBe(false)
      expect(result.balance).toBe(0)
    })

    it('should create credits for new session with guest balance', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.userCredits.create).mockResolvedValue({
        id: 'credits-new',
        sessionId: 'session-1',
        userId: null,
        balance: 3, // Guest starting balance
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { checkCredits, GUEST_INITIAL_CREDITS } = await import(
        '../credits.server'
      )

      const result = await checkCredits('session-1', null)

      expect(result.hasCredits).toBe(true)
      expect(result.balance).toBe(GUEST_INITIAL_CREDITS)
      expect(prisma.userCredits.create).toHaveBeenCalled()
    })

    it('should prioritise user credits over session credits', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-user',
        sessionId: null,
        userId: 'user-1',
        balance: 10,
        totalUsed: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { checkCredits } = await import('../credits.server')

      const result = await checkCredits('session-1', 'user-1')

      expect(result.balance).toBe(10)
    })
  })

  describe('deductCredit', () => {
    it('should deduct one credit and create transaction', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 5,
        totalUsed: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.userCredits.update).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 4,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({
        id: 'tx-1',
        userCreditsId: 'credits-1',
        amount: -1,
        reason: 'GENERATION',
        jobId: 'job-1',
        metadata: {},
        createdAt: new Date(),
      })

      const { deductCredit } = await import('../credits.server')

      const result = await deductCredit('session-1', null, 'job-1')

      expect(result.success).toBe(true)
      expect(result.newBalance).toBe(4)
      expect(prisma.creditTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: -1,
            reason: 'GENERATION',
            jobId: 'job-1',
          }),
        })
      )
    })

    it('should fail if insufficient credits', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 0,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { deductCredit } = await import('../credits.server')

      const result = await deductCredit('session-1', null, 'job-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient')
    })
  })

  describe('refundCredit', () => {
    it('should refund one credit and create transaction', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 4,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.userCredits.update).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 5,
        totalUsed: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({
        id: 'tx-2',
        userCreditsId: 'credits-1',
        amount: 1,
        reason: 'REFUND',
        jobId: 'job-1',
        metadata: {},
        createdAt: new Date(),
      })

      const { refundCredit } = await import('../credits.server')

      const result = await refundCredit('session-1', null, 'job-1')

      expect(result.success).toBe(true)
      expect(result.newBalance).toBe(5)
      expect(prisma.creditTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 1,
            reason: 'REFUND',
            jobId: 'job-1',
          }),
        })
      )
    })
  })

  describe('initCreditsForUser', () => {
    it('should create credits with registered user balance', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.upsert).mockResolvedValue({
        id: 'credits-user',
        sessionId: null,
        userId: 'user-1',
        balance: 10,
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({
        id: 'tx-init',
        userCreditsId: 'credits-user',
        amount: 10,
        reason: 'SIGNUP_BONUS',
        jobId: null,
        metadata: {},
        createdAt: new Date(),
      })

      const { initCreditsForUser, REGISTERED_INITIAL_CREDITS } = await import(
        '../credits.server'
      )

      const result = await initCreditsForUser('user-1')

      expect(result.balance).toBe(REGISTERED_INITIAL_CREDITS)
    })
  })

  describe('migrateSessionCredits', () => {
    it('should merge session credits with user credits', async () => {
      const { prisma } = await import('~/services/prisma.server')

      // Session has 2 credits remaining
      vi.mocked(prisma.userCredits.findFirst)
        .mockResolvedValueOnce({
          id: 'session-credits',
          sessionId: 'session-1',
          userId: null,
          balance: 2,
          totalUsed: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // User has 10 credits
        .mockResolvedValueOnce({
          id: 'user-credits',
          sessionId: null,
          userId: 'user-1',
          balance: 10,
          totalUsed: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      vi.mocked(prisma.userCredits.update).mockResolvedValue({
        id: 'user-credits',
        sessionId: null,
        userId: 'user-1',
        balance: 12, // 10 + 2
        totalUsed: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { migrateSessionCredits } = await import('../credits.server')

      const result = await migrateSessionCredits('session-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.migratedCredits).toBe(2)
    })

    it('should not migrate if session has no remaining credits', async () => {
      const { prisma } = await import('~/services/prisma.server')

      vi.mocked(prisma.userCredits.findFirst).mockResolvedValueOnce({
        id: 'session-credits',
        sessionId: 'session-1',
        userId: null,
        balance: 0,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { migrateSessionCredits } = await import('../credits.server')

      const result = await migrateSessionCredits('session-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.migratedCredits).toBe(0)
    })
  })

  describe('getBalance', () => {
    it('should return current balance', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue({
        id: 'credits-1',
        sessionId: 'session-1',
        userId: null,
        balance: 7,
        totalUsed: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { getBalance } = await import('../credits.server')

      const balance = await getBalance('session-1', null)

      expect(balance).toBe(7)
    })

    it('should return 0 if no credits found', async () => {
      const { prisma } = await import('~/services/prisma.server')
      vi.mocked(prisma.userCredits.findFirst).mockResolvedValue(null)

      const { getBalance } = await import('../credits.server')

      const balance = await getBalance('session-1', null)

      expect(balance).toBe(0)
    })
  })
})
