/**
 * Account Settings Page
 *
 * Displays user account information and provides access to account management
 * features including the dangerous "Delete Account" option.
 */

import { redirect, Link, useLoaderData } from 'react-router'
import { AlertTriangle, Mail, Calendar, Package, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { prisma } from '~/services/prisma.server'
import { getUserIdFromSession } from '~/services/session.server'
import type { Route } from './+types/account'

/**
 * Meta tags for the account page
 */
export function meta() {
  return [
    { title: 'Account Settings - AIPrintly' },
    {
      name: 'description',
      content: 'Manage your AIPrintly account settings and preferences.',
    },
  ]
}

/**
 * Loader to fetch user account data
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Check authentication
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    const url = new URL(request.url)
    const searchParams = new URLSearchParams([
      ['redirectTo', url.pathname + url.search],
    ])
    throw redirect(`/login?${searchParams}`)
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw redirect('/login')
  }

  // Get order count for display
  const orderCount = await prisma.order.count({
    where: { userId },
  })

  // Format member since date
  const memberSince = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt)

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
    orderCount,
    memberSince,
  }
}

/**
 * Account Settings Page Component
 */
export default function AccountPage({ loaderData }: Route.ComponentProps) {
  const { user, orderCount, memberSince } = loaderData

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        {/* Account Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-start space-x-3">
              <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Address
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start space-x-3">
              <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Member Since
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {memberSince}
                </p>
              </div>
            </div>

            {/* Order Count */}
            <div className="flex items-start space-x-3">
              <Package className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Total Orders
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
            <CardDescription>Access your account features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/orders"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Order History
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-lg text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
            </div>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Delete Account
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" asChild className="shrink-0">
                  <Link to="/account/delete">Delete Account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
