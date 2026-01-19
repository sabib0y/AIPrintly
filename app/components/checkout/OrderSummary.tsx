/**
 * OrderSummary Component
 *
 * Displays order items and totals for checkout review.
 */

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { formatPrice } from '~/lib/utils'
import { ShoppingBag } from 'lucide-react'

export interface OrderItem {
  id: string
  name: string
  variantName: string
  quantity: number
  unitPricePence: number
  imageUrl?: string
}

export interface OrderSummaryProps {
  /** Order items */
  items: OrderItem[]
  /** Subtotal in pence */
  subtotalPence: number
  /** Shipping cost in pence */
  shippingPence: number
  /** Whether this is for the confirmation page */
  isConfirmation?: boolean
}

export function OrderSummary({
  items,
  subtotalPence,
  shippingPence,
  isConfirmation = false,
}: OrderSummaryProps) {
  const totalPence = subtotalPence + shippingPence
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Card data-testid="order-summary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {isConfirmation ? 'Order Details' : 'Order Summary'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3"
              data-testid={`order-item-${item.id}`}
            >
              {/* Item Image */}
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex flex-1 flex-col min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.variantName}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Qty: {item.quantity}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(item.unitPricePence * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatPrice(subtotalPence)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Shipping</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {shippingPence === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(shippingPence)
              )}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900 dark:text-white">
              Total
            </span>
            <span
              className="text-lg font-semibold text-gray-900 dark:text-white"
              data-testid="order-total"
            >
              {formatPrice(totalPence)}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Including VAT where applicable
          </p>
        </div>

        {/* Trust Indicators */}
        {!isConfirmation && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
              <span>Secure payment with Stripe</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact order summary for smaller spaces
 */
export function OrderSummaryCompact({
  itemCount,
  totalPence,
}: {
  itemCount: number
  totalPence: number
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
      data-testid="order-summary-compact"
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-gray-500" aria-hidden="true" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
      <span className="font-semibold text-gray-900 dark:text-white">
        {formatPrice(totalPence)}
      </span>
    </div>
  )
}
