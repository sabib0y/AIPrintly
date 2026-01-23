/**
 * CreditPackSelector Component
 *
 * Displays available credit packs and handles purchase flow.
 */

import { useState } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { AlertCircle, Coins, Check } from 'lucide-react'
import {
  CREDIT_PACKS,
  formatPrice,
  pricePerCredit,
  type CreditPack,
} from '~/lib/credit-packs'

/**
 * CreditPackSelector props
 */
export interface CreditPackSelectorProps {
  /** Whether the purchase flow is loading */
  isLoading?: boolean
  /** Callback when a pack is selected for purchase */
  onPurchase?: (packId: string) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * CreditPackSelector - Display and purchase credit packs
 */
export function CreditPackSelector({
  isLoading = false,
  onPurchase,
  className,
}: CreditPackSelectorProps) {
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle purchase button click
   */
  const handlePurchase = async (pack: CreditPack) => {
    setError(null)
    setPurchasingPack(pack.id)

    try {
      if (onPurchase) {
        onPurchase(pack.id)
        return
      }

      // Default behaviour: call API and redirect to Stripe
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start checkout'
      setError(message)
      setPurchasingPack(null)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Choose Your Credit Pack
        </h2>
        <p className="mt-2 text-gray-600">
          Credits never expire and can be used for any AI generation.
        </p>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => {
          const isPurchasing = purchasingPack === pack.id
          const isDisabled = isLoading || isPurchasing || !!purchasingPack

          return (
            <Card
              key={pack.id}
              className={cn(
                'relative flex flex-col',
                pack.bestValue && 'border-2 border-sky-600'
              )}
              role="article"
              aria-labelledby={`pack-${pack.id}-title`}
            >
              {pack.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-sky-600 text-white">Best Value</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                  <Coins className="h-8 w-8 text-sky-600" />
                </div>
                <CardTitle id={`pack-${pack.id}-title`}>
                  {pack.name}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(pack.pricePence)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-3 text-center">
                  <p className="text-sm text-gray-600">
                    {pricePerCredit(pack).toFixed(2)}p per credit
                  </p>

                  <ul className="space-y-2 text-left text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{pack.credits} AI generations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Never expires</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Use for any product</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handlePurchase(pack)}
                  disabled={isDisabled}
                  variant={pack.bestValue ? 'default' : 'outline'}
                  aria-label={`Purchase ${pack.name}`}
                >
                  {isPurchasing ? 'Purchasing...' : 'Purchase'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
        <p>
          Secure payment processing by Stripe. Credits are added instantly after
          purchase.
        </p>
      </div>
    </div>
  )
}

export default CreditPackSelector
