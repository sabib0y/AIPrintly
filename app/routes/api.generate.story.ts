/**
 * Story Generation API Endpoint
 *
 * POST /api/generate/story - Generate a personalised children's story
 *
 * Handles story generation with GPT-4, including illustration prompts.
 */

import type { ActionFunctionArgs } from 'react-router'
import { prisma } from '~/services/prisma.server'
import { getSessionId, getUserIdFromSession } from '~/services/session.server'
import {
  checkGenerationRateLimit,
  checkConcurrentJobLimit,
} from '~/services/rate-limiter.server'
import {
  generateStory,
  validateStoryRequest,
  STORY_THEMES,
} from '~/services/ai/story-generator.server'
import { checkCredits, deductCredit, refundCredit } from '~/services/credits.server'

/**
 * API response types
 */
interface StorySuccessResponse {
  success: true
  jobId: string
  story: {
    title: string
    pages: Array<{
      pageNumber: number
      text: string
      illustrationPrompt: string
    }>
  }
  creditsRemaining: number
}

interface StoryErrorResponse {
  success: false
  error: string
  errorCode?: string
  errors?: string[]
}

type StoryResponse = StorySuccessResponse | StoryErrorResponse

/**
 * Create a JSON response
 */
function jsonResponse(data: StoryResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Handle story generation request
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  // Only allow POST
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    // Get session
    const sessionId = await getSessionId(request)
    if (!sessionId) {
      return jsonResponse({ success: false, error: 'Session required' }, 401)
    }

    const userId = await getUserIdFromSession(request)

    // Parse form data
    const formData = await request.formData()
    const childName = formData.get('childName')?.toString() || ''
    const childAge = formData.get('childAge')?.toString()
    const theme = formData.get('theme')?.toString() || 'adventure'
    const pageCount = parseInt(formData.get('pageCount')?.toString() || '8', 10)
    const customElements = formData.get('customElements')?.toString()

    // Build request
    const storyRequest = {
      childName,
      childAge: childAge ? parseInt(childAge, 10) : undefined,
      theme,
      pageCount,
      customElements,
    }

    // Validate request
    const validation = validateStoryRequest(storyRequest)
    if (!validation.isValid) {
      return jsonResponse(
        {
          success: false,
          error: 'Validation failed',
          errorCode: 'INVALID_REQUEST',
          errors: validation.errors,
        },
        400
      )
    }

    // Check rate limits
    const rateLimitResult = await checkGenerationRateLimit(sessionId, request)
    if (!rateLimitResult.allowed) {
      return jsonResponse(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
          errorCode: 'RATE_LIMITED',
        },
        429
      )
    }

    // Check concurrent job limit
    const concurrentResult = await checkConcurrentJobLimit(sessionId)
    if (!concurrentResult.allowed) {
      return jsonResponse(
        {
          success: false,
          error: concurrentResult.reason || 'Too many concurrent jobs',
          errorCode: 'CONCURRENT_LIMIT',
        },
        429
      )
    }

    // Check credits
    const creditsResult = await checkCredits(sessionId, userId)
    if (!creditsResult.hasCredits) {
      return jsonResponse(
        {
          success: false,
          error: 'Insufficient credits. Please purchase more credits to continue.',
          errorCode: 'NO_CREDITS',
        },
        402
      )
    }

    // Create job record
    const job = await prisma.generationJob.create({
      data: {
        sessionId,
        type: 'STORY',
        status: 'PENDING',
        provider: 'openai',
        inputParams: {
          childName,
          childAge: storyRequest.childAge,
          theme,
          pageCount,
          customElements,
        },
      },
    })

    // Deduct credit
    const deductResult = await deductCredit(sessionId, userId, job.id)
    if (!deductResult.success) {
      // Cleanup job
      await prisma.generationJob.delete({ where: { id: job.id } })
      return jsonResponse(
        {
          success: false,
          error: 'Failed to deduct credit',
          errorCode: 'CREDIT_ERROR',
        },
        500
      )
    }

    // Update job to processing
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', startedAt: new Date() },
    })

    // Generate story
    const result = await generateStory(storyRequest)

    // Handle failure
    if (!result.success) {
      // Refund credit
      await refundCredit(sessionId, userId, job.id)

      // Update job status
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: result.error,
          completedAt: new Date(),
        },
      })

      return jsonResponse(
        {
          success: false,
          error: result.error,
          errorCode: 'GENERATION_FAILED',
        },
        500
      )
    }

    // Update job as completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        output: {
          title: result.story.title,
          pageCount: result.story.pages.length,
          pages: JSON.parse(JSON.stringify(result.story.pages)),
        } as unknown as Record<string, string | number | boolean | object>,
        completedAt: new Date(),
      },
    })

    return jsonResponse({
      success: true,
      jobId: job.id,
      story: result.story,
      creditsRemaining: deductResult.newBalance,
    })
  } catch (error) {
    console.error('Story generation error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return jsonResponse(
      {
        success: false,
        error: `Story generation failed: ${errorMessage}`,
        errorCode: 'INTERNAL_ERROR',
      },
      500
    )
  }
}

/**
 * GET handler - return available themes
 */
export async function loader(): Promise<Response> {
  return new Response(
    JSON.stringify({
      themes: STORY_THEMES.map((theme) => ({
        id: theme,
        name: theme.charAt(0).toUpperCase() + theme.slice(1).replace('_', ' '),
      })),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
