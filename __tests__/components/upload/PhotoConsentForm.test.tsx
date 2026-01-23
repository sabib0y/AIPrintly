/**
 * PhotoConsentForm Component Tests
 *
 * Tests for GDPR-compliant consent form for photo uploads.
 * Covers rendering, interactions, validation, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoConsentForm } from '~/components/upload/PhotoConsentForm'
import type { ConsentData } from '~/components/upload/PhotoConsentForm'

describe('PhotoConsentForm', () => {
  // Mock callbacks
  let mockOnConsent: ReturnType<typeof vi.fn<[ConsentData], void>>
  let mockOnCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnConsent = vi.fn()
    mockOnCancel = vi.fn()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the consent form with title', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      expect(screen.getByText('Photo Upload Consent')).toBeInTheDocument()
      expect(screen.getByText('Before uploading, please confirm:')).toBeInTheDocument()
    })

    it('renders both consent checkboxes unchecked by default', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      expect(rightsCheckbox).not.toBeChecked()
      expect(guardianCheckbox).not.toBeChecked()
    })

    it('renders information section about data usage', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      expect(screen.getByText('Your photo will be:')).toBeInTheDocument()
      expect(screen.getByText('Used only to create your product')).toBeInTheDocument()
      expect(screen.getByText('Automatically deleted after 30 days')).toBeInTheDocument()
      expect(screen.getByText('Never used for AI training')).toBeInTheDocument()
    })

    it('renders privacy policy link pointing to /privacy#children-data', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const privacyLink = screen.getByRole('link', { name: /read our privacy policy/i })

      expect(privacyLink).toBeInTheDocument()
      expect(privacyLink).toHaveAttribute('href', '/privacy#children-data')
    })

    it('renders consent button disabled by default', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      expect(consentButton).toBeDisabled()
    })

    it('renders cancel button when onCancel provided', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('does not render cancel button when onCancel not provided', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('checking first checkbox updates state', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')

      await user.click(rightsCheckbox)

      expect(rightsCheckbox).toBeChecked()
    })

    it('checking second checkbox updates state', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      await user.click(guardianCheckbox)

      expect(guardianCheckbox).toBeChecked()
    })

    it('consent button becomes enabled when both checkboxes checked', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )
      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      expect(consentButton).toBeDisabled()

      await user.click(rightsCheckbox)
      expect(consentButton).toBeDisabled()

      await user.click(guardianCheckbox)
      expect(consentButton).toBeEnabled()
    })

    it('clicking consent button calls onConsent with correct data structure', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )
      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      await user.click(rightsCheckbox)
      await user.click(guardianCheckbox)
      await user.click(consentButton)

      expect(mockOnConsent).toHaveBeenCalledTimes(1)
      expect(mockOnConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          rightsToUse: true,
          childGuardianConsent: true,
          timestamp: expect.any(String),
        })
      )
    })

    it('onConsent receives timestamp in ISO format', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )
      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      await user.click(rightsCheckbox)
      await user.click(guardianCheckbox)
      await user.click(consentButton)

      const callArg = mockOnConsent.mock.calls[0][0]
      const timestamp = callArg.timestamp

      // Validate ISO format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })

    it('clicking cancel button calls onCancel', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('consent button does nothing when disabled (both not checked)', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      expect(consentButton).toBeDisabled()

      // Attempt to click disabled button
      await user.click(consentButton)

      expect(mockOnConsent).not.toHaveBeenCalled()
    })

    it('consent button does nothing when only one checkbox is checked', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      await user.click(rightsCheckbox)

      expect(consentButton).toBeDisabled()
      await user.click(consentButton)

      expect(mockOnConsent).not.toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    it('shows validation message when only one checkbox is checked', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')

      // Initially no validation message
      expect(
        screen.queryByText('Please confirm both statements to continue')
      ).not.toBeInTheDocument()

      // Check first checkbox
      await user.click(rightsCheckbox)

      // Validation message should appear
      expect(screen.getByText('Please confirm both statements to continue')).toBeInTheDocument()

      // Check second checkbox
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )
      await user.click(guardianCheckbox)

      // Validation message should disappear
      expect(
        screen.queryByText('Please confirm both statements to continue')
      ).not.toBeInTheDocument()
    })

    it('does not show validation message when neither checkbox is checked', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      expect(
        screen.queryByText('Please confirm both statements to continue')
      ).not.toBeInTheDocument()
    })

    it('does not show validation message when both checkboxes are checked', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      await user.click(rightsCheckbox)
      await user.click(guardianCheckbox)

      expect(
        screen.queryByText('Please confirm both statements to continue')
      ).not.toBeInTheDocument()
    })

    it('shows validation message when unchecking makes only one checkbox checked', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      // Check both
      await user.click(rightsCheckbox)
      await user.click(guardianCheckbox)

      expect(
        screen.queryByText('Please confirm both statements to continue')
      ).not.toBeInTheDocument()

      // Uncheck one
      await user.click(guardianCheckbox)

      // Validation message should appear
      expect(screen.getByText('Please confirm both statements to continue')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('checkboxes have aria-required="true"', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      expect(rightsCheckbox).toHaveAttribute('aria-required', 'true')
      expect(guardianCheckbox).toHaveAttribute('aria-required', 'true')
    })

    it('labels are associated with checkboxes via htmlFor', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      // If getByLabelText works, the association is correct
      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )

      expect(rightsCheckbox).toBeInTheDocument()
      expect(guardianCheckbox).toBeInTheDocument()

      // Additionally verify by ID
      expect(rightsCheckbox).toHaveAttribute('id', 'rights-to-use')
      expect(guardianCheckbox).toHaveAttribute('id', 'child-guardian-consent')
    })

    it('validation message has role="alert"', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')

      await user.click(rightsCheckbox)

      const alertMessage = screen.getByRole('alert')

      expect(alertMessage).toBeInTheDocument()
      expect(alertMessage).toHaveTextContent('Please confirm both statements to continue')
    })

    it('privacy policy link opens in new tab (target="_blank")', () => {
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const privacyLink = screen.getByRole('link', { name: /read our privacy policy/i })

      expect(privacyLink).toHaveAttribute('target', '_blank')
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Edge Cases', () => {
    it('can toggle checkboxes multiple times', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')

      // Check
      await user.click(rightsCheckbox)
      expect(rightsCheckbox).toBeChecked()

      // Uncheck
      await user.click(rightsCheckbox)
      expect(rightsCheckbox).not.toBeChecked()

      // Check again
      await user.click(rightsCheckbox)
      expect(rightsCheckbox).toBeChecked()
    })

    it('applies custom className when provided', () => {
      const { container } = render(
        <PhotoConsentForm onConsent={mockOnConsent} className="custom-class" />
      )

      const card = container.querySelector('.custom-class')

      expect(card).toBeInTheDocument()
    })

    it('consent button remains disabled after unchecking one checkbox', async () => {
      const user = userEvent.setup()
      render(<PhotoConsentForm onConsent={mockOnConsent} />)

      const rightsCheckbox = screen.getByLabelText('I have the right to use this image')
      const guardianCheckbox = screen.getByLabelText(
        /if this photo contains a child, i am their parent or legal guardian/i
      )
      const consentButton = screen.getByRole('button', { name: /i consent & continue/i })

      // Check both
      await user.click(rightsCheckbox)
      await user.click(guardianCheckbox)
      expect(consentButton).toBeEnabled()

      // Uncheck one
      await user.click(rightsCheckbox)
      expect(consentButton).toBeDisabled()

      // Attempt to click
      await user.click(consentButton)
      expect(mockOnConsent).not.toHaveBeenCalled()
    })
  })
})
