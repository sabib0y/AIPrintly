/**
 * Credits API Endpoint
 *
 * GET /api/credits - Get current credit balance
 *
 * Returns the user's current credit balance and usage statistics.
 */

import type { LoaderFunctionArgs } from 'react-router'
import { getSessionId, getUserIdFromSession } from '~/services/session.server'
import { checkCredits, getCreditHistory } from '~/services/credits.server'

/**
 * Credits response
 */
interface CreditsResponse {
  success: boolean
  balance?: number
  hasCredits?: boolean
  history?: Array<{
    id: string
    amount: number
    reason: string
    createdAt: string
    job?: {
      id: string
      type: string
      status: string
    } | null
  }>
  error?: string
}

/**
 * Create a JSON response
 */
function jsonResponse(data: CreditsResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Handle credits request
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    // Get session
    const sessionId = await getSessionId(request)
    if (!sessionId) {
      return jsonResponse(
        {
          success: false,
          error: 'Session required',
        },
        401
      )
    }

    const userId = await getUserIdFromSession(request)

    // Get credit balance
    const creditCheck = await checkCredits(sessionId, userId)

    // Check if history is requested
    const url = new URL(request.url)
    const includeHistory = url.searchParams.get('history') === 'true'

    let history = undefined
    if (includeHistory) {
      const historyRecords = await getCreditHistory(sessionId, userId, 10)
      history = historyRecords.map((record) => ({
        id: record.id,
        amount: record.amount,
        reason: record.reason,
        createdAt: record.createdAt.toISOString(),
        job: record.job
          ? {
              id: record.job.id,
              type: record.job.type,
              status: record.job.status,
            }
          : null,
      }))
    }

    return jsonResponse({
      success: true,
      balance: creditCheck.balance,
      hasCredits: creditCheck.hasCredits,
      history,
    })
  } catch (error) {
    console.error('Credits error:', error)

    return jsonResponse(
      {
        success: false,
        error: 'Failed to get credit balance',
      },
      500
    )
  }
}
