/**
 * SizeSelector Component
 *
 * Size selection component for the product builder.
 * Displays available sizes with stock status and prices.
 */

import { cn } from '~/lib/utils';
import { formatPrice } from '~/lib/utils';
import type { StockStatus } from '@prisma/client';

export interface SizeOption {
  /** Size value (e.g., "S", "M", "L", "11oz") */
  value: string;
  /** Display label */
  label: string;
  /** Price in pence */
  pricePence: number;
  /** Stock status */
  stockStatus: StockStatus;
  /** Whether this size is available with current colour selection */
  isAvailable: boolean;
}

export interface SizeSelectorProps {
  /** Available size options */
  sizes: SizeOption[];
  /** Currently selected size value */
  selectedSize: string | null;
  /** Callback when size is selected */
  onSizeChange: (size: string) => void;
  /** Show prices next to sizes */
  showPrices?: boolean;
  /** Show stock status */
  showStock?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Stock status styling
 */
const STOCK_STATUS_STYLES: Record<StockStatus, string> = {
  IN_STOCK: 'text-green-600',
  LOW_STOCK: 'text-amber-600',
  OUT_OF_STOCK: 'text-red-500 line-through',
};

/**
 * SizeSelector displays product sizes in a button grid.
 *
 * @example
 * ```tsx
 * <SizeSelector
 *   sizes={[
 *     { value: 'S', label: 'Small', pricePence: 1999, stockStatus: 'IN_STOCK', isAvailable: true },
 *     { value: 'M', label: 'Medium', pricePence: 1999, stockStatus: 'IN_STOCK', isAvailable: true },
 *   ]}
 *   selectedSize={selectedSize}
 *   onSizeChange={setSelectedSize}
 *   showPrices
 * />
 * ```
 */
export function SizeSelector({
  sizes,
  selectedSize,
  onSizeChange,
  showPrices = false,
  showStock = false,
  className,
}: SizeSelectorProps) {
  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Size
        </label>
        {selectedSize && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sizes.find((s) => s.value === selectedSize)?.label ?? selectedSize}
          </span>
        )}
      </div>

      <div
        role="group"
        aria-label="Size selection"
        className="flex flex-wrap gap-2"
      >
        {sizes.map((size) => {
          const isSelected = selectedSize === size.value;
          const isDisabled = !size.isAvailable || size.stockStatus === 'OUT_OF_STOCK';

          return (
            <button
              key={size.value}
              type="button"
              onClick={() => !isDisabled && onSizeChange(size.value)}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              className={cn(
                'relative flex min-w-[4rem] flex-col items-center rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isSelected
                  ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-600 dark:bg-sky-950 dark:text-sky-300'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
                isDisabled &&
                  'cursor-not-allowed opacity-50 hover:border-gray-200'
              )}
            >
              <span className={isDisabled ? 'line-through' : ''}>
                {size.value}
              </span>
              {showPrices && (
                <span
                  className={cn(
                    'mt-0.5 text-xs',
                    isSelected ? 'text-sky-600' : 'text-gray-500'
                  )}
                >
                  {formatPrice(size.pricePence)}
                </span>
              )}
              {showStock && size.stockStatus !== 'IN_STOCK' && (
                <span
                  className={cn(
                    'mt-1 text-xs',
                    STOCK_STATUS_STYLES[size.stockStatus]
                  )}
                >
                  {size.stockStatus === 'LOW_STOCK' ? 'Low stock' : 'Out of stock'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SizeSelector;
