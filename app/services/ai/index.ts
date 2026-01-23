/**
 * AI Services Index
 *
 * Re-exports all AI-related services and utilities.
 */

// Provider interface and utilities
export {
  type AIImageProvider,
  type ImageGenerationRequest,
  type ImageGenerationResult,
  type ImageGenerationSuccess,
  type ImageGenerationFailure,
  type StylePreset,
  type StyleOption,
  type PromptValidationResult,
  STYLE_PRESETS,
  DEFAULT_GENERATION_PARAMS,
  SUPPORTED_DIMENSIONS,
  PREVIEW_RESOLUTION,
  PRINT_RESOLUTION,
  buildEnhancedPrompt,
  buildNegativePrompt,
  validatePrompt,
  getAvailableStyles,
  getDimensionLabel,
  getResolutionDimensions,
  isPreviewResolution,
  isPrintResolution,
} from './provider.interface'

// Import providers for internal use
import { getReplicateProvider as _getReplicateProvider } from './replicate.server'
import { getOpenAIProvider as _getOpenAIProvider } from './openai.server'

// Re-export providers
export { ReplicateProvider, getReplicateProvider } from './replicate.server'
export { OpenAIProvider, getOpenAIProvider } from './openai.server'

// Story generator
export {
  generateStory,
  validateStoryRequest,
  parseStoryStructure,
  extractIllustrationPrompts,
  getThemeInfo,
  getAvailableThemes,
  STORY_THEMES,
  MAX_PAGES,
  MIN_PAGES,
  type StoryTheme,
  type StoryRequest,
  type StoryPage,
  type Story,
  type StoryGenerationResult,
} from './story-generator.server'

// Print quality generation
export {
  generatePrintQuality,
  batchGeneratePrintQuality,
} from './print-quality.server'

/**
 * Get the preferred AI provider based on configuration and availability
 *
 * @returns The primary available provider, or null if none available
 */
export function getPrimaryProvider() {
  const preferredProvider = process.env.AI_IMAGE_PROVIDER || 'replicate'

  if (preferredProvider === 'replicate') {
    const replicate = _getReplicateProvider()
    if (replicate.isAvailable()) {
      return replicate
    }
  }

  if (preferredProvider === 'openai') {
    const openai = _getOpenAIProvider()
    if (openai.isAvailable()) {
      return openai
    }
  }

  // Fallback: try any available provider
  const replicate = _getReplicateProvider()
  if (replicate.isAvailable()) {
    return replicate
  }

  const openai = _getOpenAIProvider()
  if (openai.isAvailable()) {
    return openai
  }

  return null
}

/**
 * Get fallback provider when primary fails
 *
 * @param primaryProvider - The provider that failed
 * @returns A different available provider, or null
 */
export function getFallbackProvider(primaryProvider: string) {
  if (primaryProvider !== 'replicate') {
    const replicate = _getReplicateProvider()
    if (replicate.isAvailable()) {
      return replicate
    }
  }

  if (primaryProvider !== 'openai') {
    const openai = _getOpenAIProvider()
    if (openai.isAvailable()) {
      return openai
    }
  }

  return null
}
