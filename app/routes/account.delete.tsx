/**
 * Account Delete Confirmation Page
 *
 * GDPR-compliant account deletion with clear warnings about what will
 * be deleted and what will be retained for legal compliance.
 */

import {
  redirect,
  Link,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { AlertTriangle, Trash2, X, Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { prisma } from '~/services/prisma.server'
import {
  getSession,
  getUserIdFromSession,
  destroySession,
} from '~/services/session.server'
import { checkAuthRateLimit, getClientIp } from '~/services/rate-limiter.server'
import type { Route } from './+types/account.delete'

/**
 * Meta tags for the delete page
 */
export function meta() {
  return [
    { title: 'Delete Account - AIPrintly' },
    {
      name: 'description',
      content: 'Permanently delete your AIPrintly account.',
    },
  ]
}

/**
 * Schema for account deletion form
 */
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm deletion'),
})

/**
 * Loader to verify authentication and fetch user email
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    const url = new URL(request.url)
    const searchParams = new URLSearchParams([
      ['redirectTo', url.pathname + url.search],
    ])
    throw redirect(`/login?${searchParams}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  })

  if (!user) {
    throw redirect('/login')
  }

  return {
    email: user.email,
  }
}

/**
 * Action to handle account deletion
 */
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request)
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    return { error: 'Authentication required' }
  }

  // Check rate limit
  const ip = getClientIp(request)
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.allowed) {
    return {
      error: 'Too many attempts. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    }
  }

  // Parse and validate form data
  const formData = await request.formData()
  const rawData = Object.fromEntries(formData)
  const parseResult = deleteAccountSchema.safeParse(rawData)

  if (!parseResult.success) {
    const errors = parseResult.error.flatten()
    return {
      errors: errors.fieldErrors,
    }
  }

  const { password } = parseResult.data

  // Fetch user with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  })

  if (!user) {
    return { error: 'User not found' }
  }

  // Check if user has a password
  if (!user.passwordHash) {
    return {
      error:
        'Cannot delete account: no password set. Please set a password first or contact support.',
    }
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) {
    return { error: 'Incorrect password' }
  }

  try {
    // Log the deletion request
    console.info(
      `[ACCOUNT_DELETION] User ${userId} (${user.email}) confirmed account deletion`
    )

    // Delete in order of dependencies

    // 1. Delete credit transactions
    await prisma.creditTransaction.deleteMany({
      where: { userCredits: { userId } },
    })

    // 2. Delete user credits
    await prisma.userCredits.deleteMany({
      where: { userId },
    })

    // 3. Delete generation jobs
    await prisma.generationJob.deleteMany({
      where: { session: { userId } },
    })

    // 4. Delete cart items
    await prisma.cartItem.deleteMany({
      where: { session: { userId } },
    })

    // 5. Delete assets
    await prisma.asset.deleteMany({
      where: { userId },
    })

    // 6. Delete auth tokens
    await prisma.authToken.deleteMany({
      where: { userId },
    })

    // 7. Delete sessions
    await prisma.session.deleteMany({
      where: { userId },
    })

    // 8. Anonymise user (keeps orders linked)
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.local`,
        passwordHash: null,
      },
    })

    console.info(`[ACCOUNT_DELETION] Successfully deleted account for user ${userId}`)

    // Destroy session and redirect
    const destroyHeader = await destroySession(session, false)

    throw redirect('/?deleted=true', {
      headers: {
        'Set-Cookie': destroyHeader,
      },
    })
  } catch (error) {
    // Re-throw redirects
    if (error instanceof Response) {
      throw error
    }

    console.error('[ACCOUNT_DELETION] Error:', error)
    return {
      error:
        'Account deletion failed. Please try again or contact support if the issue persists.',
    }
  }
}

/**
 * Account Delete Confirmation Page Component
 */
export default function AccountDeletePage({ loaderData }: Route.ComponentProps) {
  const { email } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        {/* Warning Banner */}
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="text-sm font-medium text-red-800 dark:text-red-300">
                Warning: This action is permanent
              </h2>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Deleting your account cannot be undone. Please read the
                information below carefully.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span>Delete Account</span>
            </CardTitle>
            <CardDescription>
              You are about to delete the account for{' '}
              <strong className="text-gray-900 dark:text-white">{email}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* What will be deleted */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                What will be deleted:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>Your uploaded images and AI-generated assets</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>Your shopping cart and saved items</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>Your AI generation credits and history</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>Your account login and personal details</span>
                </li>
              </ul>
            </div>

            {/* What will be kept */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                What will be kept (legal compliance):
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>
                    Order history (retained for 6 years per HMRC requirements)
                  </span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>
                    Transaction records and receipts for accounting purposes
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                Your personal details in order records will be anonymised after
                the legal retention period.
              </p>
            </div>

            {/* Password Confirmation Form */}
            <Form method="post" className="space-y-4">
              {/* Error Messages */}
              {actionData?.error && (
                <div
                  role="alert"
                  className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  data-testid="form-error"
                >
                  {actionData.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  Enter your password to confirm deletion
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  aria-invalid={!!actionData?.errors?.password}
                  aria-describedby={
                    actionData?.errors?.password ? 'password-error' : undefined
                  }
                  data-testid="password-input"
                  required
                />
                {actionData?.errors?.password && (
                  <p
                    id="password-error"
                    role="alert"
                    data-testid="password-error"
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {actionData.errors.password[0]}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link to="/account">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  data-testid="delete-account-button"
                >
                  {isSubmitting ? 'Deleting Account...' : 'Delete My Account'}
                </Button>
              </div>
            </Form>
          </CardContent>

          <CardFooter className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              If you&apos;re having issues with your account, please{' '}
              <Link
                to="/contact"
                className="font-medium text-sky-600 hover:underline dark:text-sky-400"
              >
                contact support
              </Link>{' '}
              before deleting. We may be able to help.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
