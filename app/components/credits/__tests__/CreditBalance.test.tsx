/**
 * CreditBalance Component Tests
 *
 * Tests for the credit balance display component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CreditBalance } from '../CreditBalance'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          balance: 5,
          hasCredits: true,
        }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should display credit balance', async () => {
      render(<CreditBalance />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should show credit label', async () => {
      render(<CreditBalance />)

      await waitFor(() => {
        expect(screen.getByText(/credits/i)).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<CreditBalance />)

      // Should show skeleton or loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render in compact mode', async () => {
      render(<CreditBalance variant="compact" />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })

      // Compact mode should have smaller styling
      const container = screen.getByTestId('credit-balance')
      expect(container).toHaveClass('text-sm')
    })

    it('should render in full mode with icon', async () => {
      render(<CreditBalance variant="full" />)

      await waitFor(() => {
        // Full mode should show icon
        expect(screen.getByTestId('credit-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Credit States', () => {
    it('should show warning style when low on credits', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 1,
            hasCredits: true,
          }),
      })

      render(<CreditBalance />)

      await waitFor(() => {
        const container = screen.getByTestId('credit-balance')
        expect(container).toHaveClass('text-amber-600')
      })
    })

    it('should show error style when out of credits', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 0,
            hasCredits: false,
          }),
      })

      render(<CreditBalance />)

      await waitFor(() => {
        const container = screen.getByTestId('credit-balance')
        expect(container).toHaveClass('text-red-600')
      })
    })

    it('should show success style when adequate credits', async () => {
      render(<CreditBalance />)

      await waitFor(() => {
        const container = screen.getByTestId('credit-balance')
        expect(container).toHaveClass('text-green-600')
      })
    })
  })

  describe('Initial Balance', () => {
    it('should use initial balance before fetch completes', () => {
      render(<CreditBalance initialBalance={10} />)

      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should update with fetched balance', async () => {
      render(<CreditBalance initialBalance={10} />)

      // Initially shows initial balance
      expect(screen.getByText('10')).toBeInTheDocument()

      // After fetch completes, shows actual balance
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error state on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Failed to fetch',
          }),
      })

      render(<CreditBalance />)

      await waitFor(() => {
        expect(screen.getByText('--')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<CreditBalance />)

      await waitFor(() => {
        expect(screen.getByText('--')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh', () => {
    it('should support manual refresh', async () => {
      const onRefresh = vi.fn()
      render(<CreditBalance onRefresh={onRefresh} />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })

      // Refresh should have been called on mount
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label', async () => {
      render(<CreditBalance />)

      await waitFor(() => {
        const container = screen.getByTestId('credit-balance')
        expect(container).toHaveAttribute('aria-label')
      })
    })

    it('should announce balance to screen readers', async () => {
      render(<CreditBalance />)

      await waitFor(() => {
        const srText = screen.getByText(/5 credits remaining/i, {
          selector: '.sr-only',
        })
        expect(srText).toBeInTheDocument()
      })
    })
  })
})
