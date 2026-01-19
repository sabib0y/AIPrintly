/**
 * Checkout Cancelled Page
 *
 * Displayed when user cancels payment or payment fails.
 */

import { type LoaderFunctionArgs, data } from 'react-router'
import { useLoaderData, Link } from 'react-router'
import { getSession, commitSession } from '~/services/session.server'
import { getCart } from '~/services/cart.server'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { XCircle, ArrowLeft, ShoppingCart, HelpCircle } from 'lucide-react'

export function meta() {
  return [
    { title: 'Payment Cancelled - AIPrintly' },
    { name: 'description', content: 'Your payment was cancelled. Your cart items are still saved.' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')

  if (!sessionId) {
    return data(
      { cartItemCount: 0 },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }

  try {
    const cart = await getCart(sessionId)
    return data(
      { cartItemCount: cart.itemCount },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  } catch (error) {
    return data(
      { cartItemCount: 0 },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }
}

export default function CheckoutCancelledPage() {
  const { cartItemCount } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Cancelled Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <XCircle
              className="h-10 w-10 text-amber-600"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Payment Cancelled
          </h1>

          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Your payment was cancelled. Don&apos;t worry, your cart items are still saved.
          </p>
        </div>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              The payment process was cancelled or didn&apos;t complete. This can happen if:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li>You clicked &quot;Cancel&quot; or closed the payment window</li>
              <li>The payment session timed out</li>
              <li>There was a temporary connection issue</li>
              <li>Your card was declined</li>
            </ul>

            <div className="mt-6 rounded-lg bg-sky-50 p-4 dark:bg-sky-900/20">
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-medium text-sky-900 dark:text-sky-100">
                    Your cart is safe
                  </h4>
                  <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                    {cartItemCount > 0
                      ? `You have ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'} waiting in your cart. Return whenever you're ready to complete your purchase.`
                      : 'Your previous cart items are still saved if you were logged in.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {cartItemCount > 0 && (
            <Button asChild>
              <Link to="/checkout">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Link>
            </Button>
          )}
          <Button variant={cartItemCount > 0 ? 'outline' : 'default'} asChild>
            <Link to="/cart">
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
              Return to Cart
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Need help?
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  If you experienced a technical issue or your payment was unexpectedly declined,
                  please{' '}
                  <Link
                    to="/contact"
                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                  >
                    contact our support team
                  </Link>{' '}
                  and we&apos;ll help you complete your order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Common payment issues
          </h3>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Card declined
              </dt>
              <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Check that your card details are correct and that you have sufficient funds.
                You may also need to authorise the payment with your bank.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Session expired
              </dt>
              <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Payment sessions expire after 30 minutes. Simply return to your cart and
                try again.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3D Secure authentication
              </dt>
              <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Some cards require additional authentication. Make sure to complete any
                verification steps from your bank.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
