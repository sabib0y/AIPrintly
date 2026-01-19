/**
 * QuantityControl Component
 *
 * +/- quantity buttons for cart items with accessibility support.
 */

import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { Minus, Plus } from 'lucide-react'

export interface QuantityControlProps {
  /** Current quantity */
  quantity: number
  /** Callback when quantity changes */
  onQuantityChange: (quantity: number) => void
  /** Minimum allowed quantity (default: 1) */
  min?: number
  /** Maximum allowed quantity (default: 99) */
  max?: number
  /** Whether the control is disabled */
  disabled?: boolean
  /** Whether a change is in progress */
  isLoading?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional class name */
  className?: string
  /** Accessible label for the item */
  'aria-label'?: string
}

export function QuantityControl({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false,
  isLoading = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: QuantityControlProps) {
  const canDecrease = quantity > min && !disabled && !isLoading
  const canIncrease = quantity < max && !disabled && !isLoading

  const handleDecrease = () => {
    if (canDecrease) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (canIncrease) {
      onQuantityChange(quantity + 1)
    }
  }

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs w-6' : 'text-sm w-8'

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="group"
      aria-label={ariaLabel ? `Quantity for ${ariaLabel}` : 'Quantity controls'}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleDecrease}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        data-testid="quantity-decrease"
      >
        <Minus className={iconSize} aria-hidden="true" />
      </Button>

      <span
        className={cn(
          'text-center font-medium tabular-nums',
          textSize,
          isLoading && 'animate-pulse'
        )}
        aria-live="polite"
        aria-atomic="true"
        data-testid="quantity-value"
      >
        {quantity}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleIncrease}
        disabled={!canIncrease}
        aria-label="Increase quantity"
        data-testid="quantity-increase"
      >
        <Plus className={iconSize} aria-hidden="true" />
      </Button>
    </div>
  )
}
