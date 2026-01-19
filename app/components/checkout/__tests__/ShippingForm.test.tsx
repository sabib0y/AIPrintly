/**
 * ShippingForm Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShippingForm } from '../ShippingForm'

describe('ShippingForm', () => {
  describe('rendering', () => {
    it('should render all required form fields', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Address Line 1/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Address Line 2/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/City/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/County/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Postcode/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Country/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      expect(screen.getByTestId('shipping-submit')).toBeInTheDocument()
      expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
    })

    it('should show country as disabled', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      expect(screen.getByLabelText(/Country/i)).toBeDisabled()
    })

    it('should show UK only shipping note', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      expect(screen.getByText(/Currently shipping to UK only/i)).toBeInTheDocument()
    })
  })

  describe('initial values', () => {
    it('should populate fields with initial values', () => {
      const onSubmit = vi.fn()
      const initialValues = {
        fullName: 'John Smith',
        email: 'john@example.com',
        city: 'London',
      }

      render(<ShippingForm onSubmit={onSubmit} initialValues={initialValues} />)

      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Smith')
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('john@example.com')
      expect(screen.getByLabelText(/City/i)).toHaveValue('London')
    })
  })

  describe('validation', () => {
    it('should show error for empty full name on blur', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Full Name/i)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument()
      })
    })

    it('should show error for invalid email', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Email Address/i)
      await userEvent.type(input, 'invalid-email')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
      })
    })

    it('should show error for invalid postcode', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Postcode/i)
      await userEvent.type(input, '12345')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid UK postcode')).toBeInTheDocument()
      })
    })

    it('should accept valid UK postcode', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Postcode/i)
      await userEvent.type(input, 'SW1A 1AA')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid UK postcode')).not.toBeInTheDocument()
      })
    })

    it('should format postcode on blur', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Postcode/i)
      await userEvent.type(input, 'sw1a1aa')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(input).toHaveValue('SW1A 1AA')
      })
    })
  })

  describe('form submission', () => {
    it('should not submit with invalid data', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      fireEvent.click(screen.getByTestId('shipping-submit'))

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    it('should show all validation errors on submit', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      fireEvent.click(screen.getByTestId('shipping-submit'))

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Phone number is required')).toBeInTheDocument()
        expect(screen.getByText('Address is required')).toBeInTheDocument()
        expect(screen.getByText('City is required')).toBeInTheDocument()
        expect(screen.getByText('Postcode is required')).toBeInTheDocument()
      })
    })

    it('should submit with valid data', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      // Fill in all required fields
      await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Smith')
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com')
      await userEvent.type(screen.getByLabelText(/Phone Number/i), '07700900123')
      await userEvent.type(screen.getByLabelText(/Address Line 1/i), '123 Main Street')
      await userEvent.type(screen.getByLabelText(/City/i), 'London')
      await userEvent.type(screen.getByLabelText(/Postcode/i), 'SW1A 1AA')

      fireEvent.click(screen.getByTestId('shipping-submit'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          fullName: 'John Smith',
          email: 'john@example.com',
          phone: '07700900123',
          addressLine1: '123 Main Street',
          addressLine2: '',
          city: 'London',
          county: '',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
        })
      })
    })
  })

  describe('submitting state', () => {
    it('should disable all inputs when submitting', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} isSubmitting />)

      expect(screen.getByLabelText(/Full Name/i)).toBeDisabled()
      expect(screen.getByLabelText(/Email Address/i)).toBeDisabled()
      expect(screen.getByLabelText(/Phone Number/i)).toBeDisabled()
      expect(screen.getByLabelText(/Address Line 1/i)).toBeDisabled()
      expect(screen.getByLabelText(/City/i)).toBeDisabled()
      expect(screen.getByLabelText(/Postcode/i)).toBeDisabled()
    })

    it('should disable submit button when submitting', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} isSubmitting />)

      expect(screen.getByTestId('shipping-submit')).toBeDisabled()
    })

    it('should show processing text when submitting', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} isSubmitting />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria-describedby for error messages', async () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      const input = screen.getByLabelText(/Full Name/i)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'fullName-error')
      })
    })

    it('should have form testid for identification', () => {
      const onSubmit = vi.fn()
      render(<ShippingForm onSubmit={onSubmit} />)

      expect(screen.getByTestId('shipping-form')).toBeInTheDocument()
    })
  })
})
