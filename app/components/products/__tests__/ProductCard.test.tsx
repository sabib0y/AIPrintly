/**
 * ProductCard Component Tests
 *
 * Tests for the product display card including:
 * - Rendering product information
 * - Price display
 * - Stock status
 * - Click handlers
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { ProductCard } from '../ProductCard';
import type { Product, ProductCategory, FulfilmentProvider, StockStatus } from '@prisma/client';

// Helper to create mock product
const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-123',
  externalId: 'printful-123',
  provider: 'PRINTFUL' as FulfilmentProvider,
  category: 'MUG' as ProductCategory,
  name: 'Classic Mug',
  description: 'A beautiful ceramic mug perfect for your morning coffee',
  basePricePence: 800,
  sellingPricePence: 1499,
  isActive: true,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Wrapper component for router context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProductCard', () => {
  describe('rendering', () => {
    it('should render product name', () => {
      render(<ProductCard product={createMockProduct({ name: 'Test Product' })} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should render product description', () => {
      render(
        <ProductCard
          product={createMockProduct({ description: 'Amazing product description' })}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('Amazing product description')).toBeInTheDocument();
    });

    it('should render formatted price', () => {
      render(<ProductCard product={createMockProduct({ sellingPricePence: 1999 })} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('£19.99')).toBeInTheDocument();
    });

    it('should render category badge', () => {
      render(<ProductCard product={createMockProduct({ category: 'APPAREL' })} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('Apparel')).toBeInTheDocument();
    });

    it('should render product image when imageUrl provided', () => {
      render(
        <ProductCard
          product={createMockProduct()}
          imageUrl="https://example.com/image.jpg"
        />,
        { wrapper: Wrapper }
      );

      const image = screen.getByRole('img', { name: 'Classic Mug' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should render placeholder when no imageUrl provided', () => {
      render(<ProductCard product={createMockProduct()} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(200);
      render(<ProductCard product={createMockProduct({ description: longDescription })} />, {
        wrapper: Wrapper,
      });

      const description = screen.getByTestId('product-description');
      expect(description.textContent?.length).toBeLessThan(150);
    });
  });

  describe('stock status', () => {
    it('should show "In Stock" for IN_STOCK products', () => {
      render(<ProductCard product={createMockProduct()} stockStatus="IN_STOCK" />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    it('should show "Low Stock" for LOW_STOCK products', () => {
      render(<ProductCard product={createMockProduct()} stockStatus="LOW_STOCK" />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });

    it('should show "Out of Stock" for OUT_OF_STOCK products', () => {
      render(<ProductCard product={createMockProduct()} stockStatus="OUT_OF_STOCK" />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('should not show stock status when not provided', () => {
      render(<ProductCard product={createMockProduct()} />, {
        wrapper: Wrapper,
      });

      expect(screen.queryByTestId('stock-status')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should render view button linking to product page', () => {
      render(<ProductCard product={createMockProduct({ id: 'prod-456' })} />, {
        wrapper: Wrapper,
      });

      const viewButton = screen.getByRole('link', { name: /view/i });
      expect(viewButton).toHaveAttribute('href', '/products/prod-456');
    });

    it('should render customise button linking to builder', () => {
      render(
        <ProductCard product={createMockProduct({ category: 'MUG' })} showCustomiseButton />,
        { wrapper: Wrapper }
      );

      const customiseButton = screen.getByRole('link', { name: /customise/i });
      expect(customiseButton).toHaveAttribute('href', '/build/mug');
    });

    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ProductCard product={createMockProduct()} onClick={handleClick} />, {
        wrapper: Wrapper,
      });

      const card = screen.getByTestId('product-card');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledWith(createMockProduct());
    });

    it('should disable customise button for out of stock products', () => {
      render(
        <ProductCard
          product={createMockProduct()}
          stockStatus="OUT_OF_STOCK"
          showCustomiseButton
        />,
        { wrapper: Wrapper }
      );

      const customiseButton = screen.getByRole('button', { name: /customise/i });
      expect(customiseButton).toBeDisabled();
    });
  });

  describe('variants', () => {
    it('should show variant count when provided', () => {
      render(<ProductCard product={createMockProduct()} variantCount={5} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('5 options')).toBeInTheDocument();
    });

    it('should show "1 option" for single variant', () => {
      render(<ProductCard product={createMockProduct()} variantCount={1} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('1 option')).toBeInTheDocument();
    });

    it('should not show variant count when not provided', () => {
      render(<ProductCard product={createMockProduct()} />, {
        wrapper: Wrapper,
      });

      expect(screen.queryByText(/option/i)).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should render skeleton when loading', () => {
      render(<ProductCard product={createMockProduct()} isLoading />, {
        wrapper: Wrapper,
      });

      expect(screen.getByTestId('product-card-skeleton')).toBeInTheDocument();
    });

    it('should not render product content when loading', () => {
      render(<ProductCard product={createMockProduct({ name: 'Test Product' })} isLoading />, {
        wrapper: Wrapper,
      });

      expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible name on card', () => {
      render(<ProductCard product={createMockProduct({ name: 'Accessible Mug' })} />, {
        wrapper: Wrapper,
      });

      const card = screen.getByTestId('product-card');
      expect(card).toHaveAttribute('aria-label', 'Accessible Mug product card');
    });

    it('should have alt text on product image', () => {
      render(
        <ProductCard
          product={createMockProduct({ name: 'Image Test' })}
          imageUrl="https://example.com/img.jpg"
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Image Test');
    });
  });

  describe('price formatting', () => {
    it('should format whole pound amounts correctly', () => {
      render(<ProductCard product={createMockProduct({ sellingPricePence: 2000 })} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('£20.00')).toBeInTheDocument();
    });

    it('should format pence amounts correctly', () => {
      render(<ProductCard product={createMockProduct({ sellingPricePence: 99 })} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('£0.99')).toBeInTheDocument();
    });

    it('should show "From" prefix when hasMultiplePrices is true', () => {
      render(<ProductCard product={createMockProduct()} hasMultiplePrices />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/from/i)).toBeInTheDocument();
    });
  });
});
