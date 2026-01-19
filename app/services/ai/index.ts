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
  buildEnhancedPrompt,
  buildNegativePrompt,
  validatePrompt,
  getAvailableStyles,
  getDimensionLabel,
} from './provider.interface'

// Providers
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

/**
 * Get the preferred AI provider based on configuration and availability
 *
 * @returns The primary available provider, or null if none available
 */
export function getPrimaryProvider() {
  const { getReplicateProvider } = require('./replicate.server')
  const { getOpenAIProvider } = require('./openai.server')

  const preferredProvider = process.env.AI_IMAGE_PROVIDER || 'replicate'

  if (preferredProvider === 'replicate') {
    const replicate = getReplicateProvider()
    if (replicate.isAvailable()) {
      return replicate
    }
  }

  if (preferredProvider === 'openai') {
    const openai = getOpenAIProvider()
    if (openai.isAvailable()) {
      return openai
    }
  }

  // Fallback: try any available provider
  const replicate = getReplicateProvider()
  if (replicate.isAvailable()) {
    return replicate
  }

  const openai = getOpenAIProvider()
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
  const { getReplicateProvider } = require('./replicate.server')
  const { getOpenAIProvider } = require('./openai.server')

  if (primaryProvider !== 'replicate') {
    const replicate = getReplicateProvider()
    if (replicate.isAvailable()) {
      return replicate
    }
  }

  if (primaryProvider !== 'openai') {
    const openai = getOpenAIProvider()
    if (openai.isAvailable()) {
      return openai
    }
  }

  return null
}
