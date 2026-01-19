/**
 * CreditBalance Component
 *
 * Displays the user's current credit balance with visual indicators
 * for low/empty credit states.
 */

import { useEffect, useState, useCallback } from 'react'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'
import { Coins } from 'lucide-react'

/**
 * CreditBalance props
 */
export interface CreditBalanceProps {
  /** Display variant */
  variant?: 'compact' | 'full'
  /** Initial balance (shown before fetch completes) */
  initialBalance?: number
  /** Callback when balance is refreshed */
  onRefresh?: (balance: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Credit threshold for warning state
 */
const LOW_CREDIT_THRESHOLD = 2

/**
 * CreditBalance - Display credit balance with status indicators
 */
export function CreditBalance({
  variant = 'full',
  initialBalance,
  onRefresh,
  className,
}: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(initialBalance ?? null)
  const [loading, setLoading] = useState(initialBalance === undefined)
  const [error, setError] = useState(false)

  /**
   * Fetch credit balance from API
   */
  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(true)
        return
      }

      setBalance(data.balance)
      setError(false)
      onRefresh?.(data.balance)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [onRefresh])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  /**
   * Determine colour based on balance
   */
  const getColourClass = () => {
    if (error || balance === null) return 'text-gray-400'
    if (balance === 0) return 'text-red-600'
    if (balance <= LOW_CREDIT_THRESHOLD) return 'text-amber-600'
    return 'text-green-600'
  }

  /**
   * Get display value
   */
  const displayValue = error ? '--' : (balance ?? '--')

  /**
   * Get accessibility label
   */
  const getAriaLabel = () => {
    if (error) return 'Unable to load credit balance'
    if (balance === null) return 'Loading credit balance'
    return `${balance} credits remaining`
  }

  if (variant === 'compact') {
    return (
      <div
        data-testid="credit-balance"
        className={cn(
          'inline-flex items-center gap-1 text-sm font-medium',
          getColourClass(),
          className
        )}
        aria-label={getAriaLabel()}
      >
        {loading ? (
          <div role="status">
            <Skeleton className="h-4 w-6" />
            <span className="sr-only">Loading credits...</span>
          </div>
        ) : (
          <>
            <span>{displayValue}</span>
            <span className="text-xs text-gray-500">credits</span>
            <span className="sr-only">{balance} credits remaining</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      data-testid="credit-balance"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2',
        getColourClass(),
        balance === 0 && 'border-red-200 bg-red-50',
        balance !== null && balance > 0 && balance <= LOW_CREDIT_THRESHOLD && 'border-amber-200 bg-amber-50',
        balance !== null && balance > LOW_CREDIT_THRESHOLD && 'border-green-200 bg-green-50',
        error && 'border-gray-200 bg-gray-50',
        className
      )}
      aria-label={getAriaLabel()}
    >
      <Coins
        data-testid="credit-icon"
        className={cn('h-5 w-5', getColourClass())}
      />

      {loading ? (
        <div role="status" className="flex items-center gap-2">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-4 w-12" />
          <span className="sr-only">Loading credits...</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold">{displayValue}</span>
          <span className="text-sm text-gray-600">credits</span>
          <span className="sr-only">{balance} credits remaining</span>
        </div>
      )}
    </div>
  )
}

export default CreditBalance
