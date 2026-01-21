/**
 * Shopping Cart Page
 *
 * Displays cart items with quantity controls, summary, and checkout button.
 * Supports real-time updates via actions.
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from 'react-router'
import { useLoaderData, useNavigation, useFetcher, Link } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession } from '~/services/session.server'
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  validateCart,
} from '~/services/cart.server'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Input } from '~/components/ui/input'
import {
  CartItem,
  CartItemSkeleton,
  CartSummary,
  EmptyCart,
  type CartItemData,
} from '~/components/cart'

// UK shipping rate in pence (GBP 4.99)
const UK_SHIPPING_PENCE = 499

export function meta() {
  return [
    { title: 'Shopping Cart - AIPrintly' },
    {
      name: 'description',
      content: 'Review your cart and proceed to checkout.',
    },
  ]
}

/**
 * Action schema for cart operations
 */
const actionSchema = z.discriminatedUnion('intent', [
  z.object({
    intent: z.literal('updateQuantity'),
    itemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  }),
  z.object({
    intent: z.literal('remove'),
    itemId: z.string().uuid(),
  }),
])

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')

  if (!sessionId) {
    return data(
      { cart: null, validation: null, error: 'Session not found' },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    const cart = await getCart(sessionId)
    const validation = cart.items.length > 0 ? await validateCart(sessionId) : null

    return data(
      { cart, validation, error: null },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    console.error('Error loading cart:', error)
    return data(
      { cart: null, validation: null, error: 'Failed to load cart' },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')

  if (!sessionId) {
    return data(
      { success: false, error: 'Session not found' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    const formData = await request.formData()
    const intent = formData.get('intent')
    const itemId = formData.get('itemId')
    const quantityStr = formData.get('quantity')

    // Parse and validate action data
    const actionData = {
      intent,
      itemId,
      quantity: quantityStr ? Number(quantityStr) : undefined,
    }

    const parseResult = actionSchema.safeParse(actionData)

    if (!parseResult.success) {
      return data(
        { success: false, error: 'Invalid request' },
        {
          status: 400,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    const action = parseResult.data

    if (action.intent === 'updateQuantity') {
      const result = await updateCartItemQuantity(
        action.itemId,
        sessionId,
        action.quantity
      )

      if (!result) {
        return data(
          { success: false, error: 'Item not found' },
          {
            status: 404,
            headers: { 'Set-Cookie': await commitSession(session) },
          }
        )
      }

      return data(
        { success: true, cartItem: result },
        {
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    if (action.intent === 'remove') {
      const removed = await removeCartItem(action.itemId, sessionId)

      if (!removed) {
        return data(
          { success: false, error: 'Item not found' },
          {
            status: 404,
            headers: { 'Set-Cookie': await commitSession(session) },
          }
        )
      }

      return data(
        { success: true, message: 'Item removed' },
        {
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    return data(
      { success: false, error: 'Unknown action' },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed'
    console.error('Cart action error:', error)

    return data(
      { success: false, error: message },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}

export default function CartPage() {
  const { cart, validation, error } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const fetcher = useFetcher()

  const isLoading = navigation.state === 'loading'
  const isSubmitting = fetcher.state === 'submitting'

  // Get validation errors/warnings for each item
  const getItemValidation = (itemId: string) => {
    if (!validation) return { error: undefined, warning: undefined, newPricePence: undefined }
    const itemValidation = validation.items.find((v) => v.itemId === itemId)
    if (!itemValidation) return { error: undefined, warning: undefined, newPricePence: undefined }

    return {
      error: itemValidation.validation.errors[0],
      warning: itemValidation.validation.warnings[0],
      newPricePence: itemValidation.validation.newPricePence,
    }
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    fetcher.submit(
      { intent: 'updateQuantity', itemId, quantity: String(quantity) },
      { method: 'post' }
    )
  }

  const handleRemove = (itemId: string) => {
    fetcher.submit(
      { intent: 'remove', itemId },
      { method: 'post' }
    )
  }

  // Error state
  if (error && !cart) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unable to load cart
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
            <Button asChild className="mt-4">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Shopping Cart
          </h1>
          <EmptyCart data-testid="empty-cart-message" />
        </div>
      </div>
    )
  }

  // Check if checkout should be disabled
  const hasValidationErrors = validation?.items.some(
    (v) => !v.validation.isValid
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Shopping Cart
        </h1>

        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  Cart Items ({cart.itemCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <CartItemSkeleton key={i} />
                  ))
                ) : (
                  cart.items.map((item) => {
                    const { error: itemError, warning, newPricePence } = getItemValidation(item.id)
                    return (
                      <CartItem
                        key={item.id}
                        item={item as CartItemData}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                        isUpdating={isSubmitting}
                        error={itemError}
                        warning={warning}
                        newPricePence={newPricePence}
                      />
                    )
                  })
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild data-testid="continue-shopping">
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-8 lg:col-span-4 lg:mt-0">
            <CartSummary
              subtotalPence={cart.subtotalPence}
              shippingPence={UK_SHIPPING_PENCE}
              itemCount={cart.itemCount}
              isLoading={isLoading}
              checkoutDisabled={hasValidationErrors}
              checkoutDisabledMessage={
                hasValidationErrors
                  ? 'Please resolve issues with your cart items'
                  : undefined
              }
            />

            {/* Promo Code */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Promo Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter code"
                    aria-label="Promo code"
                  />
                  <Button variant="outline">Apply</Button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Promo codes coming soon!
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Free UK delivery on orders over GBP 50</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>30-day returns policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Secure payment with Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
