/**
 * OutOfCreditsGate Component Tests
 *
 * Tests for the credit gate UI that blocks actions when credits are depleted.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OutOfCreditsGate } from '../OutOfCreditsGate'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('OutOfCreditsGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('When user has credits', () => {
    beforeEach(() => {
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

    it('should render children when credits available', async () => {
      render(
        <OutOfCreditsGate>
          <div data-testid="protected-content">Protected Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('should not show gate UI', async () => {
      render(
        <OutOfCreditsGate>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.queryByText(/out of credits/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('When user has no credits', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 0,
            hasCredits: false,
          }),
      })
    })

    it('should hide children when no credits', async () => {
      render(
        <OutOfCreditsGate>
          <div data-testid="protected-content">Protected Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(
          screen.queryByTestId('protected-content')
        ).not.toBeInTheDocument()
      })
    })

    it('should show gate UI with message', async () => {
      render(
        <OutOfCreditsGate>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByText(/out of credits/i)).toBeInTheDocument()
      })
    })

    it('should show register prompt for guests', async () => {
      render(
        <OutOfCreditsGate isAuthenticated={false}>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByText(/create an account/i)).toBeInTheDocument()
      })
    })

    it('should show purchase prompt for authenticated users', async () => {
      render(
        <OutOfCreditsGate isAuthenticated={true}>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByText(/purchase/i)).toBeInTheDocument()
      })
    })

    it('should call onOutOfCredits callback', async () => {
      const onOutOfCredits = vi.fn()
      render(
        <OutOfCreditsGate onOutOfCredits={onOutOfCredits}>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(onOutOfCredits).toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('should show loading indicator while checking credits', () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true, balance: 5 }),
                }),
              100
            )
          )
      )

      render(
        <OutOfCreditsGate>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should not show children while loading', () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true, balance: 5 }),
                }),
              100
            )
          )
      )

      render(
        <OutOfCreditsGate>
          <div data-testid="protected-content">Content</div>
        </OutOfCreditsGate>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Explicit balance prop', () => {
    it('should use provided balance instead of fetching', async () => {
      render(
        <OutOfCreditsGate balance={3}>
          <div data-testid="protected-content">Content</div>
        </OutOfCreditsGate>
      )

      // Should immediately show content without fetching
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should show gate when provided balance is 0', async () => {
      render(
        <OutOfCreditsGate balance={0}>
          <div data-testid="protected-content">Content</div>
        </OutOfCreditsGate>
      )

      expect(
        screen.queryByTestId('protected-content')
      ).not.toBeInTheDocument()
      expect(screen.getByText(/out of credits/i)).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 0,
            hasCredits: false,
          }),
      })
    })

    it('should have register button for guests', async () => {
      render(
        <OutOfCreditsGate isAuthenticated={false}>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        const registerButton = screen.getByRole('link', { name: /register/i })
        expect(registerButton).toHaveAttribute('href', '/register')
      })
    })

    it('should have login link for guests', async () => {
      render(
        <OutOfCreditsGate isAuthenticated={false}>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /log in/i })
        expect(loginLink).toHaveAttribute('href', '/login')
      })
    })
  })

  describe('Custom messages', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 0,
            hasCredits: false,
          }),
      })
    })

    it('should display custom title', async () => {
      render(
        <OutOfCreditsGate title="Custom Title">
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByText('Custom Title')).toBeInTheDocument()
      })
    })

    it('should display custom message', async () => {
      render(
        <OutOfCreditsGate message="Custom message text">
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        expect(screen.getByText('Custom message text')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            balance: 0,
            hasCredits: false,
          }),
      })
    })

    it('should have accessible alert role', async () => {
      render(
        <OutOfCreditsGate>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('should announce to screen readers', async () => {
      render(
        <OutOfCreditsGate>
          <div>Content</div>
        </OutOfCreditsGate>
      )

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })
})
