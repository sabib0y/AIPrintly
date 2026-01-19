/**
 * Generation Job Status API Endpoint
 *
 * GET /api/generate/image/:jobId - Poll for generation job status
 *
 * Returns the current status of a generation job and its result if complete.
 */

import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/services/prisma.server'
import { getSessionId } from '~/services/session.server'

/**
 * Job status response
 */
interface JobStatusResponse {
  success: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  error?: string
  result?: {
    assetId: string
    imageUrl: string
    width: number
    height: number
  }
  provider?: string
  startedAt?: string
  completedAt?: string
}

/**
 * Create a JSON response
 */
function jsonResponse(data: JobStatusResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Map database status to API status
 */
function mapStatus(
  dbStatus: string
): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (dbStatus) {
    case 'PENDING':
      return 'pending'
    case 'PROCESSING':
      return 'processing'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending'
  }
}

/**
 * Handle job status request
 */
export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { jobId } = params

  if (!jobId) {
    return jsonResponse(
      {
        success: false,
        status: 'failed',
        error: 'Job ID required',
      },
      400
    )
  }

  try {
    // Get session
    const sessionId = await getSessionId(request)
    if (!sessionId) {
      return jsonResponse(
        {
          success: false,
          status: 'failed',
          error: 'Session required',
        },
        401
      )
    }

    // Get job from database
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return jsonResponse(
        {
          success: false,
          status: 'failed',
          error: 'Job not found',
        },
        404
      )
    }

    // Verify session ownership
    if (job.sessionId !== sessionId) {
      return jsonResponse(
        {
          success: false,
          status: 'failed',
          error: 'Unauthorised',
        },
        403
      )
    }

    // Build response
    const response: JobStatusResponse = {
      success: true,
      status: mapStatus(job.status),
      provider: job.provider,
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    }

    // Add error if failed
    if (job.status === 'FAILED') {
      response.error = job.errorMessage || 'Generation failed'
    }

    // Add result if completed
    if (job.status === 'COMPLETED' && job.output) {
      const output = job.output as {
        assetId?: string
        imageUrl?: string
        width?: number
        height?: number
      }

      if (output.assetId && output.imageUrl) {
        response.result = {
          assetId: output.assetId,
          imageUrl: output.imageUrl,
          width: output.width || 1024,
          height: output.height || 1024,
        }
      }
    }

    // Calculate progress for processing jobs
    if (job.status === 'PROCESSING' && job.startedAt) {
      const elapsed = Date.now() - job.startedAt.getTime()
      // Estimate based on typical generation time (45 seconds)
      const estimatedTotal = 45000
      response.progress = Math.min(95, Math.round((elapsed / estimatedTotal) * 100))
    }

    return jsonResponse(response)
  } catch (error) {
    console.error('Job status error:', error)

    return jsonResponse(
      {
        success: false,
        status: 'failed',
        error: 'Failed to get job status',
      },
      500
    )
  }
}
