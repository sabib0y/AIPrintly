/**
 * Story Generator Service Tests
 *
 * Tests for GPT-4 powered children's story generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Set environment variables before imports
beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Story Generator Service', () => {
  describe('generateStory', () => {
    it('should generate a story with pages and illustration prompts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'The Magical Garden',
                    pages: [
                      {
                        pageNumber: 1,
                        text: 'Once upon a time, there was a little girl named Emma.',
                        illustrationPrompt:
                          'A cheerful young girl with brown hair standing in a sunny garden',
                      },
                      {
                        pageNumber: 2,
                        text: 'She discovered a magical flower that could grant wishes.',
                        illustrationPrompt:
                          'A glowing rainbow flower in the center of the garden',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Emma',
        theme: 'magic',
        pageCount: 2,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.story.title).toBe('The Magical Garden')
        expect(result.story.pages).toHaveLength(2)
        expect(result.story.pages[0].illustrationPrompt).toBeDefined()
      }
    })

    it('should include child name in the story', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: "Oliver's Adventure",
                    pages: [
                      {
                        pageNumber: 1,
                        text: 'Oliver was an adventurous boy.',
                        illustrationPrompt: 'A brave boy named Oliver',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Oliver',
        theme: 'adventure',
        pageCount: 1,
      })

      if (result.success) {
        expect(result.story.title).toContain('Oliver')
      }
    })

    it('should support different themes', async () => {
      const { STORY_THEMES } = await import('../story-generator.server')

      expect(STORY_THEMES).toContain('adventure')
      expect(STORY_THEMES).toContain('magic')
      expect(STORY_THEMES).toContain('animals')
      expect(STORY_THEMES).toContain('space')
      expect(STORY_THEMES).toContain('friendship')
    })

    it('should include child age in generation if provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'Test Story',
                    pages: [{ pageNumber: 1, text: 'Story text', illustrationPrompt: 'prompt' }],
                  }),
                },
              },
            ],
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      await generateStory({
        childName: 'Sophie',
        childAge: 5,
        theme: 'animals',
        pageCount: 1,
      })

      // Check that the API was called with age-appropriate prompt
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)

      expect(body.messages[0].content).toContain('5')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Internal server error',
            },
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Test',
        theme: 'magic',
        pageCount: 2,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'This is not valid JSON',
                },
              },
            ],
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Test',
        theme: 'magic',
        pageCount: 2,
      })

      expect(result.success).toBe(false)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Test',
        theme: 'adventure',
        pageCount: 2,
      })

      expect(result.success).toBe(false)
    })

    it('should limit page count to maximum', async () => {
      const { MAX_PAGES } = await import('../story-generator.server')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'Test',
                    pages: Array(MAX_PAGES)
                      .fill(null)
                      .map((_, i) => ({
                        pageNumber: i + 1,
                        text: `Page ${i + 1}`,
                        illustrationPrompt: `Illustration ${i + 1}`,
                      })),
                  }),
                },
              },
            ],
          }),
      })

      const { generateStory } = await import('../story-generator.server')

      const result = await generateStory({
        childName: 'Test',
        theme: 'magic',
        pageCount: 100, // Request more than max
      })

      if (result.success) {
        expect(result.story.pages.length).toBeLessThanOrEqual(MAX_PAGES)
      }
    })
  })

  describe('parseStoryStructure', () => {
    it('should extract pages with illustration prompts', async () => {
      const { parseStoryStructure } = await import('../story-generator.server')

      const storyContent = {
        title: 'Test Story',
        pages: [
          {
            pageNumber: 1,
            text: 'Page 1 text',
            illustrationPrompt: 'Illustration 1',
          },
          {
            pageNumber: 2,
            text: 'Page 2 text',
            illustrationPrompt: 'Illustration 2',
          },
        ],
      }

      const result = parseStoryStructure(storyContent)

      expect(result.title).toBe('Test Story')
      expect(result.pages).toHaveLength(2)
      expect(result.pages[0].illustrationPrompt).toBe('Illustration 1')
    })

    it('should handle missing illustration prompts', async () => {
      const { parseStoryStructure } = await import('../story-generator.server')

      const storyContent = {
        title: 'Test Story',
        pages: [
          {
            pageNumber: 1,
            text: 'Page 1 text',
            // No illustration prompt
          },
        ],
      }

      const result = parseStoryStructure(storyContent)

      // Should generate a default prompt from the text
      expect(result.pages[0].illustrationPrompt).toBeDefined()
    })
  })

  describe('extractIllustrationPrompts', () => {
    it('should extract all illustration prompts from a story', async () => {
      const { extractIllustrationPrompts } = await import(
        '../story-generator.server'
      )

      const story = {
        title: 'Test',
        pages: [
          { pageNumber: 1, text: 'Text 1', illustrationPrompt: 'Prompt 1' },
          { pageNumber: 2, text: 'Text 2', illustrationPrompt: 'Prompt 2' },
          { pageNumber: 3, text: 'Text 3', illustrationPrompt: 'Prompt 3' },
        ],
      }

      const prompts = extractIllustrationPrompts(story)

      expect(prompts).toHaveLength(3)
      expect(prompts).toEqual(['Prompt 1', 'Prompt 2', 'Prompt 3'])
    })
  })

  describe('validateStoryRequest', () => {
    it('should accept valid story requests', async () => {
      const { validateStoryRequest } = await import('../story-generator.server')

      const result = validateStoryRequest({
        childName: 'Emma',
        theme: 'magic',
        pageCount: 8,
      })

      expect(result.isValid).toBe(true)
    })

    it('should reject empty child name', async () => {
      const { validateStoryRequest } = await import('../story-generator.server')

      const result = validateStoryRequest({
        childName: '',
        theme: 'magic',
        pageCount: 8,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('name'))
    })

    it('should reject invalid themes', async () => {
      const { validateStoryRequest } = await import('../story-generator.server')

      const result = validateStoryRequest({
        childName: 'Test',
        theme: 'invalid_theme',
        pageCount: 8,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('theme'))
    })

    it('should reject invalid page counts', async () => {
      const { validateStoryRequest } = await import('../story-generator.server')

      const result = validateStoryRequest({
        childName: 'Test',
        theme: 'magic',
        pageCount: 0,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('page'))
    })
  })
})
