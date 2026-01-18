/**
 * Authentication Utilities
 *
 * Server-side authentication helpers for protecting routes and retrieving
 * the current user from the session.
 */

import { redirect } from 'react-router'
import { prisma } from './prisma.server'
import { getSession, getUserIdFromSession, commitSession } from './session.server'
import type { User } from '@prisma/client'

/**
 * User data returned from auth utilities (excludes sensitive fields)
 */
export type SafeUser = Omit<User, 'passwordHash'>

/**
 * Require authentication for a route
 *
 * If the user is not authenticated, redirects to the login page.
 * The current URL is stored as a redirect parameter for post-login navigation.
 *
 * @param request - The incoming request
 * @param redirectTo - Custom redirect path (defaults to /login)
 * @returns The authenticated user
 * @throws Redirect to login page if not authenticated
 */
export async function requireAuth(
  request: Request,
  redirectTo = '/login'
): Promise<SafeUser> {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    const url = new URL(request.url)
    const searchParams = new URLSearchParams([
      ['redirectTo', url.pathname + url.search],
    ])
    throw redirect(`${redirectTo}?${searchParams}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    // User was deleted but session still exists - clear session and redirect
    const session = await getSession(request)
    throw redirect(redirectTo, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  }

  return user as SafeUser
}

/**
 * Get the current user from the session
 *
 * Returns null if not authenticated or user not found.
 * Use this for optional authentication (e.g., showing user-specific UI).
 *
 * @param request - The incoming request
 * @returns The user or null if not authenticated
 */
export async function getUser(request: Request): Promise<SafeUser | null> {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user as SafeUser | null
}

/**
 * Check if the current request is authenticated
 *
 * Returns a boolean indicating authentication status.
 * Use this for simple auth checks without needing user data.
 *
 * @param request - The incoming request
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    return false
  }

  // Verify user still exists in database
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  return !!userExists
}

/**
 * Get the current user with their credits
 *
 * Returns user data along with their credit balance.
 *
 * @param request - The incoming request
 * @returns User with credits or null if not authenticated
 */
export async function getUserWithCredits(request: Request) {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      credits: {
        select: {
          balance: true,
          totalUsed: true,
        },
      },
    },
  })

  return user
}

/**
 * Require a specific user by ID
 *
 * Ensures the authenticated user matches the expected user ID.
 * Useful for protecting user-specific resources.
 *
 * @param request - The incoming request
 * @param expectedUserId - The user ID that must match
 * @param redirectTo - Where to redirect if unauthorised
 * @returns The authenticated user
 * @throws Redirect if not authorised
 */
export async function requireUser(
  request: Request,
  expectedUserId: string,
  redirectTo = '/'
): Promise<SafeUser> {
  const user = await requireAuth(request)

  if (user.id !== expectedUserId) {
    throw redirect(redirectTo)
  }

  return user
}
