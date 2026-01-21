/**
 * CartItem Component
 *
 * Displays a single cart item with product image, details,
 * quantity controls, and remove button.
 */

import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { QuantityControl } from './QuantityControl'
import { formatPrice } from '~/lib/utils'
import { Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '~/lib/utils'

export interface CartItemData {
  id: string
  quantity: number
  unitPricePence: number
  configuration: {
    id: string
    mockupUrl: string | null
    customisation?: {
      qualityWarnings?: string[]
    } | null
    product: {
      name: string
      category: string
    }
    variant: {
      name: string
      stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
      colour?: string | null
      size?: string | null
    }
    asset: {
      storageUrl: string
    }
  }
}

export interface CartItemProps {
  /** Cart item data */
  item: CartItemData
  /** Callback when quantity changes */
  onQuantityChange: (itemId: string, quantity: number) => void
  /** Callback when item is removed */
  onRemove: (itemId: string) => void
  /** Whether the item is being updated */
  isUpdating?: boolean
  /** Validation error for this item */
  error?: string
  /** Validation warning for this item */
  warning?: string
  /** Updated price if changed */
  newPricePence?: number
}

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  isUpdating = false,
  error,
  warning,
  newPricePence,
}: CartItemProps) {
  const {
    id,
    quantity,
    unitPricePence,
    configuration: { mockupUrl, customisation, product, variant, asset },
  } = item

  const totalPricePence = unitPricePence * quantity
  const imageUrl = mockupUrl || asset.storageUrl
  const isOutOfStock = variant.stockStatus === 'OUT_OF_STOCK'
  const isLowStock = variant.stockStatus === 'LOW_STOCK'
  const qualityWarnings = customisation?.qualityWarnings ?? []
  const hasQualityWarnings = qualityWarnings.length > 0

  const handleQuantityChange = (newQuantity: number) => {
    onQuantityChange(id, newQuantity)
  }

  const handleRemove = () => {
    onRemove(id)
  }

  return (
    <div
      className={cn(
        'flex gap-4 py-4',
        isUpdating && 'opacity-60 pointer-events-none',
        error && 'border-l-4 border-l-red-500 pl-4 -ml-4'
      )}
      data-testid={`cart-item-${id}`}
    >
      {/* Product Image */}
      <Link
        to={`/build/${product.category.toLowerCase()}/${item.configuration.id}`}
        className="flex-shrink-0"
      >
        <div className="h-24 w-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/build/${product.category.toLowerCase()}/${item.configuration.id}`}
              className="font-medium text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 truncate block"
            >
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {variant.name}
              {variant.colour && ` - ${variant.colour}`}
              {variant.size && ` / ${variant.size}`}
            </p>

            {/* Stock Status Badge */}
            {isOutOfStock && (
              <Badge variant="destructive" className="mt-1">
                Out of Stock
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning" className="mt-1">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Item Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-medium text-gray-900 dark:text-white">
              {formatPrice(totalPricePence)}
            </p>
            {quantity > 1 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatPrice(unitPricePence)} each
              </p>
            )}
            {newPricePence && newPricePence !== unitPricePence && (
              <p className="text-sm text-red-600">
                Now {formatPrice(newPricePence)} each
              </p>
            )}
          </div>
        </div>

        {/* Error/Warning Messages */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600" role="alert">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {warning && !error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-600" role="alert">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{warning}</span>
          </div>
        )}
        {hasQualityWarnings && !error && !warning && (
          <div className="mt-2 text-sm text-amber-600" role="alert">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">Quality warnings:</span>
            </div>
            <ul className="ml-6 mt-1 list-disc text-xs">
              {qualityWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions Row */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <QuantityControl
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            disabled={isOutOfStock || isUpdating}
            isLoading={isUpdating}
            aria-label={product.name}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            aria-label={`Remove ${product.name} from cart`}
            data-testid={`remove-item-${id}`}
          >
            <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for cart item
 */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 py-4" data-testid="cart-item-skeleton">
      <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}
