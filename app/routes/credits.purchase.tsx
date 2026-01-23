/**
 * Credit Purchase Page
 *
 * GET /credits/purchase - Page to purchase credit packs
 */

import { type LoaderFunctionArgs, data, useLoaderData } from 'react-router'
import { requireAuth } from '~/services/auth.server'
import { getBalance } from '~/services/credits.server'
import { CreditPackSelector } from '~/components/credits/CreditPackSelector'
import { Card, CardContent } from '~/components/ui/card'
import { Coins } from 'lucide-react'

/**
 * Loader - Require auth and get current balance
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request)

  const balance = await getBalance('', user.id)

  return data({
    user,
    balance,
  })
}

/**
 * Credit Purchase Page Component
 */
export default function CreditPurchasePage() {
  const { balance } = useLoaderData<typeof loader>()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Current Balance Card */}
        <Card className="mb-8">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                <Coins className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Balance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {balance} credits
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>1 credit = 1 AI generation</p>
            </div>
          </CardContent>
        </Card>

        {/* Credit Pack Selector */}
        <CreditPackSelector />
      </div>
    </main>
  )
}
