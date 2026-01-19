/**
 * GuestGate Component
 *
 * Prompts guests to register or continue as guest before checkout.
 */

import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { User, Mail, Lock, Check } from 'lucide-react'

export interface GuestGateProps {
  /** Callback when user chooses to continue as guest */
  onContinueAsGuest: () => void
  /** Callback when user successfully creates an account */
  onAccountCreated?: (email: string) => void
  /** Whether actions are being processed */
  isLoading?: boolean
  /** Pre-filled email for registration */
  initialEmail?: string
}

const benefits = [
  'Track your orders easily',
  'Save your designs for later',
  'Get 10 free AI credits (vs 3 for guests)',
  'Faster checkout next time',
]

export function GuestGate({
  onContinueAsGuest,
  onAccountCreated,
  isLoading = false,
  initialEmail = '',
}: GuestGateProps) {
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // TODO: Implement actual registration
    // For now, just call the callback
    onAccountCreated?.(email)
  }

  return (
    <div className="space-y-6" data-testid="guest-gate">
      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" aria-hidden="true" />
            Create an Account
          </CardTitle>
          <CardDescription>
            Get more from your AIPrintly experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </li>
            ))}
          </ul>

          {!showRegisterForm ? (
            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                onClick={() => setShowRegisterForm(true)}
                disabled={isLoading}
              >
                Create Account
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login?redirectTo=/checkout">
                  Already have an account? Sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="register-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@example.com"
                    error={!!errors.email}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="At least 8 characters"
                    error={!!errors.password}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Confirm your password"
                    error={!!errors.confirmPassword}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowRegisterForm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Continue as Guest */}
      {!showRegisterForm && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={onContinueAsGuest}
                disabled={isLoading}
                data-testid="continue-as-guest"
              >
                Continue as Guest
              </Button>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                You can create an account after placing your order
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
