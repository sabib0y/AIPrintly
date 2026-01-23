/**
 * Tests for CreditPackSelector Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { CreditPackSelector } from '~/components/credits/CreditPackSelector'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('CreditPackSelector', () => {
  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <CreditPackSelector {...props} />
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all three credit packs', () => {
    renderComponent()

    expect(screen.getByText('100 Credits')).toBeInTheDocument()
    expect(screen.getByText('250 Credits')).toBeInTheDocument()
    expect(screen.getByText('700 Credits')).toBeInTheDocument()
  })

  it('should display correct prices', () => {
    renderComponent()

    expect(screen.getByText('£4.99')).toBeInTheDocument()
    expect(screen.getByText('£9.99')).toBeInTheDocument()
    expect(screen.getByText('£19.99')).toBeInTheDocument()
  })

  it('should mark 700 pack as best value', () => {
    renderComponent()

    const bestValueBadge = screen.getByText('Best Value')
    expect(bestValueBadge).toBeInTheDocument()
  })

  it('should display price per credit', () => {
    renderComponent()

    // 100 pack: 499/100 = 4.99p per credit
    expect(screen.getByText(/4\.99p per credit/i)).toBeInTheDocument()

    // 250 pack: 999/250 = 3.996p per credit (rounds to 4.00p)
    expect(screen.getByText(/4\.00p per credit/i)).toBeInTheDocument()

    // 700 pack: 1999/700 = 2.856p per credit (rounds to 2.86p)
    expect(screen.getByText(/2\.86p per credit/i)).toBeInTheDocument()
  })

  it('should disable purchase buttons when loading', () => {
    renderComponent({ isLoading: true })

    const buttons = screen.getAllByRole('button', { name: /purchase/i })
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('should call onPurchase with pack ID when button clicked', async () => {
    const user = userEvent.setup()
    const onPurchase = vi.fn()

    renderComponent({ onPurchase })

    const button = screen.getAllByRole('button', { name: /purchase/i })[0]
    await user.click(button)

    expect(onPurchase).toHaveBeenCalledWith('pack_100')
  })

  it('should redirect to Stripe on successful purchase', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_123',
      }),
    } as Response)

    // Mock window.location.href
    const originalLocation = window.location
    delete (window as any).location
    window.location = { href: '' } as any

    renderComponent()

    const button = screen.getAllByRole('button', { name: /purchase/i })[0]
    await user.click(button)

    await waitFor(
      () => {
        expect(window.location.href).toBe('https://checkout.stripe.com/test')
      },
      { timeout: 3000 }
    )

    // Restore
    window.location = originalLocation
  })

  it('should call API when purchase button clicked', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Payment processing failed',
      }),
    } as Response)

    renderComponent()

    const button = screen.getAllByRole('button', { name: /purchase/i })[0]
    await user.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/credits/purchase',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ packId: 'pack_100' }),
        })
      )
    })
  })

  it('should show loading state on button during purchase', async () => {
    const user = userEvent.setup()

    // Create a promise that we control
    let resolvePromise: (value: any) => void
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(controlledPromise as any)

    renderComponent()

    const button = screen.getAllByRole('button', { name: /purchase/i })[0]
    await user.click(button)

    // Check button shows "Purchasing..."
    await waitFor(() => {
      expect(button).toHaveTextContent('Purchasing...')
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, url: 'test://url' }),
    })
  })

  it('should show correct heading', () => {
    renderComponent()

    expect(screen.getByText('Choose Your Credit Pack')).toBeInTheDocument()
  })

  it('should display credit usage description', () => {
    renderComponent()

    expect(
      screen.getByText(/credits never expire/i)
    ).toBeInTheDocument()
  })

  it('should have accessible purchase buttons', () => {
    renderComponent()

    const buttons = screen.getAllByRole('button', { name: /purchase/i })
    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName()
    })
  })

  it('should highlight recommended pack with visual styling', () => {
    const { container } = renderComponent()

    // Find the card containing "Best Value"
    const bestValueCard = screen.getByText('Best Value').closest('[role="article"]')

    expect(bestValueCard).toHaveClass('border-sky-600')
  })
})
