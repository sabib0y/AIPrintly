/**
 * Story Generator Service
 *
 * GPT-4 powered children's story generation with illustration prompts.
 */

/**
 * OpenAI API base URL
 */
const OPENAI_API_BASE = 'https://api.openai.com/v1'

/**
 * Available story themes
 */
export const STORY_THEMES = [
  'adventure',
  'magic',
  'animals',
  'space',
  'friendship',
  'nature',
  'underwater',
  'dinosaurs',
  'fairy_tale',
  'superheroes',
] as const

export type StoryTheme = (typeof STORY_THEMES)[number]

/**
 * Maximum pages per story
 */
export const MAX_PAGES = 20

/**
 * Minimum pages per story
 */
export const MIN_PAGES = 4

/**
 * Story generation request
 */
export interface StoryRequest {
  /** Child's name to feature in the story */
  childName: string
  /** Optional child's age for age-appropriate content */
  childAge?: number
  /** Story theme */
  theme: string
  /** Number of pages */
  pageCount: number
  /** Optional custom elements to include */
  customElements?: string
}

/**
 * Single story page
 */
export interface StoryPage {
  /** Page number (1-indexed) */
  pageNumber: number
  /** Story text for this page */
  text: string
  /** AI generation prompt for the illustration */
  illustrationPrompt: string
}

/**
 * Generated story structure
 */
export interface Story {
  /** Story title */
  title: string
  /** Story pages with text and illustration prompts */
  pages: StoryPage[]
}

/**
 * Story generation result
 */
export type StoryGenerationResult =
  | {
      success: true
      story: Story
    }
  | {
      success: false
      error: string
    }

/**
 * Request validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  return process.env.OPENAI_API_KEY || ''
}

/**
 * Build the system prompt for story generation
 */
function buildSystemPrompt(childAge?: number): string {
  const ageGuidance = childAge
    ? `The story should be appropriate for a ${childAge}-year-old child.`
    : 'The story should be appropriate for children aged 4-8.'

  return `You are a children's book author creating personalised stories.
${ageGuidance}

Your task is to create engaging, age-appropriate stories that:
- Feature the child as the main character
- Have positive messages and happy endings
- Use simple, clear language
- Include vivid descriptions suitable for illustration

For each page, you must provide:
1. The story text (2-4 sentences, simple language)
2. An illustration prompt (detailed description for AI image generation)

The illustration prompts should:
- Be suitable for children's book illustration style
- Describe the scene, characters, and mood
- Include colours and setting details
- Be in the style: "Children's book illustration of..."

Respond with valid JSON in this exact format:
{
  "title": "Story Title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for this page...",
      "illustrationPrompt": "Children's book illustration of..."
    }
  ]
}

IMPORTANT: Only respond with the JSON, no additional text.`
}

/**
 * Build the user prompt for story generation
 */
function buildUserPrompt(request: StoryRequest): string {
  const { childName, childAge, theme, pageCount, customElements } = request

  let prompt = `Create a ${pageCount}-page children's story about ${childName}`

  if (childAge) {
    prompt += ` (age ${childAge})`
  }

  prompt += ` with a ${theme} theme.`

  if (customElements) {
    prompt += ` Include these elements: ${customElements}`
  }

  prompt += `

Generate exactly ${pageCount} pages with engaging text and detailed illustration prompts.
Make ${childName} the hero of the story.
Ensure a clear beginning, middle, and happy ending.`

  return prompt
}

/**
 * Validate a story generation request
 */
export function validateStoryRequest(request: StoryRequest): ValidationResult {
  const errors: string[] = []

  // Check child name
  if (!request.childName || request.childName.trim().length === 0) {
    errors.push('Child name is required')
  } else if (request.childName.length > 50) {
    errors.push('Child name must be 50 characters or less')
  }

  // Check theme
  if (!STORY_THEMES.includes(request.theme as StoryTheme)) {
    errors.push(
      `Invalid theme. Available themes: ${STORY_THEMES.join(', ')}`
    )
  }

  // Check page count
  if (request.pageCount < MIN_PAGES) {
    errors.push(`Page count must be at least ${MIN_PAGES}`)
  } else if (request.pageCount > MAX_PAGES) {
    errors.push(`Page count must be at most ${MAX_PAGES}`)
  }

  // Check child age if provided
  if (request.childAge !== undefined) {
    if (request.childAge < 1 || request.childAge > 18) {
      errors.push('Child age must be between 1 and 18')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Parse and validate story structure from GPT response
 */
export function parseStoryStructure(content: unknown): Story {
  const data = content as {
    title?: string
    pages?: Array<{
      pageNumber?: number
      text?: string
      illustrationPrompt?: string
    }>
  }

  if (!data.title || !Array.isArray(data.pages)) {
    throw new Error('Invalid story structure')
  }

  const pages: StoryPage[] = data.pages.map((page, index) => ({
    pageNumber: page.pageNumber || index + 1,
    text: page.text || '',
    illustrationPrompt:
      page.illustrationPrompt ||
      `Children's book illustration of a scene from the story: ${page.text?.slice(0, 100) || 'a magical moment'}`,
  }))

  return {
    title: data.title,
    pages,
  }
}

/**
 * Extract illustration prompts from a story
 */
export function extractIllustrationPrompts(story: Story): string[] {
  return story.pages.map((page) => page.illustrationPrompt)
}

/**
 * Generate a children's story using GPT-4
 */
export async function generateStory(
  request: StoryRequest
): Promise<StoryGenerationResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  // Validate request
  const validation = validateStoryRequest(request)
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    }
  }

  // Cap page count at maximum
  const cappedRequest = {
    ...request,
    pageCount: Math.min(request.pageCount, MAX_PAGES),
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(request.childAge),
          },
          {
            role: 'user',
            content: buildUserPrompt(cappedRequest),
          },
        ],
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return {
        success: false,
        error: 'No content in API response',
      }
    }

    // Parse JSON response
    let storyData: unknown
    try {
      storyData = JSON.parse(content)
    } catch {
      return {
        success: false,
        error: 'Invalid JSON response from AI',
      }
    }

    // Parse and validate story structure
    try {
      const story = parseStoryStructure(storyData)
      return {
        success: true,
        story,
      }
    } catch (parseError) {
      return {
        success: false,
        error:
          parseError instanceof Error
            ? parseError.message
            : 'Failed to parse story structure',
      }
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Story generation failed',
    }
  }
}

/**
 * Get theme display information
 */
export function getThemeInfo(theme: StoryTheme): {
  name: string
  description: string
  icon: string
} {
  const themeInfo: Record<
    StoryTheme,
    { name: string; description: string; icon: string }
  > = {
    adventure: {
      name: 'Adventure',
      description: 'Exciting journeys and discoveries',
      icon: 'compass',
    },
    magic: {
      name: 'Magic',
      description: 'Spells, wizards, and enchantment',
      icon: 'wand',
    },
    animals: {
      name: 'Animals',
      description: 'Furry friends and animal adventures',
      icon: 'paw',
    },
    space: {
      name: 'Space',
      description: 'Rockets, planets, and the stars',
      icon: 'rocket',
    },
    friendship: {
      name: 'Friendship',
      description: 'Making friends and working together',
      icon: 'heart',
    },
    nature: {
      name: 'Nature',
      description: 'Forests, gardens, and the outdoors',
      icon: 'tree',
    },
    underwater: {
      name: 'Underwater',
      description: 'Ocean adventures and sea creatures',
      icon: 'fish',
    },
    dinosaurs: {
      name: 'Dinosaurs',
      description: 'Prehistoric creatures and adventures',
      icon: 'bone',
    },
    fairy_tale: {
      name: 'Fairy Tale',
      description: 'Princes, princesses, and happily ever after',
      icon: 'crown',
    },
    superheroes: {
      name: 'Superheroes',
      description: 'Powers, capes, and saving the day',
      icon: 'zap',
    },
  }

  return themeInfo[theme]
}

/**
 * Get all available themes with display information
 */
export function getAvailableThemes() {
  return STORY_THEMES.map((theme) => ({
    id: theme,
    ...getThemeInfo(theme),
  }))
}
