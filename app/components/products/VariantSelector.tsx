/**
 * VariantSelector Component
 *
 * Combined size and colour selector for product variants.
 * Handles variant matching and availability display.
 */

import { useState, useEffect, useMemo } from 'react';
import type { ProductVariant, StockStatus } from '@prisma/client';
import { cn, formatPrice } from '~/lib/utils';
import { Badge } from '~/components/ui/badge';

export interface VariantSelectorProps {
  /** Available variants for the product */
  variants: ProductVariant[];
  /** Callback when a variant is selected */
  onVariantChange: (variant: ProductVariant | null) => void;
  /** Initially selected variant ID */
  initialVariantId?: string;
  /** Show price display */
  showPrice?: boolean;
  /** Show stock status */
  showStockStatus?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Stock status display configuration
 */
const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  IN_STOCK: { label: 'In Stock', variant: 'success' },
  LOW_STOCK: { label: 'Low Stock', variant: 'warning' },
  OUT_OF_STOCK: { label: 'Out of Stock', variant: 'destructive' },
};

/**
 * Extract unique sizes from variants
 */
function getUniqueSizes(variants: ProductVariant[]): string[] {
  const sizes = new Set<string>();
  variants.forEach((v) => {
    if (v.size) sizes.add(v.size);
  });
  return Array.from(sizes);
}

/**
 * Extract unique colours from variants
 */
function getUniqueColours(
  variants: ProductVariant[]
): Array<{ colour: string; colourHex: string | null }> {
  const colourMap = new Map<string, string | null>();
  variants.forEach((v) => {
    if (v.colour && !colourMap.has(v.colour)) {
      colourMap.set(v.colour, v.colourHex);
    }
  });
  return Array.from(colourMap.entries()).map(([colour, colourHex]) => ({
    colour,
    colourHex,
  }));
}

/**
 * Find variant matching size and colour
 */
function findMatchingVariant(
  variants: ProductVariant[],
  size: string | null,
  colour: string | null
): ProductVariant | null {
  return variants.find((v) => v.size === size && v.colour === colour) ?? null;
}

/**
 * Check if a specific size/colour combination is available (in stock)
 */
function isVariantAvailable(
  variants: ProductVariant[],
  size: string | null,
  colour: string | null
): boolean {
  const variant = findMatchingVariant(variants, size, colour);
  return variant !== null && variant.stockStatus !== 'OUT_OF_STOCK';
}

/**
 * VariantSelector allows users to select product size and colour.
 *
 * Features:
 * - Size selection with availability indicators
 * - Colour swatches with visual display
 * - Stock status per combination
 * - Price display for selected variant
 *
 * @example
 * ```tsx
 * <VariantSelector
 *   variants={product.variants}
 *   onVariantChange={(variant) => setSelectedVariant(variant)}
 *   showPrice
 *   showStockStatus
 * />
 * ```
 */
export function VariantSelector({
  variants,
  onVariantChange,
  initialVariantId,
  showPrice = false,
  showStockStatus = false,
  className,
}: VariantSelectorProps) {
  // Extract unique sizes and colours
  const sizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const colours = useMemo(() => getUniqueColours(variants), [variants]);

  // Get initial variant
  const initialVariant = useMemo(() => {
    if (initialVariantId) {
      return variants.find((v) => v.id === initialVariantId) ?? null;
    }
    return null;
  }, [initialVariantId, variants]);

  // State for selected values
  const [selectedSize, setSelectedSize] = useState<string | null>(
    initialVariant?.size ?? null
  );
  const [selectedColour, setSelectedColour] = useState<string | null>(
    initialVariant?.colour ?? null
  );

  // Find currently selected variant
  const selectedVariant = useMemo(
    () => findMatchingVariant(variants, selectedSize, selectedColour),
    [variants, selectedSize, selectedColour]
  );

  // Notify parent of variant changes
  useEffect(() => {
    onVariantChange(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    const isAvailable = isVariantAvailable(variants, size, selectedColour);
    if (!isAvailable) return;
    setSelectedSize(size);
  };

  // Handle colour selection
  const handleColourSelect = (colour: string) => {
    const isAvailable = isVariantAvailable(variants, selectedSize, colour);
    if (!isAvailable) return;
    setSelectedColour(colour);
  };

  // Check if size is available with current colour
  const isSizeAvailable = (size: string): boolean => {
    // If no colour selected, check if any variant with this size is available
    if (!selectedColour) {
      return variants.some(
        (v) => v.size === size && v.stockStatus !== 'OUT_OF_STOCK'
      );
    }
    return isVariantAvailable(variants, size, selectedColour);
  };

  // Check if colour is available with current size
  const isColourAvailable = (colour: string): boolean => {
    // If no size selected, check if any variant with this colour is available
    if (!selectedSize) {
      return variants.some(
        (v) => v.colour === colour && v.stockStatus !== 'OUT_OF_STOCK'
      );
    }
    return isVariantAvailable(variants, selectedSize, colour);
  };

  const hasSizes = sizes.length > 0;
  const hasColours = colours.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Size Selection */}
      {hasSizes && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Size
            </span>
            {selectedSize && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSize}
              </span>
            )}
          </div>
          <div
            role="group"
            aria-label="Size selection"
            className="flex flex-wrap gap-2"
          >
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeSelect(size)}
                  aria-pressed={isSelected}
                  aria-disabled={!available}
                  className={cn(
                    'relative min-w-[3rem] rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-600 dark:bg-sky-950 dark:text-sky-300'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
                    !available &&
                      'cursor-not-allowed opacity-50 line-through hover:border-gray-200'
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colour Selection */}
      {hasColours && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Colour
            </span>
            {selectedColour && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedColour}
              </span>
            )}
          </div>
          <div
            role="group"
            aria-label="Colour selection"
            className="flex flex-wrap gap-3"
          >
            {colours.map(({ colour, colourHex }) => {
              const available = isColourAvailable(colour);
              const isSelected = selectedColour === colour;
              const isLight = isLightColour(colourHex);

              return (
                <button
                  key={colour}
                  type="button"
                  onClick={() => handleColourSelect(colour)}
                  aria-label={colour}
                  aria-pressed={isSelected}
                  aria-disabled={!available}
                  data-testid="colour-swatch"
                  className={cn(
                    'relative h-10 w-10 rounded-full border-2 transition-all',
                    isSelected
                      ? 'ring-2 ring-sky-600 ring-offset-2'
                      : 'hover:scale-110',
                    isLight ? 'border-gray-300' : 'border-transparent',
                    !available && 'cursor-not-allowed opacity-50'
                  )}
                  style={{ backgroundColor: colourHex ?? '#CCCCCC' }}
                >
                  {isSelected && (
                    <CheckIcon
                      className={cn(
                        'absolute inset-0 m-auto h-5 w-5',
                        isLight ? 'text-gray-800' : 'text-white'
                      )}
                    />
                  )}
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-full w-0.5 rotate-45 bg-red-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price and Stock Status */}
      {(showPrice || showStockStatus) && selectedVariant && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          {showPrice && (
            <div data-testid="variant-price" className="text-lg font-bold">
              {formatPrice(selectedVariant.sellingPricePence)}
            </div>
          )}
          {showStockStatus && (
            <Badge variant={STOCK_STATUS_CONFIG[selectedVariant.stockStatus].variant}>
              {STOCK_STATUS_CONFIG[selectedVariant.stockStatus].label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Check if a hex colour is light (for text contrast)
 */
function isLightColour(hex: string | null): boolean {
  if (!hex) return true;

  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * Check icon for selected state
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default VariantSelector;
