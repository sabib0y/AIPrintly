/**
 * OutOfCreditsGate Component
 *
 * Blocks access to content when the user has no credits remaining.
 * Shows appropriate messaging for guests vs authenticated users.
 */

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { AlertCircle, Coins, UserPlus, ShoppingCart } from 'lucide-react'

/**
 * OutOfCreditsGate props
 */
export interface OutOfCreditsGateProps {
  /** Content to render when credits are available */
  children: ReactNode
  /** Whether the user is authenticated */
  isAuthenticated?: boolean
  /** Pre-loaded balance (skips fetch) */
  balance?: number
  /** Custom title for the gate message */
  title?: string
  /** Custom description message */
  message?: string
  /** Callback when user is out of credits */
  onOutOfCredits?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * OutOfCreditsGate - Block content when credits depleted
 */
export function OutOfCreditsGate({
  children,
  isAuthenticated = false,
  balance: providedBalance,
  title,
  message,
  onOutOfCredits,
  className,
}: OutOfCreditsGateProps) {
  const [balance, setBalance] = useState<number | null>(providedBalance ?? null)
  const [loading, setLoading] = useState(providedBalance === undefined)

  /**
   * Fetch credit balance
   */
  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()

      if (response.ok && data.success) {
        setBalance(data.balance)

        if (data.balance === 0) {
          onOutOfCredits?.()
        }
      }
    } catch {
      // On error, assume credits available to not block user
      setBalance(1)
    } finally {
      setLoading(false)
    }
  }, [onOutOfCredits])

  useEffect(() => {
    if (providedBalance === undefined) {
      fetchBalance()
    } else if (providedBalance === 0) {
      onOutOfCredits?.()
    }
  }, [providedBalance, fetchBalance, onOutOfCredits])

  // Loading state
  if (loading) {
    return (
      <div role="status" className={cn('p-8', className)}>
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <span className="sr-only">Checking credit balance...</span>
      </div>
    )
  }

  // Has credits - render children
  if (balance !== null && balance > 0) {
    return <>{children}</>
  }

  // No credits - render gate
  const gateTitle = title || "You're out of credits"
  const gateMessage =
    message ||
    (isAuthenticated
      ? 'Purchase more credits to continue creating amazing products.'
      : 'Create an account to get 10 free credits and continue your creative journey.')

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card
        className="w-full max-w-md"
        role="alert"
        aria-live="assertive"
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Coins className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            {gateTitle}
          </CardTitle>
          <CardDescription className="text-base">
            {gateMessage}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-900">
              {isAuthenticated ? 'Credit Packages' : 'Benefits of registering'}
            </h4>
            {isAuthenticated ? (
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">10 credits</span>
                  <span>- Perfect for trying out</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">25 credits</span>
                  <span>- Best value</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">50 credits</span>
                  <span>- For power creators</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span>10 free credits on sign up</span>
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span>Save your creations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span>Track your orders</span>
                </li>
              </ul>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <Button className="w-full" size="lg" asChild>
                <Link to="/credits/purchase">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Credits
                </Link>
              </Button>
              <p className="text-center text-xs text-gray-500">
                Credits never expire and can be used for any generation.
              </p>
            </>
          ) : (
            <>
              <Button className="w-full" size="lg" asChild>
                <Link to="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register for Free
                </Link>
              </Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-sky-600 hover:text-sky-700"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default OutOfCreditsGate
