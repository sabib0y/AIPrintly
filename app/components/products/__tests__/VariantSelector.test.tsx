/**
 * VariantSelector Component Tests
 *
 * Tests for the combined size and colour selector including:
 * - Size selection
 * - Colour selection
 * - Stock status display
 * - Price updates
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantSelector } from '../VariantSelector';
import type { ProductVariant, StockStatus } from '@prisma/client';

// Helper to create mock variant
const createMockVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 'var-123',
  productId: 'prod-123',
  externalId: 'ext-123',
  name: 'White Medium',
  size: 'M',
  colour: 'White',
  colourHex: '#FFFFFF',
  basePricePence: 1000,
  sellingPricePence: 1999,
  stockStatus: 'IN_STOCK' as StockStatus,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

// Sample variants for testing
const sampleVariants: ProductVariant[] = [
  createMockVariant({ id: 'v1', size: 'S', colour: 'White', colourHex: '#FFFFFF' }),
  createMockVariant({ id: 'v2', size: 'M', colour: 'White', colourHex: '#FFFFFF' }),
  createMockVariant({ id: 'v3', size: 'L', colour: 'White', colourHex: '#FFFFFF' }),
  createMockVariant({ id: 'v4', size: 'S', colour: 'Black', colourHex: '#000000' }),
  createMockVariant({ id: 'v5', size: 'M', colour: 'Black', colourHex: '#000000' }),
  createMockVariant({ id: 'v6', size: 'L', colour: 'Black', colourHex: '#000000' }),
  createMockVariant({
    id: 'v7',
    size: 'XL',
    colour: 'Black',
    colourHex: '#000000',
    stockStatus: 'OUT_OF_STOCK',
  }),
];

describe('VariantSelector', () => {
  describe('size selection', () => {
    it('should render all available sizes', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: /s/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^m$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^l$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /xl/i })).toBeInTheDocument();
    });

    it('should highlight selected size', async () => {
      const user = userEvent.setup();
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const mediumButton = screen.getByRole('button', { name: /^m$/i });
      await user.click(mediumButton);

      expect(mediumButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onVariantChange when size is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<VariantSelector variants={sampleVariants} onVariantChange={handleChange} />);

      await user.click(screen.getByRole('button', { name: /^l$/i }));

      expect(handleChange).toHaveBeenCalled();
    });

    it('should show size label', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      expect(screen.getByText('Size')).toBeInTheDocument();
    });
  });

  describe('colour selection', () => {
    it('should render all available colours', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const colourButtons = screen.getAllByTestId('colour-swatch');
      expect(colourButtons).toHaveLength(2); // White and Black
    });

    it('should display colour hex as background', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const whiteButton = screen.getByRole('button', { name: /white/i });
      expect(whiteButton).toHaveStyle({ backgroundColor: '#FFFFFF' });
    });

    it('should highlight selected colour', async () => {
      const user = userEvent.setup();
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const blackButton = screen.getByRole('button', { name: /black/i });
      await user.click(blackButton);

      expect(blackButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onVariantChange when colour is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<VariantSelector variants={sampleVariants} onVariantChange={handleChange} />);

      await user.click(screen.getByRole('button', { name: /black/i }));

      expect(handleChange).toHaveBeenCalled();
    });

    it('should show colour label', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      expect(screen.getByText('Colour')).toBeInTheDocument();
    });

    it('should show colour name when selected', async () => {
      const user = userEvent.setup();
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /black/i }));

      expect(screen.getByText('Black', { exact: true })).toBeInTheDocument();
    });
  });

  describe('variant matching', () => {
    it('should find matching variant when size and colour selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<VariantSelector variants={sampleVariants} onVariantChange={handleChange} />);

      await user.click(screen.getByRole('button', { name: /^m$/i }));
      await user.click(screen.getByRole('button', { name: /black/i }));

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'v5',
          size: 'M',
          colour: 'Black',
        })
      );
    });

    it('should pass null when no matching variant exists', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const limitedVariants = sampleVariants.filter((v) => v.id !== 'v5');
      render(<VariantSelector variants={limitedVariants} onVariantChange={handleChange} />);

      await user.click(screen.getByRole('button', { name: /^m$/i }));
      await user.click(screen.getByRole('button', { name: /black/i }));

      expect(handleChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe('stock status', () => {
    it('should show out of stock indicator for unavailable sizes', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      // Select Black colour first
      const blackButton = screen.getByRole('button', { name: /black/i });
      blackButton.click();

      // XL is only available in Black and is out of stock
      const xlButton = screen.getByRole('button', { name: /xl/i });
      expect(xlButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable selection of out of stock variants', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<VariantSelector variants={sampleVariants} onVariantChange={handleChange} />);

      // Select Black colour and XL size
      await user.click(screen.getByRole('button', { name: /black/i }));
      await user.click(screen.getByRole('button', { name: /xl/i }));

      // Should not select out of stock variant
      expect(handleChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'v7' })
      );
    });

    it('should show stock status message when variant selected', async () => {
      const user = userEvent.setup();
      render(
        <VariantSelector
          variants={sampleVariants}
          onVariantChange={vi.fn()}
          showStockStatus
        />
      );

      await user.click(screen.getByRole('button', { name: /^m$/i }));
      await user.click(screen.getByRole('button', { name: /white/i }));

      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });
  });

  describe('price display', () => {
    it('should show price when showPrice is true', () => {
      const variantsWithDifferentPrices = [
        createMockVariant({ id: 'v1', size: 'S', sellingPricePence: 1999 }),
        createMockVariant({ id: 'v2', size: 'L', sellingPricePence: 2499 }),
      ];

      render(
        <VariantSelector
          variants={variantsWithDifferentPrices}
          onVariantChange={vi.fn()}
          showPrice
        />
      );

      expect(screen.getByTestId('variant-price')).toBeInTheDocument();
    });

    it('should update price when different variant selected', async () => {
      const user = userEvent.setup();
      const variantsWithDifferentPrices = [
        createMockVariant({
          id: 'v1',
          size: 'S',
          colour: 'White',
          colourHex: '#FFFFFF',
          sellingPricePence: 1999,
        }),
        createMockVariant({
          id: 'v2',
          size: 'L',
          colour: 'White',
          colourHex: '#FFFFFF',
          sellingPricePence: 2499,
        }),
      ];

      render(
        <VariantSelector
          variants={variantsWithDifferentPrices}
          onVariantChange={vi.fn()}
          showPrice
        />
      );

      await user.click(screen.getByRole('button', { name: /^s$/i }));
      expect(screen.getByTestId('variant-price')).toHaveTextContent('£19.99');

      await user.click(screen.getByRole('button', { name: /^l$/i }));
      expect(screen.getByTestId('variant-price')).toHaveTextContent('£24.99');
    });
  });

  describe('initial selection', () => {
    it('should pre-select initial variant when provided', () => {
      render(
        <VariantSelector
          variants={sampleVariants}
          onVariantChange={vi.fn()}
          initialVariantId="v5"
        />
      );

      expect(screen.getByRole('button', { name: /^m$/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /black/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onVariantChange with initial variant on mount', () => {
      const handleChange = vi.fn();
      render(
        <VariantSelector
          variants={sampleVariants}
          onVariantChange={handleChange}
          initialVariantId="v5"
        />
      );

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'v5' })
      );
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for size buttons', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const sizeButton = screen.getByRole('button', { name: /^s$/i });
      expect(sizeButton).toHaveAccessibleName();
    });

    it('should have accessible labels for colour buttons', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      const colourButton = screen.getByRole('button', { name: /white/i });
      expect(colourButton).toHaveAccessibleName('White');
    });

    it('should have role group for size selection', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      expect(screen.getByRole('group', { name: /size/i })).toBeInTheDocument();
    });

    it('should have role group for colour selection', () => {
      render(<VariantSelector variants={sampleVariants} onVariantChange={vi.fn()} />);

      expect(screen.getByRole('group', { name: /colour/i })).toBeInTheDocument();
    });
  });

  describe('products without size or colour', () => {
    it('should not show size selector when no sizes', () => {
      const variantsWithoutSize = [
        createMockVariant({ size: null, colour: 'White', colourHex: '#FFFFFF' }),
        createMockVariant({ size: null, colour: 'Black', colourHex: '#000000' }),
      ];

      render(<VariantSelector variants={variantsWithoutSize} onVariantChange={vi.fn()} />);

      expect(screen.queryByText('Size')).not.toBeInTheDocument();
    });

    it('should not show colour selector when no colours', () => {
      const variantsWithoutColour = [
        createMockVariant({ size: 'S', colour: null, colourHex: null }),
        createMockVariant({ size: 'M', colour: null, colourHex: null }),
      ];

      render(<VariantSelector variants={variantsWithoutColour} onVariantChange={vi.fn()} />);

      expect(screen.queryByText('Colour')).not.toBeInTheDocument();
    });
  });
});
