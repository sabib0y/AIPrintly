/**
 * PriceDisplay Component
 *
 * Dynamic price display for the product builder.
 * Shows current price, quantity pricing, and price breakdown.
 */

import { cn, formatPrice } from '~/lib/utils';

export interface PriceDisplayProps {
  /** Price in pence */
  pricePence: number;
  /** Original price before discount (optional) */
  originalPricePence?: number;
  /** Quantity (for showing total) */
  quantity?: number;
  /** Show total price for quantity */
  showTotal?: boolean;
  /** Show per-unit price */
  showPerUnit?: boolean;
  /** Show discount percentage */
  showDiscount?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size configurations for price display
 */
const SIZE_STYLES = {
  sm: {
    price: 'text-lg',
    original: 'text-sm',
    total: 'text-sm',
    discount: 'text-xs',
  },
  md: {
    price: 'text-2xl',
    original: 'text-base',
    total: 'text-sm',
    discount: 'text-xs',
  },
  lg: {
    price: 'text-3xl',
    original: 'text-lg',
    total: 'text-base',
    discount: 'text-sm',
  },
};

/**
 * PriceDisplay shows the current price with optional variations.
 *
 * @example
 * ```tsx
 * <PriceDisplay
 *   pricePence={1999}
 *   originalPricePence={2499}
 *   quantity={2}
 *   showTotal
 *   showDiscount
 * />
 * ```
 */
export function PriceDisplay({
  pricePence,
  originalPricePence,
  quantity = 1,
  showTotal = false,
  showPerUnit = false,
  showDiscount = false,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const styles = SIZE_STYLES[size];
  const totalPence = pricePence * quantity;
  const hasDiscount = originalPricePence && originalPricePence > pricePence;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPricePence - pricePence) / originalPricePence) * 100)
    : 0;

  return (
    <div data-testid="price-display" className={cn('space-y-1', className)}>
      {/* Main Price */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'font-bold text-gray-900 dark:text-white',
            styles.price
          )}
        >
          {formatPrice(pricePence)}
        </span>

        {/* Original Price (struck through) */}
        {hasDiscount && (
          <span
            className={cn(
              'text-gray-500 line-through dark:text-gray-400',
              styles.original
            )}
          >
            {formatPrice(originalPricePence)}
          </span>
        )}

        {/* Discount Badge */}
        {hasDiscount && showDiscount && (
          <span
            className={cn(
              'rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400',
              styles.discount
            )}
          >
            Save {discountPercentage}%
          </span>
        )}
      </div>

      {/* Per Unit Price (when showing total) */}
      {showPerUnit && quantity > 1 && (
        <p className={cn('text-gray-500 dark:text-gray-400', styles.total)}>
          {formatPrice(pricePence)} each
        </p>
      )}

      {/* Total Price */}
      {showTotal && quantity > 1 && (
        <p className={cn('text-gray-600 dark:text-gray-300', styles.total)}>
          Total: <span className="font-semibold">{formatPrice(totalPence)}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Compact price display for cards and lists
 */
export function PriceCompact({
  pricePence,
  originalPricePence,
  className,
}: {
  pricePence: number;
  originalPricePence?: number;
  className?: string;
}) {
  const hasDiscount = originalPricePence && originalPricePence > pricePence;

  return (
    <div className={cn('flex items-baseline gap-1.5', className)}>
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {formatPrice(pricePence)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-gray-500 line-through dark:text-gray-400">
          {formatPrice(originalPricePence)}
        </span>
      )}
    </div>
  );
}

/**
 * Price range display for products with multiple variants
 */
export function PriceRange({
  minPricePence,
  maxPricePence,
  className,
}: {
  minPricePence: number;
  maxPricePence: number;
  className?: string;
}) {
  const isSamePrice = minPricePence === maxPricePence;

  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      {isSamePrice ? (
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {formatPrice(minPricePence)}
        </span>
      ) : (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(minPricePence)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(maxPricePence)}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Price breakdown for checkout
 */
export interface PriceBreakdownItem {
  label: string;
  amount: number;
  isDiscount?: boolean;
}

export function PriceBreakdown({
  items,
  total,
  className,
}: {
  items: PriceBreakdownItem[];
  total: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
          <span
            className={cn(
              item.isDiscount
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {item.isDiscount ? '-' : ''}
            {formatPrice(item.amount)}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white">
            Total
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PriceDisplay;
