/**
 * Session Management Service
 *
 * Cookie-based session storage using React Router's createCookieSessionStorage.
 * Supports both guest and authenticated sessions with 7-day rolling expiry.
 */

import { createCookieSessionStorage, redirect } from 'react-router'
import { nanoid } from 'nanoid'
import { prisma } from './prisma.server'

/**
 * Session data structure stored in the cookie
 */
export interface SessionData {
  /** Database session ID (UUID) */
  id: string
  /** User ID if authenticated, null for guests */
  userId: string | null
  /** Timestamp when session was created */
  createdAt: string
}

/**
 * Flash data for one-time messages
 */
export interface SessionFlashData {
  error?: string
  success?: string
}

// Validate required environment variables
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required')
}

/**
 * Cookie session storage configuration
 *
 * - 7-day rolling expiry (resets on each request)
 * - httpOnly for security
 * - sameSite lax for CSRF protection whilst allowing navigation
 * - secure in production
 */
const sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>(
  {
    cookie: {
      name: '__aiprintly_session',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
      sameSite: 'lax',
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === 'production',
    },
  }
)

/**
 * Get the session from the request, creating a new one if needed
 *
 * This function handles:
 * 1. Reading existing session from cookie
 * 2. Creating new database session if none exists
 * 3. Validating session exists in database and hasn't expired
 * 4. Returning the session object for modification
 *
 * @param request - The incoming request
 * @returns The session object (may be new or existing)
 */
export async function getSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie')
  )

  const sessionId = session.get('id')

  // If we have a session ID, verify it exists in the database and isn't expired
  if (sessionId) {
    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    // If session exists and hasn't expired, return it
    if (dbSession && dbSession.expiresAt > new Date()) {
      return session
    }

    // Session expired or not found - clear the invalid session data
    session.unset('id')
    session.unset('userId')
    session.unset('createdAt')
  }

  // Create a new database session
  const newSession = await createDatabaseSession(null)

  // Store session data in cookie
  session.set('id', newSession.id)
  session.set('userId', newSession.userId)
  session.set('createdAt', newSession.createdAt.toISOString())

  return session
}

/**
 * Create a new session in the database
 *
 * @param userId - User ID if authenticated, null for guest sessions
 * @returns The created database session
 */
export async function createDatabaseSession(userId: string | null) {
  const sessionToken = nanoid(32)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const dbSession = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  })

  // Create initial credits for the session (3 free credits)
  await prisma.userCredits.create({
    data: {
      sessionId: dbSession.id,
      userId,
      balance: 3,
      totalUsed: 0,
    },
  })

  return dbSession
}

/**
 * Commit the session to the cookie
 *
 * Call this after modifying session data to persist changes.
 *
 * @param session - The session to commit
 * @returns Set-Cookie header value
 */
export function commitSession(
  session: Awaited<ReturnType<typeof sessionStorage.getSession>>
) {
  return sessionStorage.commitSession(session)
}

/**
 * Destroy the session (logout)
 *
 * Removes the session cookie and optionally deletes from database.
 *
 * @param session - The session to destroy
 * @param deleteFromDb - Whether to delete the session from database (default: true)
 * @returns Set-Cookie header value that clears the cookie
 */
export async function destroySession(
  session: Awaited<ReturnType<typeof sessionStorage.getSession>>,
  deleteFromDb = true
) {
  const sessionId = session.get('id')

  // Optionally delete from database
  if (deleteFromDb && sessionId) {
    await prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {
      // Session may already be deleted, ignore error
    })
  }

  return sessionStorage.destroySession(session)
}

/**
 * Get the session ID from the request
 *
 * @param request - The incoming request
 * @returns Session ID or null if no valid session
 */
export async function getSessionId(request: Request): Promise<string | null> {
  const session = await getSession(request)
  return session.get('id') ?? null
}

/**
 * Get the user ID from the session
 *
 * @param request - The incoming request
 * @returns User ID or null if guest session
 */
export async function getUserIdFromSession(
  request: Request
): Promise<string | null> {
  const session = await getSession(request)
  return session.get('userId') ?? null
}

/**
 * Associate a user with the current session (login)
 *
 * Updates both the cookie session and database session with the user ID.
 * Also migrates any session credits to user credits if applicable.
 *
 * @param request - The incoming request
 * @param userId - The user ID to associate
 * @returns Object containing the updated session and Set-Cookie header
 */
export async function linkUserToSession(request: Request, userId: string) {
  const session = await getSession(request)
  const sessionId = session.get('id')

  if (sessionId) {
    // Update database session
    await prisma.session.update({
      where: { id: sessionId },
      data: { userId },
    })

    // Update session credits to link to user
    await prisma.userCredits.updateMany({
      where: { sessionId, userId: null },
      data: { userId },
    })
  }

  // Update cookie session
  session.set('userId', userId)

  return {
    session,
    header: await commitSession(session),
  }
}

/**
 * Remove user association from session (logout)
 *
 * Creates a new guest session after removing user association.
 *
 * @param request - The incoming request
 * @returns Object containing redirect response with cleared session
 */
export async function unlinkUserFromSession(request: Request) {
  const session = await getSession(request)

  // Destroy current session and create a new guest session
  const destroyHeader = await destroySession(session, false)

  return redirect('/', {
    headers: {
      'Set-Cookie': destroyHeader,
    },
  })
}

export { sessionStorage }
