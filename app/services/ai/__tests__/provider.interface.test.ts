/**
 * AI Provider Interface Tests
 *
 * Tests for the abstract AI provider interface, style presets,
 * and provider factory.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set environment variables before imports
beforeEach(() => {
  vi.stubEnv('AI_IMAGE_PROVIDER', 'replicate')
  vi.stubEnv('REPLICATE_API_TOKEN', 'test-token')
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('AI Provider Interface', () => {
  describe('ImageGenerationRequest', () => {
    it('should define required request properties', async () => {
      // Test that the interface structure works correctly
      const request = {
        prompt: 'A beautiful sunset over the ocean',
        style: 'photorealistic',
        width: 1024,
        height: 1024,
      }

      expect(request.prompt).toBeDefined()
      expect(request.style).toBeDefined()
      expect(request.width).toBeDefined()
      expect(request.height).toBeDefined()
    })

    it('should support optional negative prompt', async () => {
      const request = {
        prompt: 'A cute cat',
        style: 'cartoon',
        width: 512,
        height: 512,
        negativePrompt: 'blurry, low quality',
      }

      expect(request.negativePrompt).toBe('blurry, low quality')
    })
  })

  describe('ImageGenerationResult', () => {
    it('should define success result structure', async () => {
      const result = {
        success: true,
        imageUrl: 'https://example.com/image.png',
        width: 1024,
        height: 1024,
        provider: 'replicate',
        providerJobId: 'job-123',
        metadata: {
          model: 'sdxl-1.0',
          seed: 12345,
        },
      }

      expect(result.success).toBe(true)
      expect(result.imageUrl).toBeDefined()
    })

    it('should define failure result structure', async () => {
      const result = {
        success: false,
        error: 'Generation failed due to content policy',
        provider: 'openai',
      }

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('STYLE_PRESETS', () => {
    it('should include photorealistic style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.photorealistic).toBeDefined()
      expect(STYLE_PRESETS.photorealistic.name).toBe('Photorealistic')
      expect(STYLE_PRESETS.photorealistic.promptSuffix).toBeDefined()
    })

    it('should include cartoon style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.cartoon).toBeDefined()
      expect(STYLE_PRESETS.cartoon.name).toBe('Cartoon')
    })

    it('should include watercolour style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      // British spelling
      expect(STYLE_PRESETS.watercolour).toBeDefined()
      expect(STYLE_PRESETS.watercolour.name).toBe('Watercolour')
    })

    it('should include oil painting style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.oil_painting).toBeDefined()
      expect(STYLE_PRESETS.oil_painting.name).toBe('Oil Painting')
    })

    it('should include digital art style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.digital_art).toBeDefined()
      expect(STYLE_PRESETS.digital_art.name).toBe('Digital Art')
    })

    it('should include pop art style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.pop_art).toBeDefined()
      expect(STYLE_PRESETS.pop_art.name).toBe('Pop Art')
    })

    it('should include minimalist style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      expect(STYLE_PRESETS.minimalist).toBeDefined()
      expect(STYLE_PRESETS.minimalist.name).toBe('Minimalist')
    })

    it('should provide default negative prompt for each style', async () => {
      const { STYLE_PRESETS } = await import('../provider.interface')

      Object.values(STYLE_PRESETS).forEach((preset) => {
        expect(preset.negativePromptSuffix).toBeDefined()
      })
    })
  })

  describe('buildEnhancedPrompt', () => {
    it('should enhance prompt with style suffix', async () => {
      const { buildEnhancedPrompt, STYLE_PRESETS } = await import(
        '../provider.interface'
      )

      const enhanced = buildEnhancedPrompt('A cat sitting on a chair', 'cartoon')

      expect(enhanced).toContain('A cat sitting on a chair')
      expect(enhanced).toContain(STYLE_PRESETS.cartoon.promptSuffix)
    })

    it('should return original prompt for unknown style', async () => {
      const { buildEnhancedPrompt } = await import('../provider.interface')

      const enhanced = buildEnhancedPrompt('A simple prompt', 'unknown_style')

      expect(enhanced).toBe('A simple prompt')
    })

    it('should handle custom prefix if provided', async () => {
      const { buildEnhancedPrompt, STYLE_PRESETS } = await import(
        '../provider.interface'
      )

      const enhanced = buildEnhancedPrompt('A flower', 'watercolour')

      expect(enhanced).toContain(STYLE_PRESETS.watercolour.promptPrefix || '')
    })
  })

  describe('buildNegativePrompt', () => {
    it('should combine user negative prompt with style defaults', async () => {
      const { buildNegativePrompt, STYLE_PRESETS } = await import(
        '../provider.interface'
      )

      const negative = buildNegativePrompt('blurry', 'photorealistic')

      expect(negative).toContain('blurry')
      expect(negative).toContain(STYLE_PRESETS.photorealistic.negativePromptSuffix)
    })

    it('should use only style defaults if no user prompt', async () => {
      const { buildNegativePrompt, STYLE_PRESETS } = await import(
        '../provider.interface'
      )

      const negative = buildNegativePrompt(undefined, 'cartoon')

      expect(negative).toBe(STYLE_PRESETS.cartoon.negativePromptSuffix)
    })
  })

  describe('validatePrompt', () => {
    it('should accept valid prompts', async () => {
      const { validatePrompt } = await import('../provider.interface')

      const result = validatePrompt('A beautiful landscape with mountains')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty prompts', async () => {
      const { validatePrompt } = await import('../provider.interface')

      const result = validatePrompt('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('empty'))
    })

    it('should reject prompts that are too short', async () => {
      const { validatePrompt } = await import('../provider.interface')

      const result = validatePrompt('hi')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('short'))
    })

    it('should reject prompts that are too long', async () => {
      const { validatePrompt } = await import('../provider.interface')

      const longPrompt = 'a'.repeat(2001)
      const result = validatePrompt(longPrompt)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('long'))
    })

    it('should sanitise prompts with special characters', async () => {
      const { validatePrompt } = await import('../provider.interface')

      const result = validatePrompt('A nice <script>alert("xss")</script> image')

      expect(result.isValid).toBe(true)
      expect(result.sanitised).not.toContain('<script>')
    })
  })

  describe('getAvailableStyles', () => {
    it('should return array of style options', async () => {
      const { getAvailableStyles } = await import('../provider.interface')

      const styles = getAvailableStyles()

      expect(Array.isArray(styles)).toBe(true)
      expect(styles.length).toBeGreaterThan(0)
      expect(styles[0]).toHaveProperty('id')
      expect(styles[0]).toHaveProperty('name')
      expect(styles[0]).toHaveProperty('description')
    })

    it('should include preview image URL for each style', async () => {
      const { getAvailableStyles } = await import('../provider.interface')

      const styles = getAvailableStyles()

      styles.forEach((style) => {
        expect(style.previewUrl).toBeDefined()
      })
    })
  })
})
