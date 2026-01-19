/**
 * ImageGenerator Component Tests
 *
 * Tests for the AI image generation UI with style picker and prompt input.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageGenerator } from '../ImageGenerator'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ImageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          jobId: 'job-123',
          asset: {
            id: 'asset-123',
            storageUrl: 'https://cdn.example.com/generated.jpg',
            width: 1024,
            height: 1024,
          },
          estimatedTime: 45,
          creditsRemaining: 4,
        }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render prompt input', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      expect(
        screen.getByPlaceholderText(/describe your image/i)
      ).toBeInTheDocument()
    })

    it('should render style picker', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      expect(screen.getByTestId('style-picker')).toBeInTheDocument()
    })

    it('should render generate button', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      expect(
        screen.getByRole('button', { name: /generate/i })
      ).toBeInTheDocument()
    })

    it('should show available styles', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      expect(screen.getByText('Photorealistic')).toBeInTheDocument()
      expect(screen.getByText('Cartoon')).toBeInTheDocument()
      expect(screen.getByText('Watercolour')).toBeInTheDocument()
    })
  })

  describe('Style Selection', () => {
    it('should allow selecting a style', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const cartoonStyle = screen.getByTestId('style-cartoon')
      await user.click(cartoonStyle)

      expect(cartoonStyle).toHaveClass('ring-2')
    })

    it('should have photorealistic as default style', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const photorealistic = screen.getByTestId('style-photorealistic')
      expect(photorealistic).toHaveClass('ring-2')
    })
  })

  describe('Prompt Input', () => {
    it('should update prompt value', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A beautiful sunset')

      expect(input).toHaveValue('A beautiful sunset')
    })

    it('should show character count', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'Test prompt')

      expect(screen.getByText(/11/)).toBeInTheDocument()
    })

    it('should warn when prompt is too short', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'Hi')

      expect(screen.getByText(/too short/i)).toBeInTheDocument()
    })
  })

  describe('Generation', () => {
    it('should call onGenerate with result on success', async () => {
      const onGenerate = vi.fn()
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={onGenerate} />)

      // Enter prompt
      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A beautiful sunset over the ocean')

      // Click generate
      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'asset-123',
          })
        )
      })
    })

    it('should show loading state during generation', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      asset: { id: 'test' },
                    }),
                }),
              100
            )
          )
      )

      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image prompt')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/generating/i)).toBeInTheDocument()
      })
    })

    it('should disable button while generating', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      asset: { id: 'test' },
                    }),
                }),
              100
            )
          )
      )

      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image prompt')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })

    it('should disable button when prompt is empty', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const button = screen.getByRole('button', { name: /generate/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should show error message on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Generation failed',
          }),
      })

      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image prompt')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/generation failed/i)).toBeInTheDocument()
      })
    })

    it('should call onError callback on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'API error',
          }),
      })

      const onError = vi.fn()
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} onError={onError} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image prompt')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('API error')
      })
    })
  })

  describe('Credits', () => {
    it('should update credits display after generation', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} initialCredits={5} />)

      // Should show initial credits
      expect(screen.getByText('5')).toBeInTheDocument()

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image prompt')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
      })
    })

    it('should show out of credits warning when balance is 0', () => {
      render(<ImageGenerator onGenerate={vi.fn()} initialCredits={0} />)

      expect(screen.getByText(/out of credits/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const promptInput = screen.getByLabelText(/prompt/i)
      expect(promptInput).toBeInTheDocument()
    })

    it('should announce generation status to screen readers', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} />)

      const input = screen.getByPlaceholderText(/describe your image/i)
      await user.type(input, 'A test image')

      const button = screen.getByRole('button', { name: /generate/i })
      await user.click(button)

      await waitFor(() => {
        const status = screen.getByRole('status')
        expect(status).toBeInTheDocument()
      })
    })
  })

  describe('Dimensions', () => {
    it('should allow selecting different dimensions', async () => {
      const user = userEvent.setup()
      render(<ImageGenerator onGenerate={vi.fn()} showDimensionPicker />)

      const select = screen.getByLabelText(/dimensions/i)
      await user.selectOptions(select, '1024x768')

      expect(select).toHaveValue('1024x768')
    })
  })
})
