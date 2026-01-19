/**
 * Checkout Page
 *
 * Multi-step checkout flow with shipping form and Stripe integration.
 */

import { useState } from 'react'
import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from 'react-router'
import { useLoaderData, useNavigation, useFetcher, Link } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession, getUserIdFromSession } from '~/services/session.server'
import { getCart, validateCart } from '~/services/cart.server'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ShippingForm,
  OrderSummary,
  GuestGate,
  type ShippingAddress,
  type OrderItem,
} from '~/components/checkout'
import { EmptyCart } from '~/components/cart'
import { ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react'

// UK shipping rate in pence
const UK_SHIPPING_PENCE = 499

export function meta() {
  return [
    { title: 'Checkout - AIPrintly' },
    { name: 'description', content: 'Complete your order securely.' },
  ]
}

/**
 * Shipping address validation schema
 */
const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional(),
  postcode: z.string().min(5, 'Please enter a valid UK postcode'),
  country: z.string().default('United Kingdom'),
})

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')
  const userId = await getUserIdFromSession(request)

  if (!sessionId) {
    return data(
      { cart: null, validation: null, isAuthenticated: false, error: 'Session not found' },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }

  try {
    const cart = await getCart(sessionId)

    // Redirect to cart if empty
    if (cart.items.length === 0) {
      return redirect('/cart')
    }

    const validation = await validateCart(sessionId)

    // Check for validation errors
    if (!validation.isValid) {
      // Redirect to cart to resolve issues
      return redirect('/cart')
    }

    // Transform cart items for order summary
    const orderItems: OrderItem[] = cart.items.map((item) => ({
      id: item.id,
      name: item.configuration.product.name,
      variantName: item.configuration.variant.name,
      quantity: item.quantity,
      unitPricePence: item.unitPricePence,
      imageUrl: item.configuration.mockupUrl || item.configuration.asset.storageUrl,
    }))

    return data(
      {
        cart: {
          items: orderItems,
          itemCount: cart.itemCount,
          subtotalPence: cart.subtotalPence,
        },
        validation,
        isAuthenticated: !!userId,
        error: null,
      },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  } catch (error) {
    console.error('Error loading checkout:', error)
    return data(
      { cart: null, validation: null, isAuthenticated: false, error: 'Failed to load checkout' },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request)
  const sessionId = session.get('id')

  if (!sessionId) {
    return data(
      { success: false, error: 'Session not found' },
      { status: 401, headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }

  try {
    const formData = await request.formData()
    const intent = formData.get('intent')

    if (intent === 'createCheckoutSession') {
      // Parse and validate shipping address
      const addressData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        addressLine1: formData.get('addressLine1'),
        addressLine2: formData.get('addressLine2') || '',
        city: formData.get('city'),
        county: formData.get('county') || '',
        postcode: formData.get('postcode'),
        country: formData.get('country') || 'United Kingdom',
      }

      const parseResult = shippingAddressSchema.safeParse(addressData)

      if (!parseResult.success) {
        return data(
          {
            success: false,
            error: 'Invalid shipping address',
            details: parseResult.error.flatten(),
          },
          { status: 400, headers: { 'Set-Cookie': await commitSession(session) } }
        )
      }

      // Validate cart before proceeding
      const cart = await getCart(sessionId)
      if (cart.items.length === 0) {
        return data(
          { success: false, error: 'Cart is empty' },
          { status: 400, headers: { 'Set-Cookie': await commitSession(session) } }
        )
      }

      const validation = await validateCart(sessionId)
      if (!validation.isValid) {
        return data(
          { success: false, error: 'Please resolve cart issues before checkout' },
          { status: 400, headers: { 'Set-Cookie': await commitSession(session) } }
        )
      }

      // Store shipping address in session for later use
      session.set('shippingAddress' as any, parseResult.data)

      // Return success with redirect URL to Stripe checkout
      // The actual Stripe session will be created via the API route
      return data(
        {
          success: true,
          shippingAddress: parseResult.data,
          redirectToPayment: true,
        },
        { headers: { 'Set-Cookie': await commitSession(session) } }
      )
    }

    return data(
      { success: false, error: 'Unknown action' },
      { status: 400, headers: { 'Set-Cookie': await commitSession(session) } }
    )
  } catch (error) {
    console.error('Checkout action error:', error)
    return data(
      { success: false, error: 'Checkout failed. Please try again.' },
      { status: 500, headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }
}

type CheckoutStep = 'guest-gate' | 'shipping' | 'payment'

export default function CheckoutPage() {
  const { cart, isAuthenticated, error } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const fetcher = useFetcher()

  const [step, setStep] = useState<CheckoutStep>(
    isAuthenticated ? 'shipping' : 'guest-gate'
  )
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)

  const isLoading = navigation.state === 'loading'
  const isSubmitting = fetcher.state === 'submitting'

  // Error state
  if (error && !cart) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Unable to load checkout
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
            <Button asChild className="mt-6">
              <Link to="/cart">Return to Cart</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart (should redirect, but handle just in case)
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Checkout
          </h1>
          <EmptyCart />
        </div>
      </div>
    )
  }

  const handleContinueAsGuest = () => {
    setStep('shipping')
  }

  const handleAccountCreated = (email: string) => {
    // Pre-fill email in shipping form
    setShippingAddress((prev) => ({
      ...prev!,
      email,
    } as ShippingAddress))
    setStep('shipping')
  }

  const handleShippingSubmit = async (address: ShippingAddress) => {
    setShippingAddress(address)

    // Submit to create Stripe checkout session
    const formData = new FormData()
    formData.set('intent', 'createCheckoutSession')
    Object.entries(address).forEach(([key, value]) => {
      formData.set(key, value)
    })

    fetcher.submit(formData, { method: 'post' })
  }

  // Handle fetcher response - redirect to Stripe checkout
  const fetcherData = fetcher.data as { success?: boolean; redirectToPayment?: boolean; error?: string } | undefined
  if (fetcherData?.success && fetcherData?.redirectToPayment) {
    // Redirect to Stripe checkout API
    // In production, this would create a Stripe session and redirect
    window.location.href = '/api/checkout/create-session'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Cart
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Checkout
          </h1>

          {/* Progress Indicator */}
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span
              className={step === 'guest-gate' ? 'font-medium text-sky-600' : 'text-gray-500'}
            >
              {isAuthenticated ? '' : '1. Account'}
            </span>
            {!isAuthenticated && (
              <span className="text-gray-300" aria-hidden="true">
                /
              </span>
            )}
            <span
              className={step === 'shipping' ? 'font-medium text-sky-600' : 'text-gray-500'}
            >
              {isAuthenticated ? '1' : '2'}. Shipping
            </span>
            <span className="text-gray-300" aria-hidden="true">
              /
            </span>
            <span
              className={step === 'payment' ? 'font-medium text-sky-600' : 'text-gray-500'}
            >
              {isAuthenticated ? '2' : '3'}. Payment
            </span>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-7">
            {/* Guest Gate Step */}
            {step === 'guest-gate' && (
              <GuestGate
                onContinueAsGuest={handleContinueAsGuest}
                onAccountCreated={handleAccountCreated}
                isLoading={isLoading || isSubmitting}
              />
            )}

            {/* Shipping Step */}
            {step === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {fetcherData?.error && (
                    <div
                      className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      role="alert"
                    >
                      {fetcherData.error}
                    </div>
                  )}

                  <ShippingForm
                    initialValues={shippingAddress || undefined}
                    onSubmit={handleShippingSubmit}
                    isSubmitting={isSubmitting}
                  />

                  {!isAuthenticated && (
                    <Button
                      variant="ghost"
                      className="mt-4 w-full"
                      onClick={() => setStep('guest-gate')}
                      disabled={isSubmitting}
                    >
                      Back to Account Options
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <OrderSummary
              items={cart.items}
              subtotalPence={cart.subtotalPence}
              shippingPence={UK_SHIPPING_PENCE}
            />

            {/* Delivery Info */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      UK Delivery
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Estimated 3-5 working days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
