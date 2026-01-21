/**
 * Rate Limiter Service
 *
 * Provides per-session and per-IP rate limiting, concurrent job limiting,
 * and abuse detection for protecting API endpoints.
 */

import { prisma } from './prisma.server'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Seconds until the rate limit resets (if blocked) */
  retryAfter?: number
  /** Reason for blocking (if blocked) */
  reason?: string
  /** Remaining requests in current window */
  remaining?: number
}

/**
 * Abuse detection result
 */
export interface AbuseDetectionResult {
  /** Whether the behaviour is abusive */
  isAbusive: boolean
  /** Type of abuse detected */
  abuseType?: 'rapid_fire' | 'distributed' | 'pattern'
}

/**
 * Upload rate limit: 20 uploads per hour per session
 */
export const UPLOAD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/**
 * Generation rate limit: 10 generations per hour per session
 */
export const GENERATION_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/**
 * IP-based rate limit: 100 requests per hour per IP
 */
export const IP_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/**
 * Auth rate limit: 5 attempts per 15 minutes per IP
 * Used for login and registration to prevent brute force and spam
 */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

/**
 * Maximum concurrent generation jobs per session
 */
export const MAX_CONCURRENT_JOBS = 2

/**
 * Abuse detection threshold
 */
export const ABUSE_THRESHOLD = {
  /** Maximum requests per second before considered abuse */
  requestsPerSecond: 5,
  /** Time window for abuse detection in milliseconds */
  windowMs: 1000,
}

/**
 * In-memory rate limit store
 *
 * In production, this should be replaced with Redis for multi-instance support.
 */
interface RateLimitEntry {
  count: number
  resetAt: number
  timestamps: number[] // For abuse detection
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const abuseList = new Set<string>() // Blocked sessions/IPs

/**
 * Generate rate limit key for a session
 */
function getSessionKey(sessionId: string, type: string): string {
  return `session:${sessionId}:${type}`
}

/**
 * Generate rate limit key for an IP
 */
function getIpKey(ip: string): string {
  return `ip:${ip}`
}

/**
 * Get client IP from request headers
 *
 * @param request - The incoming request
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For header (load balancer/proxy)
  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header (nginx)
  const realIp = request.headers.get('X-Real-IP')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback
  return 'unknown'
}

/**
 * Check rate limit for a given key
 *
 * @param key - Unique key for rate limiting
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No existing entry or expired - create new
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      timestamps: [now],
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      allowed: false,
      retryAfter,
      reason: 'Rate limit exceeded',
      remaining: 0,
    }
  }

  // Increment counter
  entry.count++
  entry.timestamps.push(now)

  // Keep only recent timestamps for abuse detection
  entry.timestamps = entry.timestamps.filter(
    (t) => t > now - ABUSE_THRESHOLD.windowMs
  )

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
  }
}

/**
 * Check upload rate limit for a session
 *
 * @param sessionId - Session ID
 * @param request - The incoming request
 * @returns Rate limit result
 */
export async function checkUploadRateLimit(
  sessionId: string,
  request: Request
): Promise<RateLimitResult> {
  const ip = getClientIp(request)

  // Check if session is on abuse list
  if (abuseList.has(sessionId) || abuseList.has(ip)) {
    return {
      allowed: false,
      retryAfter: 3600,
      reason: 'Session blocked due to abuse detection',
    }
  }

  // Check session rate limit
  const sessionKey = getSessionKey(sessionId, 'upload')
  const sessionResult = checkRateLimit(sessionKey, UPLOAD_RATE_LIMIT)
  if (!sessionResult.allowed) {
    return sessionResult
  }

  // Check IP rate limit
  const ipResult = await checkIpRateLimit(ip)
  if (!ipResult.allowed) {
    return ipResult
  }

  return sessionResult
}

/**
 * Check generation rate limit for a session
 *
 * @param sessionId - Session ID
 * @param request - The incoming request
 * @returns Rate limit result
 */
export async function checkGenerationRateLimit(
  sessionId: string,
  request: Request
): Promise<RateLimitResult> {
  const ip = getClientIp(request)

  // Check if session is on abuse list
  if (abuseList.has(sessionId) || abuseList.has(ip)) {
    return {
      allowed: false,
      retryAfter: 3600,
      reason: 'Session blocked due to abuse detection',
    }
  }

  // Check session rate limit
  const sessionKey = getSessionKey(sessionId, 'generation')
  const sessionResult = checkRateLimit(sessionKey, GENERATION_RATE_LIMIT)
  if (!sessionResult.allowed) {
    return sessionResult
  }

  // Check IP rate limit
  const ipResult = await checkIpRateLimit(ip)
  if (!ipResult.allowed) {
    return ipResult
  }

  return sessionResult
}

/**
 * Check IP-based rate limit
 *
 * @param ip - Client IP address
 * @returns Rate limit result
 */
export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  if (ip === 'unknown') {
    // Allow unknown IPs but with stricter limits
    return { allowed: true, remaining: 10 }
  }

  const key = getIpKey(ip)
  return checkRateLimit(key, IP_RATE_LIMIT)
}

/**
 * Check auth rate limit (login/registration)
 *
 * @param ip - Client IP address
 * @returns Rate limit result
 */
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  if (ip === 'unknown') {
    // Stricter limits for unknown IPs on auth endpoints
    return { allowed: true, remaining: 3 }
  }

  const key = `auth:${ip}`
  return checkRateLimit(key, AUTH_RATE_LIMIT)
}

/**
 * Check concurrent job limit for a session
 *
 * @param sessionId - Session ID
 * @returns Rate limit result
 */
export async function checkConcurrentJobLimit(
  sessionId: string
): Promise<RateLimitResult> {
  // Count active jobs in database
  const activeJobs = await prisma.generationJob.count({
    where: {
      sessionId,
      status: {
        in: ['PENDING', 'PROCESSING'],
      },
    },
  })

  if (activeJobs >= MAX_CONCURRENT_JOBS) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_CONCURRENT_JOBS} concurrent jobs allowed. Please wait for current jobs to complete.`,
    }
  }

  return {
    allowed: true,
    remaining: MAX_CONCURRENT_JOBS - activeJobs,
  }
}

/**
 * Detect abusive request patterns
 *
 * @param sessionId - Session ID
 * @param request - The incoming request
 * @returns Abuse detection result
 */
export async function detectAbuse(
  sessionId: string,
  request: Request
): Promise<AbuseDetectionResult> {
  const ip = getClientIp(request)
  const now = Date.now()

  // Check session-based rapid fire
  const sessionKey = getSessionKey(sessionId, 'abuse')
  const sessionEntry = rateLimitStore.get(sessionKey)

  if (!sessionEntry) {
    rateLimitStore.set(sessionKey, {
      count: 1,
      resetAt: now + ABUSE_THRESHOLD.windowMs,
      timestamps: [now],
    })
    return { isAbusive: false }
  }

  // Add timestamp and filter old ones
  sessionEntry.timestamps.push(now)
  sessionEntry.timestamps = sessionEntry.timestamps.filter(
    (t) => t > now - ABUSE_THRESHOLD.windowMs
  )

  // Check for rapid-fire abuse
  if (sessionEntry.timestamps.length > ABUSE_THRESHOLD.requestsPerSecond) {
    // Add to abuse list
    abuseList.add(sessionId)
    abuseList.add(ip)

    // Schedule removal after 1 hour
    setTimeout(() => {
      abuseList.delete(sessionId)
      abuseList.delete(ip)
    }, 60 * 60 * 1000)

    return {
      isAbusive: true,
      abuseType: 'rapid_fire',
    }
  }

  return { isAbusive: false }
}

/**
 * Clean up expired rate limit entries
 *
 * Call this periodically to prevent memory leaks.
 *
 * @returns Number of entries cleaned up
 */
export async function cleanupExpiredEntries(): Promise<number> {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  return cleaned
}

/**
 * Get current rate limit status for a session
 *
 * Useful for displaying remaining limits to users.
 *
 * @param sessionId - Session ID
 * @returns Current rate limit status
 */
export function getRateLimitStatus(sessionId: string): {
  upload: { remaining: number; resetIn: number }
  generation: { remaining: number; resetIn: number }
} {
  const now = Date.now()

  const uploadKey = getSessionKey(sessionId, 'upload')
  const uploadEntry = rateLimitStore.get(uploadKey)

  const generationKey = getSessionKey(sessionId, 'generation')
  const generationEntry = rateLimitStore.get(generationKey)

  return {
    upload: {
      remaining: uploadEntry
        ? Math.max(0, UPLOAD_RATE_LIMIT.maxRequests - uploadEntry.count)
        : UPLOAD_RATE_LIMIT.maxRequests,
      resetIn: uploadEntry
        ? Math.max(0, Math.ceil((uploadEntry.resetAt - now) / 1000))
        : 0,
    },
    generation: {
      remaining: generationEntry
        ? Math.max(0, GENERATION_RATE_LIMIT.maxRequests - generationEntry.count)
        : GENERATION_RATE_LIMIT.maxRequests,
      resetIn: generationEntry
        ? Math.max(0, Math.ceil((generationEntry.resetAt - now) / 1000))
        : 0,
    },
  }
}

/**
 * Reset rate limits for a session (admin function)
 *
 * @param sessionId - Session ID
 */
export function resetRateLimits(sessionId: string): void {
  rateLimitStore.delete(getSessionKey(sessionId, 'upload'))
  rateLimitStore.delete(getSessionKey(sessionId, 'generation'))
  rateLimitStore.delete(getSessionKey(sessionId, 'abuse'))
  abuseList.delete(sessionId)
}

/**
 * Check if a session is currently blocked
 *
 * @param sessionId - Session ID
 * @returns True if blocked
 */
export function isSessionBlocked(sessionId: string): boolean {
  return abuseList.has(sessionId)
}
