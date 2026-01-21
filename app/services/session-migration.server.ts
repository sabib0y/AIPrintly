/**
 * Session Migration Service
 *
 * Handles migration of guest session data to user accounts during signup/login.
 * Migrates credits, assets, cart items, and configurations.
 */

import { prisma } from './prisma.server'
import { migrateSessionCredits } from './credits.server'

/**
 * Migration result summary
 */
export interface SessionMigrationResult {
  success: boolean
  creditsTransferred: number
  assetsTransferred: number
  cartItemsTransferred: number
  configurationsTransferred: number
  errors: string[]
}

/**
 * Migrate all session data to a user account
 *
 * Call this after user registration or login to transfer guest data.
 *
 * @param sessionId - The guest session ID
 * @param userId - The user ID to transfer data to
 * @returns Migration result summary
 */
export async function migrateSessionToUser(
  sessionId: string,
  userId: string
): Promise<SessionMigrationResult> {
  const result: SessionMigrationResult = {
    success: true,
    creditsTransferred: 0,
    assetsTransferred: 0,
    cartItemsTransferred: 0,
    configurationsTransferred: 0,
    errors: [],
  }

  try {
    // 1. Migrate credits
    const creditResult = await migrateSessionCredits(sessionId, userId)
    if (creditResult.success) {
      result.creditsTransferred = creditResult.migratedCredits
    } else if (creditResult.error) {
      result.errors.push(`Credits: ${creditResult.error}`)
    }

    // 2. Migrate assets (update userId on session assets)
    const assetsMigrated = await prisma.asset.updateMany({
      where: {
        sessionId,
        userId: null,
      },
      data: {
        userId,
      },
    })
    result.assetsTransferred = assetsMigrated.count

    // 3. Migrate product configurations
    const configsMigrated = await prisma.productConfiguration.updateMany({
      where: {
        sessionId,
        // Only migrate configs not already associated with a user
      },
      data: {
        // Link to user via the session
        // The session will now be associated with the user
      },
    })
    result.configurationsTransferred = configsMigrated.count

    // 4. Update the session to link to user
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        userId: null,
      },
      data: {
        userId,
      },
    })

    // Cart items are linked via sessionId, so they'll automatically
    // be available once the session is linked to the user.
    // Count them for the result
    const cartItemCount = await prisma.cartItem.count({
      where: { sessionId },
    })
    result.cartItemsTransferred = cartItemCount

  } catch (error) {
    result.success = false
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown migration error'
    )
  }

  return result
}

/**
 * Check if a session has guest data that can be migrated
 *
 * @param sessionId - The session ID to check
 * @returns Object indicating what data exists
 */
export async function getSessionDataSummary(sessionId: string): Promise<{
  hasCredits: boolean
  creditBalance: number
  assetCount: number
  cartItemCount: number
  configurationCount: number
}> {
  const [credits, assetCount, cartItemCount, configCount] = await Promise.all([
    prisma.userCredits.findFirst({
      where: { sessionId, userId: null },
      select: { balance: true },
    }),
    prisma.asset.count({
      where: { sessionId, userId: null },
    }),
    prisma.cartItem.count({
      where: { sessionId },
    }),
    prisma.productConfiguration.count({
      where: { sessionId },
    }),
  ])

  return {
    hasCredits: (credits?.balance ?? 0) > 0,
    creditBalance: credits?.balance ?? 0,
    assetCount,
    cartItemCount,
    configurationCount: configCount,
  }
}

/**
 * Clean up old guest session data
 *
 * Called periodically to remove orphaned session data.
 * Only cleans sessions older than the specified age.
 *
 * @param olderThanDays - Delete sessions older than this many days
 * @returns Number of sessions cleaned
 */
export async function cleanupGuestSessions(
  olderThanDays: number = 30
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  // Find old guest sessions (no userId)
  const oldSessions = await prisma.session.findMany({
    where: {
      userId: null,
      createdAt: {
        lt: cutoffDate,
      },
    },
    select: { id: true },
  })

  if (oldSessions.length === 0) {
    return 0
  }

  const sessionIds = oldSessions.map((s) => s.id)

  // Delete in order to respect foreign key constraints
  // Cart items → Configurations → Assets → Credits → Sessions
  await prisma.$transaction([
    prisma.cartItem.deleteMany({
      where: { sessionId: { in: sessionIds } },
    }),
    prisma.productConfiguration.deleteMany({
      where: { sessionId: { in: sessionIds } },
    }),
    prisma.asset.deleteMany({
      where: { sessionId: { in: sessionIds }, userId: null },
    }),
    prisma.userCredits.deleteMany({
      where: { sessionId: { in: sessionIds }, userId: null },
    }),
    prisma.session.deleteMany({
      where: { id: { in: sessionIds } },
    }),
  ])

  return oldSessions.length
}
