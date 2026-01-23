/**
 * Image Generation API Endpoint
 *
 * POST /api/generate/image - Start an AI image generation job
 *
 * Handles prompt validation, credit checks, rate limiting, and provider selection.
 */

import type { ActionFunctionArgs } from 'react-router'
import { prisma } from '~/services/prisma.server'
import { getSessionId, getUserIdFromSession } from '~/services/session.server'
import {
  checkGenerationRateLimit,
  checkConcurrentJobLimit,
} from '~/services/rate-limiter.server'
import {
  getPrimaryProvider,
  getFallbackProvider,
  validatePrompt,
  STYLE_PRESETS,
  SUPPORTED_DIMENSIONS,
  PREVIEW_RESOLUTION,
  isPrintResolution,
} from '~/services/ai'
import { checkCredits, deductCredit, refundCredit } from '~/services/credits.server'
import {
  uploadFile,
  generateStorageKey,
  calculateRetentionExpiry,
  getProxyUrl,
} from '~/services/storage.server'
import { addWatermark, createWatermarkedMetadata } from '~/services/watermark.server'

/**
 * API response types
 */
interface GenerationSuccessResponse {
  success: true
  jobId: string
  asset?: {
    id: string
    storageUrl: string
    width: number
    height: number
  }
  estimatedTime: number
  creditsRemaining: number
}

interface GenerationErrorResponse {
  success: false
  error: string
  errorCode?: string
}

type GenerationResponse = GenerationSuccessResponse | GenerationErrorResponse

/**
 * Create a JSON response
 */
function jsonResponse(data: GenerationResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Download image from URL to buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Handle image generation request
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
    const prompt = formData.get('prompt')?.toString() || ''
    const style = formData.get('style')?.toString() || 'photorealistic'
    const width = parseInt(
      formData.get('width')?.toString() || String(PREVIEW_RESOLUTION),
      10
    )
    const height = parseInt(
      formData.get('height')?.toString() || String(PREVIEW_RESOLUTION),
      10
    )
    const negativePrompt = formData.get('negativePrompt')?.toString()
    const seed = formData.get('seed')?.toString()
    const isStorybookPreview = formData.get('isStorybookPreview') === 'true'

    // Check if this is print-quality generation
    const isPrintQuality = isPrintResolution(width, height)

    // Validate prompt
    const promptValidation = validatePrompt(prompt)
    if (!promptValidation.isValid) {
      return jsonResponse(
        {
          success: false,
          error: promptValidation.errors.join(', '),
          errorCode: 'INVALID_PROMPT',
        },
        400
      )
    }

    // Validate style
    if (!STYLE_PRESETS[style]) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid style: ${style}. Available styles: ${Object.keys(STYLE_PRESETS).join(', ')}`,
          errorCode: 'INVALID_STYLE',
        },
        400
      )
    }

    // Validate dimensions
    const validDimension = SUPPORTED_DIMENSIONS.some(
      (d) => d.width === width && d.height === height
    )
    if (!validDimension) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid dimensions: ${width}x${height}`,
          errorCode: 'INVALID_DIMENSIONS',
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

    // Get AI provider
    const provider = getPrimaryProvider()
    if (!provider) {
      return jsonResponse(
        {
          success: false,
          error: 'AI generation service unavailable',
          errorCode: 'SERVICE_UNAVAILABLE',
        },
        503
      )
    }

    // Create job record
    const job = await prisma.generationJob.create({
      data: {
        sessionId,
        type: 'IMAGE',
        status: 'PENDING',
        provider: provider.name,
        inputParams: {
          prompt: promptValidation.sanitised,
          style,
          width,
          height,
          negativePrompt,
          seed: seed ? parseInt(seed, 10) : undefined,
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

    // Generate image
    let result = await provider.generateImage({
      prompt: promptValidation.sanitised!,
      style,
      width,
      height,
      negativePrompt,
      seed: seed ? parseInt(seed, 10) : undefined,
    })

    // Try fallback if primary failed
    if (!result.success) {
      const fallback = getFallbackProvider(provider.name)
      if (fallback) {
        result = await fallback.generateImage({
          prompt: promptValidation.sanitised!,
          style,
          width,
          height,
          negativePrompt,
          seed: seed ? parseInt(seed, 10) : undefined,
        })
      }
    }

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

    // Download and store the generated image
    let imageBuffer = await downloadImage(result.imageUrl)

    // Apply watermark if this is a storybook preview
    let assetMetadata: Record<string, unknown> = {
      jobId: job.id,
      prompt: promptValidation.sanitised!,
      style,
      provider: result.provider,
      resolution: String(Math.max(result.width, result.height)),
      isPrintQuality: isPrintQuality ? 'true' : 'false',
    }

    if (isStorybookPreview) {
      imageBuffer = await addWatermark(imageBuffer)
      assetMetadata = createWatermarkedMetadata(assetMetadata)
    }

    const storageKey = generateStorageKey('image/png', 'generated')
    const uploadResult = await uploadFile({
      buffer: imageBuffer,
      key: storageKey,
      contentType: 'image/png',
      metadata: assetMetadata,
    })

    // Calculate retention
    const isAuthenticated = !!userId
    const expiresAt = calculateRetentionExpiry(isAuthenticated, 'generated')

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        sessionId,
        userId,
        source: 'GENERATED',
        assetType: 'IMAGE',
        storageKey: uploadResult.key,
        storageUrl: uploadResult.url,
        mimeType: 'image/png',
        width: result.width,
        height: result.height,
        fileSize: uploadResult.size,
        metadata: {
          ...assetMetadata,
          providerJobId: result.providerJobId,
        },
        status: 'TEMPORARY',
        storageTier: 'HOT',
        expiresAt,
        retentionDays: 7,
      },
    })

    // Update job as completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        providerJobId: result.providerJobId,
        output: {
          assetId: asset.id,
          imageUrl: asset.storageUrl,
          width: result.width,
          height: result.height,
        },
        completedAt: new Date(),
      },
    })

    // Return response with proxy URL instead of direct storage URL
    return jsonResponse({
      success: true,
      jobId: job.id,
      asset: {
        id: asset.id,
        storageUrl: getProxyUrl(asset.id),
        width: asset.width,
        height: asset.height,
      },
      estimatedTime: provider.getEstimatedTime(),
      creditsRemaining: deductResult.newBalance,
    })
  } catch (error) {
    console.error('Generation error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return jsonResponse(
      {
        success: false,
        error: `Generation failed: ${errorMessage}`,
        errorCode: 'INTERNAL_ERROR',
      },
      500
    )
  }
}
