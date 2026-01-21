/**
 * Checkout Success Page
 *
 * Displayed after successful payment.
 * Fetches order details from database based on Stripe session ID.
 */

import { type LoaderFunctionArgs, data, redirect } from 'react-router'
import { useLoaderData, Link } from 'react-router'
import { getSession, commitSession } from '~/services/session.server'
import { prisma } from '~/services/prisma.server'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { formatPrice, formatDate } from '~/lib/utils'
import { CheckCircle, Package, Mail, ArrowRight, Printer } from 'lucide-react'

export function meta() {
  return [
    { title: 'Order Confirmed - AIPrintly' },
    { name: 'description', content: 'Your order has been confirmed and is being processed.' },
  ]
}

interface OrderSummary {
  id: string
  orderNumber: string
  customerEmail: string
  customerName: string
  totalPence: number
  shippingPence: number
  subtotalPence: number
  itemCount: number
  createdAt: string
  trackingToken: string
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const url = new URL(request.url)

  // Get Stripe session ID from query params
  const stripeSessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return redirect('/cart')
  }

  // If we have a Stripe session ID, fetch the order
  let orderSummary: OrderSummary | null = null

  if (stripeSessionId) {
    // Find order by Stripe checkout session ID
    const order = await prisma.order.findFirst({
      where: {
        stripeCheckoutSessionId: stripeSessionId,
      },
      include: {
        items: true,
      },
    })

    if (order) {
      orderSummary = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        totalPence: order.totalPence,
        shippingPence: order.shippingPence,
        subtotalPence: order.subtotalPence,
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
        trackingToken: order.trackingToken,
      }
    }
  }

  // Fallback: Try to find the most recent order for this session
  if (!orderSummary) {
    const recentOrder = await prisma.order.findFirst({
      where: {
        sessionId: sessionId,
        status: { in: ['PAID', 'PROCESSING'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
    })

    if (recentOrder) {
      orderSummary = {
        id: recentOrder.id,
        orderNumber: recentOrder.orderNumber,
        customerEmail: recentOrder.customerEmail,
        customerName: recentOrder.customerName,
        totalPence: recentOrder.totalPence,
        shippingPence: recentOrder.shippingPence,
        subtotalPence: recentOrder.subtotalPence,
        itemCount: recentOrder.items.length,
        createdAt: recentOrder.createdAt.toISOString(),
        trackingToken: recentOrder.trackingToken,
      }
    }
  }

  // If still no order found, redirect to home with error
  if (!orderSummary) {
    console.warn('No order found for checkout success page', {
      sessionId,
      stripeSessionId,
    })
    return redirect('/?error=order_not_found')
  }

  return data(
    { order: orderSummary, stripeSessionId },
    { headers: { 'Set-Cookie': await commitSession(session) } }
  )
}

export default function CheckoutSuccessPage() {
  const { order, stripeSessionId } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle
              className="h-10 w-10 text-green-600"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Order Confirmed!
          </h1>

          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Thank you for your order, {order.customerName.split(' ')[0]}!
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <span className="text-base font-normal text-gray-500">
                {order.orderNumber}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Order Number
                </h4>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900 dark:text-white">
                  {order.orderNumber}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Order Date
                </h4>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Order Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Items ({order.itemCount})
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(order.subtotalPence)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(order.shippingPence)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(order.totalPence)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Next Steps */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                What happens next?
              </h4>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/20">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Confirmation Email
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      We&apos;ve sent a confirmation to {order.customerEmail}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/20">
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Production
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your custom items will be printed within 1-2 working days
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/20">
                    <Package className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Delivery
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Estimated delivery in 3-5 working days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to={`/orders/${order.id}?token=${order.trackingToken}`}>
              Track Your Order
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Need help?{' '}
            <Link
              to="/contact"
              className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              Contact our support team
            </Link>
          </p>
          <p className="mt-1">
            Or email us at{' '}
            <a
              href="mailto:support@aiprintly.co.uk"
              className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              support@aiprintly.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
