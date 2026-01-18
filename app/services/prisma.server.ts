/**
 * Prisma Client Singleton
 *
 * Creates a single PrismaClient instance and handles development hot-reload
 * by storing the client in globalThis to prevent multiple instances.
 */

import { PrismaClient } from '@prisma/client'

/**
 * Extend globalThis to include our prisma client for development hot-reload
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

/**
 * Get or create the PrismaClient singleton
 *
 * In development, we store the client in globalThis to prevent
 * multiple instances being created during hot module replacement.
 *
 * In production, we simply create a new instance.
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  return client
}

/**
 * Singleton PrismaClient instance
 *
 * Uses globalThis in development to survive hot-reload,
 * creates a fresh instance in production.
 */
export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export default prisma
