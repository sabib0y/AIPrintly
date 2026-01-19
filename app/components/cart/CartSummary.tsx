/**
 * CartSummary Component
 *
 * Displays cart totals and checkout button.
 */

import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { formatPrice } from '~/lib/utils'
import { ShoppingBag, AlertCircle } from 'lucide-react'

export interface CartSummaryProps {
  /** Subtotal in pence */
  subtotalPence: number
  /** Shipping cost in pence */
  shippingPence: number
  /** Total number of items in cart */
  itemCount: number
  /** Whether the cart is loading */
  isLoading?: boolean
  /** Whether checkout is disabled (e.g., validation errors) */
  checkoutDisabled?: boolean
  /** Message explaining why checkout is disabled */
  checkoutDisabledMessage?: string
  /** Callback for checkout button */
  onCheckout?: () => void
}

export function CartSummary({
  subtotalPence,
  shippingPence,
  itemCount,
  isLoading = false,
  checkoutDisabled = false,
  checkoutDisabledMessage,
  onCheckout,
}: CartSummaryProps) {
  const totalPence = subtotalPence + shippingPence
  const isFreeShipping = shippingPence === 0 && subtotalPence > 0

  return (
    <Card data-testid="cart-summary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <CartSummarySkeleton />
        ) : (
          <>
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
              <span
                className="font-medium text-gray-900 dark:text-white"
                data-testid="cart-subtotal"
              >
                {formatPrice(subtotalPence)}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Shipping
              </span>
              <span
                className="font-medium text-gray-900 dark:text-white"
                data-testid="cart-shipping"
              >
                {isFreeShipping ? (
                  <span className="text-green-600">Free</span>
                ) : subtotalPence === 0 ? (
                  '-'
                ) : (
                  formatPrice(shippingPence)
                )}
              </span>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900 dark:text-white">
                Total
              </span>
              <span
                className="text-lg font-semibold text-gray-900 dark:text-white"
                data-testid="cart-total"
              >
                {formatPrice(totalPence)}
              </span>
            </div>

            {/* VAT Note */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Includes VAT where applicable
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Checkout Disabled Message */}
        {checkoutDisabled && checkoutDisabledMessage && (
          <div
            className="flex items-center gap-2 text-sm text-red-600 w-full"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{checkoutDisabledMessage}</span>
          </div>
        )}

        {/* Checkout Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={isLoading || checkoutDisabled || itemCount === 0}
          onClick={onCheckout}
          asChild={!onCheckout}
          data-testid="checkout-button"
        >
          {onCheckout ? (
            'Proceed to Checkout'
          ) : (
            <Link to="/checkout">Proceed to Checkout</Link>
          )}
        </Button>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure checkout with Stripe</span>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Loading skeleton for cart summary
 */
function CartSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Separator />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  )
}

/**
 * Empty Cart Component
 */
export function EmptyCart() {
  return (
    <div
      className="py-16 text-center"
      data-testid="empty-cart"
    >
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <ShoppingBag
          className="h-12 w-12 text-gray-400"
          aria-hidden="true"
        />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Your cart is empty
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Looks like you haven&apos;t added anything yet.
      </p>
      <Button asChild className="mt-6">
        <Link to="/products">Browse Products</Link>
      </Button>
    </div>
  )
}
