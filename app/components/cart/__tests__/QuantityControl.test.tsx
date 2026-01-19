/**
 * QuantityControl Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuantityControl } from '../QuantityControl'

describe('QuantityControl', () => {
  describe('rendering', () => {
    it('should render current quantity', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={5} onQuantityChange={onChange} />)

      expect(screen.getByTestId('quantity-value')).toHaveTextContent('5')
    })

    it('should render decrease and increase buttons', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={5} onQuantityChange={onChange} />)

      expect(screen.getByTestId('quantity-decrease')).toBeInTheDocument()
      expect(screen.getByTestId('quantity-increase')).toBeInTheDocument()
    })

    it('should have accessible labels', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl
          quantity={5}
          onQuantityChange={onChange}
          aria-label="Test Item"
        />
      )

      expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument()
      expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument()
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Quantity for Test Item'
      )
    })
  })

  describe('interactions', () => {
    it('should call onQuantityChange when increase button is clicked', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={5} onQuantityChange={onChange} />)

      fireEvent.click(screen.getByTestId('quantity-increase'))

      expect(onChange).toHaveBeenCalledWith(6)
    })

    it('should call onQuantityChange when decrease button is clicked', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={5} onQuantityChange={onChange} />)

      fireEvent.click(screen.getByTestId('quantity-decrease'))

      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('should not decrease below minimum', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={1} onQuantityChange={onChange} min={1} />)

      const decreaseButton = screen.getByTestId('quantity-decrease')

      expect(decreaseButton).toBeDisabled()
      fireEvent.click(decreaseButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should not increase above maximum', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={99} onQuantityChange={onChange} max={99} />)

      const increaseButton = screen.getByTestId('quantity-increase')

      expect(increaseButton).toBeDisabled()
      fireEvent.click(increaseButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should respect custom min value', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={3} onQuantityChange={onChange} min={3} />)

      expect(screen.getByTestId('quantity-decrease')).toBeDisabled()
    })

    it('should respect custom max value', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={10} onQuantityChange={onChange} max={10} />)

      expect(screen.getByTestId('quantity-increase')).toBeDisabled()
    })
  })

  describe('disabled state', () => {
    it('should disable both buttons when disabled prop is true', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl quantity={5} onQuantityChange={onChange} disabled />
      )

      expect(screen.getByTestId('quantity-decrease')).toBeDisabled()
      expect(screen.getByTestId('quantity-increase')).toBeDisabled()
    })

    it('should not call onChange when disabled', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl quantity={5} onQuantityChange={onChange} disabled />
      )

      fireEvent.click(screen.getByTestId('quantity-increase'))
      fireEvent.click(screen.getByTestId('quantity-decrease'))

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should disable buttons when loading', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl quantity={5} onQuantityChange={onChange} isLoading />
      )

      expect(screen.getByTestId('quantity-decrease')).toBeDisabled()
      expect(screen.getByTestId('quantity-increase')).toBeDisabled()
    })

    it('should apply loading animation to value', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl quantity={5} onQuantityChange={onChange} isLoading />
      )

      expect(screen.getByTestId('quantity-value')).toHaveClass('animate-pulse')
    })
  })

  describe('size variants', () => {
    it('should apply small size classes', () => {
      const onChange = vi.fn()
      render(
        <QuantityControl quantity={5} onQuantityChange={onChange} size="sm" />
      )

      expect(screen.getByTestId('quantity-decrease')).toHaveClass('h-7', 'w-7')
    })

    it('should apply medium size classes by default', () => {
      const onChange = vi.fn()
      render(<QuantityControl quantity={5} onQuantityChange={onChange} />)

      expect(screen.getByTestId('quantity-decrease')).toHaveClass('h-8', 'w-8')
    })
  })
})
