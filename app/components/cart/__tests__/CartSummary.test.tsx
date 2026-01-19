/**
 * CartSummary Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { CartSummary, EmptyCart } from '../CartSummary'

// Wrap component with router for Link components
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('CartSummary', () => {
  describe('rendering', () => {
    it('should render subtotal correctly', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
        />
      )

      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('£29.98')
    })

    it('should render shipping cost correctly', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
        />
      )

      expect(screen.getByTestId('cart-shipping')).toHaveTextContent('£4.99')
    })

    it('should render total correctly', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
        />
      )

      expect(screen.getByTestId('cart-total')).toHaveTextContent('£34.97')
    })

    it('should show free shipping when shipping is 0 and cart has items', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={5000}
          shippingPence={0}
          itemCount={2}
        />
      )

      expect(screen.getByTestId('cart-shipping')).toHaveTextContent('Free')
    })

    it('should show dash for shipping when cart is empty', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={0}
          shippingPence={0}
          itemCount={0}
        />
      )

      expect(screen.getByTestId('cart-shipping')).toHaveTextContent('-')
    })

    it('should display item count in singular form', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={1499}
          shippingPence={499}
          itemCount={1}
        />
      )

      expect(screen.getByText('Subtotal (1 item)')).toBeInTheDocument()
    })

    it('should display item count in plural form', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={3}
        />
      )

      expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument()
    })
  })

  describe('checkout button', () => {
    it('should render checkout button', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
        />
      )

      expect(screen.getByTestId('checkout-button')).toBeInTheDocument()
    })

    it('should disable checkout button when cart is empty', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={0}
          shippingPence={0}
          itemCount={0}
        />
      )

      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })

    it('should disable checkout button when checkoutDisabled is true', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
          checkoutDisabled
        />
      )

      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })

    it('should show disabled message when provided', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
          checkoutDisabled
          checkoutDisabledMessage="Please resolve cart issues"
        />
      )

      expect(screen.getByText('Please resolve cart issues')).toBeInTheDocument()
    })

    it('should call onCheckout when button is clicked', () => {
      const onCheckout = vi.fn()
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
          onCheckout={onCheckout}
        />
      )

      fireEvent.click(screen.getByTestId('checkout-button'))
      expect(onCheckout).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should disable checkout button when loading', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
          isLoading
        />
      )

      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })
  })

  describe('security note', () => {
    it('should display secure checkout message', () => {
      renderWithRouter(
        <CartSummary
          subtotalPence={2998}
          shippingPence={499}
          itemCount={2}
        />
      )

      expect(screen.getByText('Secure checkout with Stripe')).toBeInTheDocument()
    })
  })
})

describe('EmptyCart', () => {
  it('should render empty cart message', () => {
    renderWithRouter(<EmptyCart />)

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(
      screen.getByText("Looks like you haven't added anything yet.")
    ).toBeInTheDocument()
  })

  it('should render browse products link', () => {
    renderWithRouter(<EmptyCart />)

    const link = screen.getByRole('link', { name: 'Browse Products' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/products')
  })

  it('should have testid for identification', () => {
    renderWithRouter(<EmptyCart />)

    expect(screen.getByTestId('empty-cart')).toBeInTheDocument()
  })
})
