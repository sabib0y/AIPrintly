/**
 * ColourSelector Component
 *
 * Colour swatch selector for the product builder.
 * Displays available colours with visual swatches.
 */

import { cn } from '~/lib/utils';
import type { StockStatus } from '@prisma/client';

export interface ColourOption {
  /** Colour name */
  name: string;
  /** Hex colour value */
  hex: string | null;
  /** Stock status */
  stockStatus: StockStatus;
  /** Whether this colour is available with current size selection */
  isAvailable: boolean;
}

export interface ColourSelectorProps {
  /** Available colour options */
  colours: ColourOption[];
  /** Currently selected colour name */
  selectedColour: string | null;
  /** Callback when colour is selected */
  onColourChange: (colour: string) => void;
  /** Show colour names */
  showNames?: boolean;
  /** Swatch size */
  swatchSize?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Swatch size configurations
 */
const SWATCH_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

/**
 * Check if a colour is light (for contrast calculation)
 */
function isLightColour(hex: string | null): boolean {
  if (!hex) return true;

  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * ColourSelector displays product colours as visual swatches.
 *
 * @example
 * ```tsx
 * <ColourSelector
 *   colours={[
 *     { name: 'White', hex: '#FFFFFF', stockStatus: 'IN_STOCK', isAvailable: true },
 *     { name: 'Black', hex: '#000000', stockStatus: 'IN_STOCK', isAvailable: true },
 *   ]}
 *   selectedColour={selectedColour}
 *   onColourChange={setSelectedColour}
 *   showNames
 * />
 * ```
 */
export function ColourSelector({
  colours,
  selectedColour,
  onColourChange,
  showNames = true,
  swatchSize = 'md',
  className,
}: ColourSelectorProps) {
  if (colours.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Colour
        </label>
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
        {colours.map((colour) => {
          const isSelected = selectedColour === colour.name;
          const isDisabled =
            !colour.isAvailable || colour.stockStatus === 'OUT_OF_STOCK';
          const isLight = isLightColour(colour.hex);

          return (
            <div key={colour.name} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => !isDisabled && onColourChange(colour.name)}
                aria-label={colour.name}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                data-testid="colour-swatch"
                className={cn(
                  'relative rounded-full border-2 transition-all',
                  SWATCH_SIZES[swatchSize],
                  isSelected
                    ? 'ring-2 ring-sky-600 ring-offset-2'
                    : 'hover:scale-110',
                  isLight ? 'border-gray-300' : 'border-transparent',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
                style={{ backgroundColor: colour.hex ?? '#CCCCCC' }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <CheckIcon
                    className={cn(
                      'absolute inset-0 m-auto h-5 w-5',
                      isLight ? 'text-gray-800' : 'text-white'
                    )}
                  />
                )}

                {/* Unavailable indicator */}
                {isDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-0.5 rotate-45 bg-red-500" />
                  </div>
                )}
              </button>

              {/* Colour name */}
              {showNames && (
                <span
                  className={cn(
                    'text-xs',
                    isSelected
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400',
                    isDisabled && 'line-through'
                  )}
                >
                  {colour.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stock warning for selected colour */}
      {selectedColour && (
        <ColourStockWarning
          colour={colours.find((c) => c.name === selectedColour)}
        />
      )}
    </div>
  );
}

/**
 * Stock warning for selected colour
 */
function ColourStockWarning({
  colour,
}: {
  colour: ColourOption | undefined;
}) {
  if (!colour) return null;

  if (colour.stockStatus === 'LOW_STOCK') {
    return (
      <p className="text-xs text-amber-600">
        Limited stock available for {colour.name}
      </p>
    );
  }

  if (colour.stockStatus === 'OUT_OF_STOCK') {
    return (
      <p className="text-xs text-red-500">
        {colour.name} is currently out of stock
      </p>
    );
  }

  return null;
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

export default ColourSelector;
