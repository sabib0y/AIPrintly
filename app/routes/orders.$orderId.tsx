/**
 * Order Tracking Page
 *
 * Displays order details and fulfilment status for both authenticated
 * users and anonymous access via tracking token.
 *
 * Routes:
 * - /orders/{orderId}?token={trackingToken} - Anonymous access
 * - /orders/{orderId} - Authenticated user (owner only)
 */

import { data, redirect } from 'react-router'
import type { Route } from './+types/orders.$orderId'
import { getOrderById, getOrderByTrackingToken } from '~/services/orders.server'
import { getSession, getUserIdFromSession } from '~/services/session.server'
import { prisma } from '~/services/prisma.server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Mail,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useState } from 'react'
import type { OrderStatus, FulfilmentStatus } from '@prisma/client'

/**
 * Loader - Fetch order with authorisation check
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { orderId } = params
  const url = new URL(request.url)
  const trackingToken = url.searchParams.get('token')

  // If tracking token provided, use anonymous access
  if (trackingToken) {
    const order = await getOrderByTrackingToken(trackingToken)

    if (!order || order.id !== orderId) {
      throw data({ error: 'Order not found' }, { status: 404 })
    }

    return data({ order, isAnonymous: true })
  }

  // Otherwise, require authentication and ownership
  const session = await getSession(request)
  const userId = await getUserIdFromSession(request)

  // Get user if logged in
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null

  const order = await getOrderById(orderId)

  if (!order) {
    throw data({ error: 'Order not found' }, { status: 404 })
  }

  // Check authorisation: must be owner (user or session)
  const isOwner =
    (user && order.userId === user.id) ||
    (!user && order.sessionId === session.id)

  if (!isOwner) {
    throw data({ error: 'Access denied' }, { status: 403 })
  }

  return data({ order, isAnonymous: false })
}

/**
 * Meta function
 */
export function meta({ data }: Route.MetaArgs) {
  const orderNumber = data?.order?.orderNumber ?? 'Order'
  return [
    { title: `${orderNumber} | AIPrintly` },
    { name: 'description', content: 'Track your order status and delivery' },
  ]
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

const FULFILMENT_STATUS_CONFIG: Record<
  FulfilmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  SENT: { label: 'In Production', variant: 'default' },
  FULFILLED: { label: 'Shipped', variant: 'default' },
  FAILED: { label: 'Failed', variant: 'destructive' },
}

/**
 * Timeline step component
 */
function TimelineStep({
  status,
  label,
  isCompleted,
  isCurrent,
  timestamp,
}: {
  status: string
  label: string
  isCompleted: boolean
  isCurrent: boolean
  timestamp?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isCompleted
              ? 'bg-green-500 text-white'
              : isCurrent
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="h-8 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />
      </div>
      <div className="pb-6">
        <p
          className={`font-medium ${
            isCompleted || isCurrent
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400'
          }`}
        >
          {label}
        </p>
        {timestamp && (
          <p className="text-sm text-gray-500">{timestamp}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Copy to clipboard button
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}

/**
 * Order Tracking Page Component
 */
export default function OrderTrackingPage({
  loaderData,
}: Route.ComponentProps) {
  const { order, isAnonymous } = loaderData

  const statusConfig = ORDER_STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig.icon
  const shippingAddress = order.shippingAddress as Record<string, string>

  // Calculate timeline steps
  const timelineSteps = [
    { status: 'PAID', label: 'Order Placed', completed: true },
    {
      status: 'PROCESSING',
      label: 'In Production',
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'SHIPPED',
      label: 'Shipped',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'DELIVERED',
      label: 'Delivered',
      completed: order.status === 'DELIVERED',
    },
  ]

  const currentStepIndex = timelineSteps.findIndex(
    (step) => step.status === order.status
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order {order.orderNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="text-sm py-1 px-3">
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Timeline & Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Timeline */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {timelineSteps.map((step, index) => (
                    <TimelineStep
                      key={step.status}
                      status={step.status}
                      label={step.label}
                      isCompleted={step.completed}
                      isCurrent={index === currentStepIndex}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const fulfilmentConfig =
                    FULFILMENT_STATUS_CONFIG[item.fulfilmentStatus]

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 py-4 border-b last:border-0"
                    >
                      {/* Product thumbnail */}
                      {item.configuration?.asset?.storageUrl ? (
                        <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.configuration.asset.storageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.variantName} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            £{(item.totalPricePence / 100).toFixed(2)}
                          </p>
                        </div>

                        {/* Fulfilment status */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge variant={fulfilmentConfig.variant}>
                            {fulfilmentConfig.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            via {item.fulfilmentProvider}
                          </span>
                        </div>

                        {/* Tracking info */}
                        {item.trackingNumber && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Tracking Number
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                                {item.trackingNumber}
                              </code>
                              <CopyButton
                                text={item.trackingNumber}
                                label="tracking number"
                              />
                              {item.trackingUrl && (
                                <a
                                  href={item.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary & Shipping */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>£{(order.subtotalPence / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>
                    {order.shippingPence === 0
                      ? 'Free'
                      : `£${(order.shippingPence / 100).toFixed(2)}`}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>£{(order.totalPence / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <address className="text-sm not-italic text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {shippingAddress.fullName}
                </p>
                <p>{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && (
                  <p>{shippingAddress.addressLine2}</p>
                )}
                <p>
                  {shippingAddress.city}, {shippingAddress.postcode}
                </p>
                <p>{shippingAddress.country || 'United Kingdom'}</p>
              </address>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {order.customerEmail}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Order updates will be sent to this email
              </p>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center">
                Need help with your order?
              </p>
              <Button variant="outline" className="w-full mt-3">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
