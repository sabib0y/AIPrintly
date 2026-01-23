/**
 * Replicate Provider
 *
 * AI image generation using Replicate's SDXL model.
 * Implements the AIImageProvider interface for consistent generation behaviour.
 */

import type {
  AIImageProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from './provider.interface'
import {
  buildEnhancedPrompt,
  buildNegativePrompt,
  DEFAULT_GENERATION_PARAMS,
} from './provider.interface'

/**
 * Replicate API base URL
 */
const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

/**
 * SDXL model version on Replicate
 */
const SDXL_MODEL_VERSION =
  'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'

/**
 * Maximum time to wait for prediction (5 minutes)
 */
const MAX_WAIT_TIME_MS = 5 * 60 * 1000

/**
 * Polling interval for status checks (2 seconds)
 */
const POLL_INTERVAL_MS = 2000

/**
 * Replicate prediction status
 */
type PredictionStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'

/**
 * Replicate prediction response
 */
interface PredictionResponse {
  id: string
  status: PredictionStatus
  output?: string[]
  error?: string
  logs?: string
  created_at?: string
  completed_at?: string
}

/**
 * Get Replicate API token from environment
 */
function getApiToken(): string {
  return process.env.REPLICATE_API_TOKEN || ''
}

/**
 * Replicate SDXL provider implementation
 */
export class ReplicateProvider implements AIImageProvider {
  readonly name = 'replicate'
  private lastRequestWidth?: number
  private lastRequestHeight?: number

  /**
   * Check if Replicate is available and configured
   */
  isAvailable(): boolean {
    return Boolean(getApiToken())
  }

  /**
   * Generate an image using SDXL on Replicate
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResult> {
    const apiToken = getApiToken()

    if (!apiToken) {
      return {
        success: false,
        error: 'Replicate API token not configured',
        provider: this.name,
        errorCode: 'NOT_CONFIGURED',
      }
    }

    try {
      // Store dimensions for later use
      this.lastRequestWidth = request.width
      this.lastRequestHeight = request.height

      // Build enhanced prompt with style
      const enhancedPrompt = buildEnhancedPrompt(request.prompt, request.style)
      const negativePrompt = buildNegativePrompt(
        request.negativePrompt,
        request.style
      )

      // Create prediction
      const prediction = await this.createPrediction(
        apiToken,
        enhancedPrompt,
        negativePrompt,
        request
      )

      if (!prediction) {
        return {
          success: false,
          error: 'Failed to create prediction',
          provider: this.name,
        }
      }

      // Poll for result
      const result = await this.waitForPrediction(apiToken, prediction.id)

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: `Network error: ${errorMessage}`,
        provider: this.name,
      }
    }
  }

  /**
   * Create a new prediction on Replicate
   */
  private async createPrediction(
    apiToken: string,
    prompt: string,
    negativePrompt: string,
    request: ImageGenerationRequest
  ): Promise<PredictionResponse | null> {
    const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: SDXL_MODEL_VERSION.split(':')[1],
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width: request.width || DEFAULT_GENERATION_PARAMS.width,
          height: request.height || DEFAULT_GENERATION_PARAMS.height,
          num_inference_steps: request.steps || DEFAULT_GENERATION_PARAMS.steps,
          guidance_scale:
            request.guidanceScale || DEFAULT_GENERATION_PARAMS.guidanceScale,
          seed: request.seed,
          num_outputs: 1,
          scheduler: 'K_EULER',
          refine: 'expert_ensemble_refiner',
          refine_steps: 10,
          high_noise_frac: 0.8,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Replicate API error:', errorData)
      return null
    }

    return response.json()
  }

  /**
   * Poll for prediction completion
   */
  private async waitForPrediction(
    apiToken: string,
    predictionId: string
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_WAIT_TIME_MS) {
      const status = await this.getPredictionStatus(apiToken, predictionId)

      switch (status.status) {
        case 'succeeded':
          if (status.output && status.output.length > 0) {
            return {
              success: true,
              imageUrl: status.output[0],
              width: this.lastRequestWidth || DEFAULT_GENERATION_PARAMS.width,
              height: this.lastRequestHeight || DEFAULT_GENERATION_PARAMS.height,
              provider: this.name,
              providerJobId: predictionId,
              metadata: {
                completedAt: status.completed_at,
              },
            }
          }
          return {
            success: false,
            error: 'Prediction succeeded but no output found',
            provider: this.name,
          }

        case 'failed':
          return {
            success: false,
            error: status.error || 'Prediction failed',
            provider: this.name,
          }

        case 'canceled':
          return {
            success: false,
            error: 'Prediction was cancelled',
            provider: this.name,
          }

        case 'starting':
        case 'processing':
          // Continue polling
          await this.sleep(POLL_INTERVAL_MS)
          break
      }
    }

    // Timeout
    return {
      success: false,
      error: 'Generation timeout - please try again',
      provider: this.name,
      errorCode: 'TIMEOUT',
    }
  }

  /**
   * Get the status of a prediction
   */
  private async getPredictionStatus(
    apiToken: string,
    predictionId: string
  ): Promise<PredictionResponse> {
    const response = await fetch(
      `${REPLICATE_API_BASE}/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${apiToken}`,
        },
      }
    )

    return response.json()
  }

  /**
   * Check the status of a generation job
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    result?: ImageGenerationResult
    progress?: number
  }> {
    const apiToken = getApiToken()

    if (!apiToken) {
      return {
        status: 'failed',
        result: {
          success: false,
          error: 'API token not configured',
          provider: this.name,
        },
      }
    }

    const prediction = await this.getPredictionStatus(apiToken, jobId)

    switch (prediction.status) {
      case 'starting':
        return { status: 'pending' }

      case 'processing':
        return {
          status: 'processing',
          progress: this.parseProgress(prediction.logs),
        }

      case 'succeeded':
        return {
          status: 'completed',
          result: {
            success: true,
            imageUrl: prediction.output?.[0] || '',
            width: this.lastRequestWidth || DEFAULT_GENERATION_PARAMS.width,
            height: this.lastRequestHeight || DEFAULT_GENERATION_PARAMS.height,
            provider: this.name,
            providerJobId: jobId,
          },
        }

      case 'failed':
      case 'canceled':
        return {
          status: 'failed',
          result: {
            success: false,
            error: prediction.error || 'Generation failed',
            provider: this.name,
          },
        }

      default:
        return { status: 'pending' }
    }
  }

  /**
   * Get estimated generation time in seconds
   */
  getEstimatedTime(): number {
    // SDXL typically takes 20-60 seconds
    return 45
  }

  /**
   * Parse progress from Replicate logs
   */
  private parseProgress(logs?: string): number | undefined {
    if (!logs) return undefined

    // Look for percentage in logs
    const match = logs.match(/(\d+)%/)
    if (match) {
      return parseInt(match[1], 10)
    }

    return undefined
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Singleton instance
 */
let instance: ReplicateProvider | null = null

/**
 * Get Replicate provider instance
 */
export function getReplicateProvider(): ReplicateProvider {
  if (!instance) {
    instance = new ReplicateProvider()
  }
  return instance
}
