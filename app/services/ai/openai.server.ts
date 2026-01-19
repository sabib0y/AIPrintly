/**
 * OpenAI Provider
 *
 * AI image generation using OpenAI's DALL-E 3 model.
 * Used as a fallback when Replicate is unavailable.
 */

import type {
  AIImageProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from './provider.interface'
import { buildEnhancedPrompt } from './provider.interface'

/**
 * OpenAI API base URL
 */
const OPENAI_API_BASE = 'https://api.openai.com/v1'

/**
 * Supported DALL-E 3 sizes
 */
type DallESize = '1024x1024' | '1792x1024' | '1024x1792'

/**
 * OpenAI image generation response
 */
interface OpenAIImageResponse {
  data: Array<{
    url: string
    revised_prompt?: string
    b64_json?: string
  }>
}

/**
 * OpenAI error response
 */
interface OpenAIErrorResponse {
  error: {
    message: string
    type: string
    code?: string
  }
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  return process.env.OPENAI_API_KEY || ''
}

/**
 * Map requested dimensions to supported DALL-E sizes
 */
function mapToDallESize(width: number, height: number): DallESize {
  const ratio = width / height

  // Landscape
  if (ratio > 1.5) {
    return '1792x1024'
  }
  // Portrait
  if (ratio < 0.67) {
    return '1024x1792'
  }
  // Square or near-square
  return '1024x1024'
}

/**
 * Parse dimensions from DALL-E size string
 */
function parseDallESize(size: DallESize): { width: number; height: number } {
  const [width, height] = size.split('x').map(Number)
  return { width, height }
}

/**
 * OpenAI DALL-E provider implementation
 */
export class OpenAIProvider implements AIImageProvider {
  readonly name = 'openai'

  /**
   * Check if OpenAI is available and configured
   */
  isAvailable(): boolean {
    return Boolean(getApiKey())
  }

  /**
   * Generate an image using DALL-E 3
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResult> {
    const apiKey = getApiKey()

    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
        provider: this.name,
        errorCode: 'NOT_CONFIGURED',
      }
    }

    try {
      // Build enhanced prompt with style
      const enhancedPrompt = buildEnhancedPrompt(request.prompt, request.style)

      // Map dimensions to supported sizes
      const size = mapToDallESize(request.width, request.height)
      const dimensions = parseDallESize(size)

      // Make API request
      const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality: 'standard',
          response_format: 'url',
        }),
      })

      if (!response.ok) {
        const errorData: OpenAIErrorResponse = await response.json()
        return this.handleErrorResponse(response.status, errorData)
      }

      const data: OpenAIImageResponse = await response.json()

      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: 'No image generated',
          provider: this.name,
        }
      }

      const imageData = data.data[0]

      return {
        success: true,
        imageUrl: imageData.url,
        width: dimensions.width,
        height: dimensions.height,
        provider: this.name,
        metadata: {
          revisedPrompt: imageData.revised_prompt,
          model: 'dall-e-3',
          size,
        },
      }
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
   * Handle API error responses
   */
  private handleErrorResponse(
    status: number,
    errorData: OpenAIErrorResponse
  ): ImageGenerationResult {
    const { error } = errorData

    // Handle specific error types
    if (error.code === 'content_policy_violation') {
      return {
        success: false,
        error:
          'Your request was rejected due to content policy. Please modify your prompt.',
        provider: this.name,
        errorCode: 'CONTENT_POLICY',
      }
    }

    if (status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again in a few moments.',
        provider: this.name,
        errorCode: 'RATE_LIMIT',
      }
    }

    if (status === 401) {
      return {
        success: false,
        error: 'Authentication failed',
        provider: this.name,
        errorCode: 'AUTH_FAILED',
      }
    }

    return {
      success: false,
      error: error.message || 'Generation failed',
      provider: this.name,
    }
  }

  /**
   * Check the status of a generation job
   *
   * Note: OpenAI's API is synchronous, so this always returns completed/failed
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    result?: ImageGenerationResult
    progress?: number
  }> {
    // OpenAI API is synchronous - jobs don't have statuses
    // This method exists for interface compatibility
    return {
      status: 'completed',
      result: {
        success: false,
        error: 'OpenAI jobs are synchronous - use generateImage directly',
        provider: this.name,
      },
    }
  }

  /**
   * Get estimated generation time in seconds
   */
  getEstimatedTime(): number {
    // DALL-E 3 typically takes 10-30 seconds
    return 20
  }
}

/**
 * Singleton instance
 */
let instance: OpenAIProvider | null = null

/**
 * Get OpenAI provider instance
 */
export function getOpenAIProvider(): OpenAIProvider {
  if (!instance) {
    instance = new OpenAIProvider()
  }
  return instance
}
