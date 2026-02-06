/**
 * Order History Page
 *
 * Displays a list of all orders for the authenticated user.
 * Guests can access individual orders via tracking token.
 */

import { redirect, Link } from 'react-router'
import type { Route } from './+types/orders'
import { getUserIdFromSession } from '~/services/session.server'
import { prisma } from '~/services/prisma.server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import type { OrderStatus } from '@prisma/client'

/**
 * Meta tags
 */
export function meta() {
  return [
    { title: 'Order History - AIPrintly' },
    { name: 'description', content: 'View your order history and track deliveries' },
  ]
}

/**
 * Loader - Fetch user's orders
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

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPence: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
        },
      },
    },
  })

  return { orders }
}

/**
 * Status badge configuration
 */
const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }
> = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: Clock },
  PAID: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', variant: 'default', icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'default', icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'default', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: AlertCircle },
  REFUNDED: { label: 'Refunded', variant: 'secondary', icon: AlertCircle },
}

/**
 * Order History Page Component
 */
export default function OrdersPage({ loaderData }: Route.ComponentProps) {
  const { orders } = loaderData

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order History
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and track all your orders
          </p>
        </div>

        {orders.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No orders yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                When you place an order, it will appear here.
              </p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status]
              const StatusIcon = statusConfig.icon
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
              const itemSummary = order.items.length === 1
                ? order.items[0].productName
                : `${order.items[0].productName} + ${order.items.length - 1} more`

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </h3>
                            <Badge variant={statusConfig.variant} className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                            {itemSummary}
                          </p>

                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <span>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>

                        {/* Price and Arrow */}
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            £{(order.totalPence / 100).toFixed(2)}
                          </p>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/account"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Account
          </Link>
        </div>
      </div>
    </div>
  )
}
