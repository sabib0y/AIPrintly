/**
 * AI Provider Interface
 *
 * Abstract interface for AI image generation providers (Replicate, OpenAI).
 * Includes style presets and prompt enhancement utilities.
 */

/**
 * Image generation request parameters
 */
export interface ImageGenerationRequest {
  /** The prompt describing the image to generate */
  prompt: string
  /** Style preset to apply */
  style: string
  /** Output image width */
  width: number
  /** Output image height */
  height: number
  /** Optional negative prompt */
  negativePrompt?: string
  /** Optional seed for reproducibility */
  seed?: number
  /** Number of inference steps (provider-specific) */
  steps?: number
  /** Guidance scale (provider-specific) */
  guidanceScale?: number
}

/**
 * Successful generation result
 */
export interface ImageGenerationSuccess {
  success: true
  /** URL to the generated image */
  imageUrl: string
  /** Generated image width */
  width: number
  /** Generated image height */
  height: number
  /** Provider that generated the image */
  provider: string
  /** Provider's job ID for reference */
  providerJobId?: string
  /** Additional metadata from the provider */
  metadata?: Record<string, unknown>
}

/**
 * Failed generation result
 */
export interface ImageGenerationFailure {
  success: false
  /** Error message */
  error: string
  /** Provider that attempted generation */
  provider: string
  /** Error code if available */
  errorCode?: string
}

/**
 * Combined generation result type
 */
export type ImageGenerationResult =
  | ImageGenerationSuccess
  | ImageGenerationFailure

/**
 * Abstract AI provider interface
 */
export interface AIImageProvider {
  /** Provider name identifier */
  readonly name: string

  /**
   * Check if the provider is available and configured
   */
  isAvailable(): boolean

  /**
   * Generate an image from a prompt
   *
   * @param request - Generation request parameters
   * @returns Generation result (success or failure)
   */
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>

  /**
   * Check the status of a generation job
   *
   * @param jobId - Provider job ID
   * @returns Current status and result if complete
   */
  getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    result?: ImageGenerationResult
    progress?: number
  }>

  /**
   * Get estimated generation time in seconds
   */
  getEstimatedTime(): number
}

/**
 * Style preset definition
 */
export interface StylePreset {
  /** Display name */
  name: string
  /** Description for users */
  description: string
  /** Prefix added to the prompt */
  promptPrefix?: string
  /** Suffix added to the prompt */
  promptSuffix: string
  /** Default negative prompt additions */
  negativePromptSuffix: string
  /** Preview image URL */
  previewUrl: string
  /** Recommended dimensions */
  recommendedDimensions?: { width: number; height: number }
}

/**
 * Available style presets
 */
export const STYLE_PRESETS: Record<string, StylePreset> = {
  photorealistic: {
    name: 'Photorealistic',
    description: 'Lifelike, high-quality photographs',
    promptSuffix:
      ', photorealistic, highly detailed, professional photography, 8k resolution, sharp focus, natural lighting',
    negativePromptSuffix:
      'cartoon, illustration, drawing, painting, low quality, blurry, distorted, deformed, ugly',
    previewUrl: '/images/styles/photorealistic.jpg',
  },
  cartoon: {
    name: 'Cartoon',
    description: 'Fun, animated cartoon style',
    promptPrefix: 'Cartoon style illustration of ',
    promptSuffix:
      ', vibrant colours, clean lines, animated style, Pixar quality, whimsical',
    negativePromptSuffix:
      'photorealistic, photograph, realistic, 3d render, dark, scary, violent',
    previewUrl: '/images/styles/cartoon.jpg',
  },
  watercolour: {
    name: 'Watercolour',
    description: 'Soft, flowing watercolour paintings',
    promptPrefix: 'Watercolour painting of ',
    promptSuffix:
      ', soft colours, flowing paint, artistic brush strokes, delicate, ethereal, traditional watercolour technique',
    negativePromptSuffix:
      'photorealistic, sharp edges, digital art, 3d, harsh colours, neon',
    previewUrl: '/images/styles/watercolour.jpg',
  },
  oil_painting: {
    name: 'Oil Painting',
    description: 'Classic oil painting style',
    promptPrefix: 'Oil painting of ',
    promptSuffix:
      ', rich colours, visible brush strokes, classical painting, museum quality, textured canvas, masterpiece',
    negativePromptSuffix:
      'photorealistic, digital, flat colours, cartoon, modern, minimalist',
    previewUrl: '/images/styles/oil-painting.jpg',
  },
  digital_art: {
    name: 'Digital Art',
    description: 'Modern digital illustration',
    promptSuffix:
      ', digital art, highly detailed, vibrant, trending on artstation, concept art, professional illustration',
    negativePromptSuffix:
      'low quality, amateur, blurry, noisy, watermark, signature',
    previewUrl: '/images/styles/digital-art.jpg',
  },
  pop_art: {
    name: 'Pop Art',
    description: 'Bold, colourful pop art style',
    promptPrefix: 'Pop art style ',
    promptSuffix:
      ', bold colours, halftone dots, comic book style, Andy Warhol inspired, retro, vibrant',
    negativePromptSuffix: 'photorealistic, muted colours, realistic, dark, gloomy',
    previewUrl: '/images/styles/pop-art.jpg',
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Clean, simple minimalist design',
    promptSuffix:
      ', minimalist design, clean lines, simple shapes, negative space, modern, elegant, flat design',
    negativePromptSuffix:
      'complex, detailed, realistic, cluttered, busy, ornate, decorative',
    previewUrl: '/images/styles/minimalist.jpg',
  },
  storybook: {
    name: 'Storybook',
    description: 'Whimsical children\'s book illustration',
    promptPrefix: 'Children\'s book illustration of ',
    promptSuffix:
      ', whimsical, magical, soft colours, enchanting, fairy tale style, gentle, friendly, suitable for children',
    negativePromptSuffix:
      'scary, dark, violent, realistic, adult themes, complex, detailed',
    previewUrl: '/images/styles/storybook.jpg',
  },
  vintage: {
    name: 'Vintage',
    description: 'Nostalgic retro aesthetic',
    promptSuffix:
      ', vintage style, retro, nostalgic, sepia tones, aged look, classic, 1950s aesthetic',
    negativePromptSuffix: 'modern, futuristic, digital, neon, bright colours',
    previewUrl: '/images/styles/vintage.jpg',
  },
  anime: {
    name: 'Anime',
    description: 'Japanese anime art style',
    promptPrefix: 'Anime style ',
    promptSuffix:
      ', anime art style, vibrant colours, expressive, manga inspired, detailed, studio quality',
    negativePromptSuffix:
      'photorealistic, western cartoon, 3d render, low quality, deformed',
    previewUrl: '/images/styles/anime.jpg',
  },
}

/**
 * Build an enhanced prompt with style modifications
 *
 * @param basePrompt - User's original prompt
 * @param style - Style preset key
 * @returns Enhanced prompt with style modifications
 */
export function buildEnhancedPrompt(basePrompt: string, style: string): string {
  const preset = STYLE_PRESETS[style]
  if (!preset) {
    return basePrompt
  }

  const prefix = preset.promptPrefix || ''
  const suffix = preset.promptSuffix

  return `${prefix}${basePrompt}${suffix}`
}

/**
 * Build a negative prompt combining user input with style defaults
 *
 * @param userNegative - User's negative prompt (optional)
 * @param style - Style preset key
 * @returns Combined negative prompt
 */
export function buildNegativePrompt(
  userNegative: string | undefined,
  style: string
): string {
  const preset = STYLE_PRESETS[style]
  const styleSuffix = preset?.negativePromptSuffix || ''

  if (!userNegative) {
    return styleSuffix
  }

  return `${userNegative}, ${styleSuffix}`
}

/**
 * Prompt validation result
 */
export interface PromptValidationResult {
  /** Whether the prompt is valid */
  isValid: boolean
  /** Validation errors */
  errors: string[]
  /** Sanitised prompt */
  sanitised?: string
}

/** Minimum prompt length */
const MIN_PROMPT_LENGTH = 3

/** Maximum prompt length */
const MAX_PROMPT_LENGTH = 2000

/**
 * Validate and sanitise a prompt
 *
 * @param prompt - User's prompt
 * @returns Validation result with sanitised prompt
 */
export function validatePrompt(prompt: string): PromptValidationResult {
  const errors: string[] = []

  // Check for empty prompt
  if (!prompt || prompt.trim().length === 0) {
    return {
      isValid: false,
      errors: ['Prompt cannot be empty'],
    }
  }

  const trimmed = prompt.trim()

  // Check minimum length
  if (trimmed.length < MIN_PROMPT_LENGTH) {
    errors.push(`Prompt is too short (minimum ${MIN_PROMPT_LENGTH} characters)`)
  }

  // Check maximum length
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    errors.push(`Prompt is too long (maximum ${MAX_PROMPT_LENGTH} characters)`)
  }

  // Sanitise: remove potentially harmful content
  let sanitised = trimmed
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injections
    .replace(/javascript:/gi, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim again after sanitisation
    .trim()

  return {
    isValid: errors.length === 0,
    errors,
    sanitised,
  }
}

/**
 * Style option for UI display
 */
export interface StyleOption {
  /** Style preset key */
  id: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Preview image URL */
  previewUrl: string
}

/**
 * Get available styles for UI display
 *
 * @returns Array of style options
 */
export function getAvailableStyles(): StyleOption[] {
  return Object.entries(STYLE_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    description: preset.description,
    previewUrl: preset.previewUrl,
  }))
}

/**
 * Preview resolution (low-res for user preview)
 * Cost: ~25% of print resolution
 */
export const PREVIEW_RESOLUTION = 1024

/**
 * Print resolution (high-res for final products)
 * Only generated after payment
 */
export const PRINT_RESOLUTION = 2048

/**
 * Default generation parameters
 */
export const DEFAULT_GENERATION_PARAMS = {
  width: PREVIEW_RESOLUTION,
  height: PREVIEW_RESOLUTION,
  steps: 30,
  guidanceScale: 7.5,
}

/**
 * Supported image dimensions
 */
export const SUPPORTED_DIMENSIONS = [
  { width: 512, height: 512, label: 'Square (512x512)' },
  { width: 768, height: 768, label: 'Square (768x768)' },
  { width: 1024, height: 1024, label: 'Square (1024x1024) - Preview' },
  { width: 768, height: 1024, label: 'Portrait (768x1024)' },
  { width: 1024, height: 768, label: 'Landscape (1024x768)' },
  { width: 512, height: 768, label: 'Portrait (512x768)' },
  { width: 768, height: 512, label: 'Landscape (768x512)' },
  { width: 2048, height: 2048, label: 'Square (2048x2048) - Print Quality' },
] as const

/**
 * Get dimension option by width and height
 */
export function getDimensionLabel(width: number, height: number): string {
  const dimension = SUPPORTED_DIMENSIONS.find(
    (d) => d.width === width && d.height === height
  )
  return dimension?.label || `${width}x${height}`
}

/**
 * Get resolution dimensions for a given resolution type
 *
 * @param resolution - Resolution type ('preview' or 'print')
 * @param aspectRatio - Optional aspect ratio (width/height), defaults to 1 (square)
 * @returns Dimensions object with width and height
 */
export function getResolutionDimensions(
  resolution: 'preview' | 'print' = 'preview',
  aspectRatio: number = 1
): { width: number; height: number } {
  const maxDimension = resolution === 'print' ? PRINT_RESOLUTION : PREVIEW_RESOLUTION

  if (aspectRatio === 1) {
    return { width: maxDimension, height: maxDimension }
  }

  if (aspectRatio > 1) {
    // Landscape
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    }
  }

  // Portrait
  return {
    width: Math.round(maxDimension * aspectRatio),
    height: maxDimension,
  }
}

/**
 * Check if dimensions match preview resolution
 *
 * @param width - Image width
 * @param height - Image height
 * @returns True if dimensions match preview resolution
 */
export function isPreviewResolution(width: number, height: number): boolean {
  return width === PREVIEW_RESOLUTION && height === PREVIEW_RESOLUTION
}

/**
 * Check if dimensions match print resolution
 *
 * @param width - Image width
 * @param height - Image height
 * @returns True if dimensions match print resolution
 */
export function isPrintResolution(width: number, height: number): boolean {
  return width === PRINT_RESOLUTION && height === PRINT_RESOLUTION
}
