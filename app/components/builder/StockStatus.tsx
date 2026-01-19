/**
 * StockStatus Component
 *
 * Stock availability indicator for product variants.
 * Displays current stock status with appropriate styling.
 */

import { cn } from '~/lib/utils';
import { Badge } from '~/components/ui/badge';
import type { StockStatus as StockStatusType } from '@prisma/client';

export interface StockStatusProps {
  /** Stock status value */
  status: StockStatusType;
  /** Show as inline badge */
  variant?: 'badge' | 'inline' | 'text';
  /** Show stock icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Stock status configuration
 */
const STATUS_CONFIG: Record<
  StockStatusType,
  {
    label: string;
    badge: 'success' | 'warning' | 'destructive';
    textClass: string;
    bgClass: string;
  }
> = {
  IN_STOCK: {
    label: 'In Stock',
    badge: 'success',
    textClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    badge: 'warning',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'destructive',
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
  },
};

/**
 * StockStatus displays the availability of a product variant.
 *
 * @example
 * ```tsx
 * <StockStatus status="IN_STOCK" variant="badge" />
 * <StockStatus status="LOW_STOCK" variant="inline" showIcon />
 * <StockStatus status="OUT_OF_STOCK" variant="text" />
 * ```
 */
export function StockStatus({
  status,
  variant = 'badge',
  showIcon = false,
  className,
}: StockStatusProps) {
  const config = STATUS_CONFIG[status];

  // Badge variant
  if (variant === 'badge') {
    return (
      <Badge
        data-testid="stock-status"
        variant={config.badge}
        className={className}
      >
        {showIcon && <StockIcon status={status} className="mr-1 h-3 w-3" />}
        {config.label}
      </Badge>
    );
  }

  // Inline variant (pill style)
  if (variant === 'inline') {
    return (
      <span
        data-testid="stock-status"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
          config.bgClass,
          config.textClass,
          className
        )}
      >
        {showIcon && <StockIcon status={status} className="h-4 w-4" />}
        {config.label}
      </span>
    );
  }

  // Text variant
  return (
    <span
      data-testid="stock-status"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        config.textClass,
        className
      )}
    >
      {showIcon && <StockIcon status={status} className="h-4 w-4" />}
      {config.label}
    </span>
  );
}

/**
 * Stock icon based on status
 */
function StockIcon({
  status,
  className,
}: {
  status: StockStatusType;
  className?: string;
}) {
  switch (status) {
    case 'IN_STOCK':
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
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
      );

    case 'LOW_STOCK':
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
            d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      );

    case 'OUT_OF_STOCK':
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
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

/**
 * Stock message for unavailable items
 */
export function StockMessage({
  status,
  estimatedRestockDate,
  className,
}: {
  status: StockStatusType;
  estimatedRestockDate?: Date;
  className?: string;
}) {
  if (status === 'IN_STOCK') {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        STATUS_CONFIG[status].bgClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <StockIcon status={status} className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className={cn('font-medium', STATUS_CONFIG[status].textClass)}>
            {status === 'LOW_STOCK'
              ? 'Limited stock available'
              : 'Currently out of stock'}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {status === 'LOW_STOCK'
              ? 'Order soon to secure your item'
              : estimatedRestockDate
                ? `Expected back in stock: ${estimatedRestockDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}`
                : 'We\'ll notify you when it\'s available again'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StockStatus;
