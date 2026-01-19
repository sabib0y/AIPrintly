/**
 * ImageGenerator Component
 *
 * AI image generation UI with style picker, prompt input, and progress display.
 */

import { useState, useCallback } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { CreditBalance } from '~/components/credits/CreditBalance'
import { Wand2, AlertCircle, CheckCircle } from 'lucide-react'

/**
 * Generated asset data
 */
export interface GeneratedAsset {
  id: string
  storageUrl: string
  width: number
  height: number
}

/**
 * Style preset for UI
 */
interface StylePreset {
  id: string
  name: string
  description: string
  previewUrl: string
}

/**
 * Available style presets
 */
const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Lifelike photographs',
    previewUrl: '/images/styles/photorealistic.jpg',
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    description: 'Fun animated style',
    previewUrl: '/images/styles/cartoon.jpg',
  },
  {
    id: 'watercolour',
    name: 'Watercolour',
    description: 'Soft flowing paints',
    previewUrl: '/images/styles/watercolour.jpg',
  },
  {
    id: 'oil_painting',
    name: 'Oil Painting',
    description: 'Classic painting style',
    previewUrl: '/images/styles/oil-painting.jpg',
  },
  {
    id: 'digital_art',
    name: 'Digital Art',
    description: 'Modern illustration',
    previewUrl: '/images/styles/digital-art.jpg',
  },
  {
    id: 'pop_art',
    name: 'Pop Art',
    description: 'Bold colourful design',
    previewUrl: '/images/styles/pop-art.jpg',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean simple shapes',
    previewUrl: '/images/styles/minimalist.jpg',
  },
  {
    id: 'storybook',
    name: 'Storybook',
    description: 'Children\'s illustration',
    previewUrl: '/images/styles/storybook.jpg',
  },
]

/**
 * Supported dimensions
 */
const DIMENSION_OPTIONS = [
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1024x768', label: 'Landscape (1024x768)' },
  { value: '768x1024', label: 'Portrait (768x1024)' },
] as const

/**
 * Minimum prompt length
 */
const MIN_PROMPT_LENGTH = 3

/**
 * Maximum prompt length
 */
const MAX_PROMPT_LENGTH = 2000

/**
 * ImageGenerator props
 */
export interface ImageGeneratorProps {
  /** Callback when generation completes */
  onGenerate: (asset: GeneratedAsset) => void
  /** Callback when an error occurs */
  onError?: (error: string) => void
  /** Initial credit balance */
  initialCredits?: number
  /** Show dimension picker */
  showDimensionPicker?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Generation state
 */
type GenerationState = 'idle' | 'generating' | 'success' | 'error'

/**
 * ImageGenerator - AI image generation UI
 */
export function ImageGenerator({
  onGenerate,
  onError,
  initialCredits,
  showDimensionPicker = false,
  className,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('photorealistic')
  const [dimensions, setDimensions] = useState('1024x1024')
  const [state, setState] = useState<GenerationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | undefined>(initialCredits)
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null)

  /**
   * Check if prompt is valid
   */
  const isPromptValid = prompt.length >= MIN_PROMPT_LENGTH

  /**
   * Handle generation
   */
  const handleGenerate = useCallback(async () => {
    if (!isPromptValid || state === 'generating') return

    setState('generating')
    setError(null)

    try {
      const [width, height] = dimensions.split('x').map(Number)

      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('style', selectedStyle)
      formData.append('width', width.toString())
      formData.append('height', height.toString())

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Generation failed'
        setState('error')
        setError(errorMessage)
        onError?.(errorMessage)
        return
      }

      // Update credits
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining)
      }

      // Set generated asset
      if (data.asset) {
        setGeneratedAsset(data.asset)
        setState('success')
        onGenerate(data.asset)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Generation failed'
      setState('error')
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [prompt, selectedStyle, dimensions, isPromptValid, state, onGenerate, onError])

  /**
   * Reset to generate another
   */
  const handleReset = useCallback(() => {
    setState('idle')
    setPrompt('')
    setError(null)
    setGeneratedAsset(null)
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Credits display */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generate Image</h2>
        <CreditBalance
          variant="compact"
          initialBalance={credits}
          onRefresh={setCredits}
        />
      </div>

      {/* Out of credits warning */}
      {credits === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">You're out of credits</p>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            Create an account or purchase more credits to continue generating.
          </p>
        </div>
      )}

      {/* Success state */}
      {state === 'success' && generatedAsset && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Image generated successfully!</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <img
              src={generatedAsset.storageUrl}
              alt="Generated image"
              className="w-full"
            />
          </div>

          <Button onClick={handleReset} variant="outline" className="w-full">
            Generate Another
          </Button>
        </div>
      )}

      {/* Generation form */}
      {state !== 'success' && (
        <>
          {/* Style picker */}
          <div className="space-y-3">
            <Label>Style</Label>
            <div
              data-testid="style-picker"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  data-testid={`style-${style.id}`}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border-2 p-2 transition-all',
                    selectedStyle === style.id
                      ? 'border-sky-500 ring-2 ring-sky-500'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="aspect-square overflow-hidden rounded bg-gray-100">
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      {style.name}
                    </div>
                  </div>
                  <div className="mt-2 text-left">
                    <p className="text-sm font-medium">{style.name}</p>
                    <p className="text-xs text-gray-500">{style.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt</Label>
              <span className="text-xs text-gray-500">
                {prompt.length} / {MAX_PROMPT_LENGTH}
              </span>
            </div>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image in detail..."
              maxLength={MAX_PROMPT_LENGTH}
              rows={4}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-sky-500',
                'placeholder:text-gray-400',
                prompt.length > 0 && prompt.length < MIN_PROMPT_LENGTH
                  ? 'border-amber-300'
                  : 'border-gray-300'
              )}
            />
            {prompt.length > 0 && prompt.length < MIN_PROMPT_LENGTH && (
              <p className="text-xs text-amber-600">
                Prompt is too short (minimum {MIN_PROMPT_LENGTH} characters)
              </p>
            )}
          </div>

          {/* Dimension picker */}
          {showDimensionPicker && (
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <select
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {DIMENSION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!isPromptValid || state === 'generating' || credits === 0}
            className="w-full"
            size="lg"
          >
            {state === 'generating' ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span role="status">Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Image
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">
            Generation uses 1 credit and typically takes 30-60 seconds.
          </p>
        </>
      )}
    </div>
  )
}

export default ImageGenerator
