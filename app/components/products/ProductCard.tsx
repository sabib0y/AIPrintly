/**
 * ProductCard Component
 *
 * Display card for products in the catalogue.
 * Shows product image, name, description, price, and actions.
 */

import { Link } from 'react-router';
import type { Product, ProductCategory, StockStatus } from '@prisma/client';
import { cn, formatPrice, truncate } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';

/**
 * Map category to URL-friendly slug for builder route
 */
const CATEGORY_TO_BUILDER_SLUG: Record<ProductCategory, string> = {
  MUG: 'mug',
  APPAREL: 'apparel',
  PRINT: 'print',
  STORYBOOK: 'storybook',
};

/**
 * Map category to display name
 */
const CATEGORY_DISPLAY_NAME: Record<ProductCategory, string> = {
  MUG: 'Mug',
  APPAREL: 'Apparel',
  PRINT: 'Print',
  STORYBOOK: 'Storybook',
};

/**
 * Stock status configuration
 */
const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  IN_STOCK: { label: 'In Stock', variant: 'success' },
  LOW_STOCK: { label: 'Low Stock', variant: 'warning' },
  OUT_OF_STOCK: { label: 'Out of Stock', variant: 'destructive' },
};

export interface ProductCardProps {
  /** Product data to display */
  product: Product;
  /** Optional product image URL */
  imageUrl?: string;
  /** Stock status to display */
  stockStatus?: StockStatus;
  /** Number of available variants */
  variantCount?: number;
  /** Show the customise button */
  showCustomiseButton?: boolean;
  /** Show "From" prefix for price when product has multiple prices */
  hasMultiplePrices?: boolean;
  /** Loading state - shows skeleton */
  isLoading?: boolean;
  /** Click handler for the entire card */
  onClick?: (product: Product) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProductCard displays a single product in the catalogue grid.
 *
 * Features:
 * - Product image or placeholder
 * - Name, description, and price
 * - Category badge
 * - Stock status indicator
 * - Variant count
 * - View and Customise actions
 *
 * @example
 * ```tsx
 * <ProductCard
 *   product={product}
 *   imageUrl={product.imageUrl}
 *   stockStatus="IN_STOCK"
 *   showCustomiseButton
 * />
 * ```
 */
export function ProductCard({
  product,
  imageUrl,
  stockStatus,
  variantCount,
  showCustomiseButton = false,
  hasMultiplePrices = false,
  isLoading = false,
  onClick,
  className,
}: ProductCardProps) {
  // Show skeleton when loading
  if (isLoading) {
    return <ProductCardSkeleton />;
  }

  const builderSlug = CATEGORY_TO_BUILDER_SLUG[product.category];
  const categoryName = CATEGORY_DISPLAY_NAME[product.category];
  const isOutOfStock = stockStatus === 'OUT_OF_STOCK';

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <Card
      data-testid="product-card"
      aria-label={`${product.name} product card`}
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        onClick && 'cursor-pointer hover:-translate-y-1',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            data-testid="product-image-placeholder"
            className="flex h-full w-full items-center justify-center text-gray-400"
          >
            <ProductPlaceholderIcon className="h-16 w-16" />
          </div>
        )}

        {/* Category Badge */}
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 bg-white/90 dark:bg-gray-900/90"
        >
          {categoryName}
        </Badge>

        {/* Stock Status Badge */}
        {stockStatus && (
          <div data-testid="stock-status" className="absolute right-3 top-3">
            <Badge variant={STOCK_STATUS_CONFIG[stockStatus].variant}>
              {STOCK_STATUS_CONFIG[stockStatus].label}
            </Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
        <CardDescription
          data-testid="product-description"
          className="line-clamp-2 min-h-[2.5rem]"
        >
          {truncate(product.description, 100)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Price and Variant Info */}
        <div className="mb-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            {hasMultiplePrices && (
              <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
            )}
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPrice(product.sellingPricePence)}
            </span>
          </div>
          {variantCount !== undefined && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {variantCount} {variantCount === 1 ? 'option' : 'options'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/products/${product.id}`}>View</Link>
          </Button>
          {showCustomiseButton && (
            <>
              {isOutOfStock ? (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  disabled
                  aria-label="Customise (out of stock)"
                >
                  Customise
                </Button>
              ) : (
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link to={`/build/${builderSlug}`}>Customise</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for ProductCard
 */
function ProductCardSkeleton() {
  return (
    <Card data-testid="product-card-skeleton" className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-10 w-full" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Placeholder icon for products without images
 */
function ProductPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

/**
 * Export skeleton for use in loading states
 */
export { ProductCardSkeleton };
