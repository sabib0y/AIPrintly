/**
 * Credit Purchase Success Page
 *
 * GET /credits/success - Success page after purchasing credits
 */

import { type LoaderFunctionArgs, data, redirect, useLoaderData, Link } from 'react-router'
import { requireAuth } from '~/services/auth.server'
import { getBalance } from '~/services/credits.server'
import { retrieveCheckoutSession } from '~/services/stripe.server'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '~/components/ui/card'
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

/**
 * Loader - Verify session and get credit balance
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request)

  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return redirect('/credits/purchase')
  }

  try {
    // Verify the Stripe session
    const session = await retrieveCheckoutSession(sessionId)

    // Check if this was a credit purchase
    if (session.metadata?.type !== 'credit_purchase') {
      return redirect('/')
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return redirect('/credits/purchase')
    }

    // Get updated balance
    const balance = await getBalance('', user.id)

    const credits = session.metadata?.credits || '0'

    return data({
      success: true,
      balance,
      creditsPurchased: Number(credits),
    })
  } catch (error) {
    console.error('Failed to verify credit purchase:', error)
    return redirect('/credits/purchase')
  }
}

/**
 * Credit Purchase Success Page Component
 */
export default function CreditSuccessPage() {
  const { balance, creditsPurchased } = useLoaderData<typeof loader>()

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          <CardDescription className="text-base">
            Your credits have been added to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-sky-50 p-6 text-center">
            <p className="text-sm font-medium text-sky-900">
              Credits Purchased
            </p>
            <p className="mt-2 text-4xl font-bold text-sky-600">
              +{creditsPurchased}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                New Balance
              </span>
              <span className="text-lg font-bold text-gray-900">
                {balance} credits
              </span>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  <span>Use for any AI generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  <span>Available immediately</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            A confirmation email has been sent to your registered email address.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" size="lg" asChild>
            <Link to="/create">
              <Sparkles className="mr-2 h-4 w-4" />
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button className="w-full" variant="outline" asChild>
            <Link to="/dashboard">View Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
