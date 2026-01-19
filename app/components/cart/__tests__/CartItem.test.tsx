/**
 * CartItem Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { CartItem, CartItemSkeleton, type CartItemData } from '../CartItem'

// Wrap component with router for Link components
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

const mockCartItem: CartItemData = {
  id: 'item-1',
  quantity: 2,
  unitPricePence: 1499,
  configuration: {
    id: 'config-1',
    mockupUrl: 'https://example.com/mockup.jpg',
    product: {
      name: 'Custom Mug',
      category: 'MUG',
    },
    variant: {
      name: 'White / Large',
      stockStatus: 'IN_STOCK',
      colour: 'White',
      size: 'Large',
    },
    asset: {
      storageUrl: 'https://example.com/image.jpg',
    },
  },
}

describe('CartItem', () => {
  describe('rendering', () => {
    it('should render product name', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByText('Custom Mug')).toBeInTheDocument()
    })

    it('should render variant details', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByText(/White \/ Large/)).toBeInTheDocument()
    })

    it('should render total price (unit price * quantity)', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      // 1499 * 2 = 2998 pence = £29.98
      expect(screen.getByText('£29.98')).toBeInTheDocument()
    })

    it('should render unit price when quantity > 1', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByText('£14.99 each')).toBeInTheDocument()
    })

    it('should not render unit price when quantity is 1', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      const singleItem = { ...mockCartItem, quantity: 1 }

      renderWithRouter(
        <CartItem
          item={singleItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.queryByText(/each$/)).not.toBeInTheDocument()
    })

    it('should render mockup image when available', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      const image = screen.getByAltText('Custom Mug')
      expect(image).toHaveAttribute('src', 'https://example.com/mockup.jpg')
    })

    it('should render asset image when mockup is not available', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      const itemWithoutMockup = {
        ...mockCartItem,
        configuration: {
          ...mockCartItem.configuration,
          mockupUrl: null,
        },
      }

      renderWithRouter(
        <CartItem
          item={itemWithoutMockup}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      const image = screen.getByAltText('Custom Mug')
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })
  })

  describe('stock status badges', () => {
    it('should show out of stock badge', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      const outOfStockItem = {
        ...mockCartItem,
        configuration: {
          ...mockCartItem.configuration,
          variant: {
            ...mockCartItem.configuration.variant,
            stockStatus: 'OUT_OF_STOCK' as const,
          },
        },
      }

      renderWithRouter(
        <CartItem
          item={outOfStockItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    })

    it('should show low stock badge', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      const lowStockItem = {
        ...mockCartItem,
        configuration: {
          ...mockCartItem.configuration,
          variant: {
            ...mockCartItem.configuration.variant,
            stockStatus: 'LOW_STOCK' as const,
          },
        },
      }

      renderWithRouter(
        <CartItem
          item={lowStockItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })

    it('should not show badge when in stock', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.queryByText('Out of Stock')).not.toBeInTheDocument()
      expect(screen.queryByText('Low Stock')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onQuantityChange when quantity changes', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      fireEvent.click(screen.getByTestId('quantity-increase'))

      expect(onQuantityChange).toHaveBeenCalledWith('item-1', 3)
    })

    it('should call onRemove when remove button is clicked', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      fireEvent.click(screen.getByTestId('remove-item-item-1'))

      expect(onRemove).toHaveBeenCalledWith('item-1')
    })

    it('should disable quantity control when out of stock', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      const outOfStockItem = {
        ...mockCartItem,
        configuration: {
          ...mockCartItem.configuration,
          variant: {
            ...mockCartItem.configuration.variant,
            stockStatus: 'OUT_OF_STOCK' as const,
          },
        },
      }

      renderWithRouter(
        <CartItem
          item={outOfStockItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      )

      expect(screen.getByTestId('quantity-decrease')).toBeDisabled()
      expect(screen.getByTestId('quantity-increase')).toBeDisabled()
    })
  })

  describe('error and warning states', () => {
    it('should display error message', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          error="This item is out of stock"
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('This item is out of stock')
    })

    it('should display warning message', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          warning="Limited stock remaining"
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Limited stock remaining')
    })

    it('should display new price when price has changed', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          newPricePence={1999}
        />
      )

      expect(screen.getByText('Now £19.99 each')).toBeInTheDocument()
    })
  })

  describe('updating state', () => {
    it('should apply updating styles when isUpdating is true', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          isUpdating
        />
      )

      const container = screen.getByTestId('cart-item-item-1')
      expect(container).toHaveClass('opacity-60')
    })

    it('should disable remove button when updating', () => {
      const onQuantityChange = vi.fn()
      const onRemove = vi.fn()

      renderWithRouter(
        <CartItem
          item={mockCartItem}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          isUpdating
        />
      )

      expect(screen.getByTestId('remove-item-item-1')).toBeDisabled()
    })
  })
})

describe('CartItemSkeleton', () => {
  it('should render skeleton elements', () => {
    renderWithRouter(<CartItemSkeleton />)

    expect(screen.getByTestId('cart-item-skeleton')).toBeInTheDocument()
  })
})
