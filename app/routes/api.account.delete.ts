/**
 * Account Deletion API Route
 *
 * POST /api/account/delete - Delete user account (GDPR-compliant)
 *
 * This endpoint handles the permanent deletion of user accounts whilst:
 * - Anonymising user data (GDPR right to be forgotten)
 * - Retaining order history (HMRC 6-year requirement)
 * - Deleting all personal assets and session data
 *
 * Security:
 * - Requires authentication
 * - Requires password confirmation
 * - Rate limited to prevent brute force
 */

import { type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '~/services/prisma.server'
import {
  getSession,
  commitSession,
  destroySession,
  getUserIdFromSession,
} from '~/services/session.server'
import { checkAuthRateLimit, getClientIp } from '~/services/rate-limiter.server'

/**
 * Schema for account deletion request
 */
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm deletion'),
})

/**
 * Helper to create JSON response with headers
 */
function jsonResponse(
  data: Record<string, unknown>,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

/**
 * POST /api/account/delete
 *
 * Deletes the authenticated user's account.
 *
 * Request body (form data):
 * - password: Current password for confirmation
 *
 * Process:
 * 1. Verify authentication
 * 2. Check rate limit
 * 3. Verify password
 * 4. Anonymise user data
 * 5. Delete related data (assets, cart, credits, sessions, tokens)
 * 6. Keep orders (legal requirement)
 * 7. Destroy session
 */
export async function action({ request }: ActionFunctionArgs) {
  // Verify request method
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const session = await getSession(request)

  // Check authentication
  const userId = await getUserIdFromSession(request)
  if (!userId) {
    return jsonResponse(
      { error: 'Authentication required' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  // Check rate limit
  const ip = getClientIp(request)
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.allowed) {
    return jsonResponse(
      {
        error: 'Too many deletion attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  // Parse and validate form data
  const formData = await request.formData()
  const rawData = Object.fromEntries(formData)
  const parseResult = deleteAccountSchema.safeParse(rawData)

  if (!parseResult.success) {
    const errors = parseResult.error.flatten()
    return jsonResponse(
      {
        errors: errors.fieldErrors,
        error: errors.formErrors[0] || null,
      },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  const { password } = parseResult.data

  // Fetch user with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  })

  if (!user) {
    return jsonResponse(
      { error: 'User not found' },
      {
        status: 404,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  // Check if user has a password (not magic-link-only)
  if (!user.passwordHash) {
    return jsonResponse(
      {
        error:
          'Cannot delete account: no password set. Please set a password first or contact support.',
      },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) {
    return jsonResponse(
      { error: 'Incorrect password' },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    // Log the deletion request for audit trail
    console.info(
      `[ACCOUNT_DELETION] User ${userId} (${user.email}) requested account deletion`
    )

    // Execute deletion in a transaction-like manner
    // Order matters: delete dependents first, then anonymise user

    // 1. Delete credit transactions (depends on userCredits)
    await prisma.creditTransaction.deleteMany({
      where: { userCredits: { userId } },
    })

    // 2. Delete user credits
    await prisma.userCredits.deleteMany({
      where: { userId },
    })

    // 3. Delete generation jobs (via sessions)
    await prisma.generationJob.deleteMany({
      where: { session: { userId } },
    })

    // 4. Delete product configurations (but keep those linked to orders)
    // Note: OrderItems reference configurations, so we can't delete those
    // Instead, configurations will remain orphaned but anonymised via user

    // 5. Delete cart items
    await prisma.cartItem.deleteMany({
      where: { session: { userId } },
    })

    // 6. Delete assets
    await prisma.asset.deleteMany({
      where: { userId },
    })

    // 7. Delete auth tokens (magic links, password resets)
    await prisma.authToken.deleteMany({
      where: { userId },
    })

    // 8. Delete all sessions (including current)
    await prisma.session.deleteMany({
      where: { userId },
    })

    // 9. Anonymise user data (instead of hard delete)
    // This preserves the user ID for order history whilst removing PII
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.local`,
        passwordHash: null,
      },
    })

    // Log successful deletion
    console.info(`[ACCOUNT_DELETION] Successfully deleted account for user ${userId}`)

    // Destroy the current session cookie
    const destroyHeader = await destroySession(session, false)

    return jsonResponse(
      {
        success: true,
        message:
          'Your account has been successfully deleted. Order history has been retained for legal compliance.',
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': destroyHeader,
        },
      }
    )
  } catch (error) {
    console.error('[ACCOUNT_DELETION] Error deleting account:', error)

    return jsonResponse(
      {
        error:
          'Account deletion failed. Please try again or contact support if the issue persists.',
      },
      {
        status: 500,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
