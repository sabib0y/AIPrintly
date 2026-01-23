/**
 * Credits Service
 *
 * Manages AI generation credits including check, deduct, refund, and initialisation.
 * Supports both guest sessions (3 credits) and registered users (25 credits).
 */

import { prisma } from './prisma.server'
import type { CreditTransactionReason } from '@prisma/client'

/**
 * Initial credits for guest sessions
 */
export const GUEST_INITIAL_CREDITS = 3

/**
 * Initial credits for registered users (signup bonus).
 * Business model specifies 20-30 free credits; set to 25 for MVP.
 */
export const REGISTERED_INITIAL_CREDITS = 25

/**
 * Credit check result
 */
export interface CreditCheckResult {
  /** Whether the user has available credits */
  hasCredits: boolean
  /** Current credit balance */
  balance: number
}

/**
 * Credit operation result
 */
export interface CreditOperationResult {
  /** Whether the operation succeeded */
  success: boolean
  /** New balance after operation */
  newBalance: number
  /** Error message if failed */
  error?: string
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration succeeded */
  success: boolean
  /** Number of credits migrated */
  migratedCredits: number
  /** Error message if failed */
  error?: string
}

/**
 * Find or create credits for a session/user
 */
async function findOrCreateCredits(sessionId: string, userId: string | null) {
  // First, try to find existing credits
  const existing = await prisma.userCredits.findFirst({
    where: userId
      ? { userId }
      : { sessionId, userId: null },
  })

  if (existing) {
    return existing
  }

  // Create new credits for the session
  return prisma.userCredits.create({
    data: {
      sessionId,
      userId,
      balance: userId ? REGISTERED_INITIAL_CREDITS : GUEST_INITIAL_CREDITS,
      totalUsed: 0,
    },
  })
}

/**
 * Create a credit transaction record
 */
async function createTransaction(
  userCreditsId: string,
  amount: number,
  reason: CreditTransactionReason,
  jobId?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.creditTransaction.create({
    data: {
      userCreditsId,
      amount,
      reason,
      jobId,
      metadata: (metadata || {}) as Record<string, string | number | boolean>,
    },
  })
}

/**
 * Check if session/user has available credits
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @returns Credit check result
 */
export async function checkCredits(
  sessionId: string,
  userId: string | null
): Promise<CreditCheckResult> {
  const credits = await findOrCreateCredits(sessionId, userId)

  return {
    hasCredits: credits.balance > 0,
    balance: credits.balance,
  }
}

/**
 * Deduct one credit for a generation
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @param jobId - Generation job ID for audit trail
 * @returns Operation result
 */
export async function deductCredit(
  sessionId: string,
  userId: string | null,
  jobId: string
): Promise<CreditOperationResult> {
  const credits = await findOrCreateCredits(sessionId, userId)

  if (credits.balance <= 0) {
    return {
      success: false,
      newBalance: 0,
      error: 'Insufficient credits',
    }
  }

  // Deduct credit
  const updated = await prisma.userCredits.update({
    where: { id: credits.id },
    data: {
      balance: { decrement: 1 },
      totalUsed: { increment: 1 },
    },
  })

  // Record transaction
  await createTransaction(credits.id, -1, 'GENERATION', jobId)

  return {
    success: true,
    newBalance: updated.balance,
  }
}

/**
 * Refund one credit (e.g., on generation failure)
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @param jobId - Generation job ID for audit trail
 * @returns Operation result
 */
export async function refundCredit(
  sessionId: string,
  userId: string | null,
  jobId: string
): Promise<CreditOperationResult> {
  const credits = await findOrCreateCredits(sessionId, userId)

  // Refund credit
  const updated = await prisma.userCredits.update({
    where: { id: credits.id },
    data: {
      balance: { increment: 1 },
      totalUsed: { decrement: 1 },
    },
  })

  // Record transaction
  await createTransaction(credits.id, 1, 'REFUND', jobId)

  return {
    success: true,
    newBalance: updated.balance,
  }
}

/**
 * Initialise credits for a new registered user
 *
 * @param userId - User ID
 * @returns The created credits record
 */
export async function initCreditsForUser(userId: string) {
  const credits = await prisma.userCredits.upsert({
    where: { userId },
    create: {
      userId,
      balance: REGISTERED_INITIAL_CREDITS,
      totalUsed: 0,
    },
    update: {
      // Only update if balance would increase (signup bonus)
    },
  })

  // Record initial grant transaction
  await createTransaction(credits.id, REGISTERED_INITIAL_CREDITS, 'SIGNUP_BONUS')

  return credits
}

/**
 * Migrate session credits to a user account on signup/login
 *
 * @param sessionId - Session ID
 * @param userId - User ID
 * @returns Migration result
 */
export async function migrateSessionCredits(
  sessionId: string,
  userId: string
): Promise<MigrationResult> {
  // Find session credits
  const sessionCredits = await prisma.userCredits.findFirst({
    where: { sessionId, userId: null },
  })

  if (!sessionCredits || sessionCredits.balance <= 0) {
    return {
      success: true,
      migratedCredits: 0,
    }
  }

  // Find or create user credits
  let userCredits = await prisma.userCredits.findFirst({
    where: { userId },
  })

  if (!userCredits) {
    userCredits = await prisma.userCredits.create({
      data: {
        userId,
        balance: REGISTERED_INITIAL_CREDITS,
        totalUsed: 0,
      },
    })
  }

  // Merge credits
  const migratedAmount = sessionCredits.balance

  await prisma.userCredits.update({
    where: { id: userCredits.id },
    data: {
      balance: { increment: migratedAmount },
      totalUsed: { increment: sessionCredits.totalUsed },
    },
  })

  // Zero out session credits
  await prisma.userCredits.update({
    where: { id: sessionCredits.id },
    data: {
      balance: 0,
      userId, // Link to user for reference
    },
  })

  // Record migration transaction
  await createTransaction(
    userCredits.id,
    migratedAmount,
    'ADMIN_ADJUSTMENT',
    undefined,
    { reason: 'session_migration', fromSessionId: sessionId }
  )

  return {
    success: true,
    migratedCredits: migratedAmount,
  }
}

/**
 * Get current credit balance
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @returns Current balance
 */
export async function getBalance(
  sessionId: string,
  userId: string | null
): Promise<number> {
  const credits = await prisma.userCredits.findFirst({
    where: userId
      ? { userId }
      : { sessionId, userId: null },
  })

  return credits?.balance ?? 0
}

/**
 * Add credits to an account (e.g., purchase or admin grant)
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @param amount - Number of credits to add
 * @param reason - Reason for the credit addition
 * @param metadata - Additional metadata
 * @returns Operation result
 */
export async function addCredits(
  sessionId: string,
  userId: string | null,
  amount: number,
  reason: CreditTransactionReason,
  metadata?: Record<string, unknown>
): Promise<CreditOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      error: 'Amount must be positive',
    }
  }

  const credits = await findOrCreateCredits(sessionId, userId)

  const updated = await prisma.userCredits.update({
    where: { id: credits.id },
    data: {
      balance: { increment: amount },
    },
  })

  await createTransaction(credits.id, amount, reason, undefined, metadata)

  return {
    success: true,
    newBalance: updated.balance,
  }
}

/**
 * Get credit usage history
 *
 * @param sessionId - Session ID
 * @param userId - User ID (null for guests)
 * @param limit - Maximum records to return
 * @returns Transaction history
 */
export async function getCreditHistory(
  sessionId: string,
  userId: string | null,
  limit: number = 20
) {
  const credits = await prisma.userCredits.findFirst({
    where: userId
      ? { userId }
      : { sessionId, userId: null },
  })

  if (!credits) {
    return []
  }

  return prisma.creditTransaction.findMany({
    where: { userCreditsId: credits.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      job: {
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })
}
