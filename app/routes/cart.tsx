import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Skeleton } from '~/components/ui/skeleton';

export function meta() {
  return [
    { title: 'Shopping Cart - AIPrintly' },
    {
      name: 'description',
      content: 'Review your cart and proceed to checkout.',
    },
  ];
}

// Placeholder cart items
const placeholderCartItems = [
  {
    id: 1,
    name: 'Custom Mug - Mountain Sunrise',
    category: 'Mugs',
    price: 14.99,
    quantity: 2,
  },
  {
    id: 2,
    name: 'T-Shirt - Abstract Art',
    category: 'Apparel',
    price: 24.99,
    quantity: 1,
  },
  {
    id: 3,
    name: 'Art Print - Ocean Waves',
    category: 'Prints',
    price: 19.99,
    quantity: 1,
  },
];

export default function CartPage() {
  const subtotal = placeholderCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 4.99;
  const total = subtotal + shipping;

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
                  Cart Items ({placeholderCartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {placeholderCartItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      {/* Product Image Placeholder */}
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
                        <Skeleton className="h-full w-full" />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.category}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            £{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <span className="sr-only">Decrease quantity</span>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <span className="sr-only">Increase quantity</span>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < placeholderCartItems.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-8 lg:col-span-4 lg:mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    £{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    £{shipping.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    £{total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  Taxes calculated at checkout
                </p>
              </CardFooter>
            </Card>

            {/* Promo Code */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Promo Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-gray-700 dark:bg-gray-950"
                  />
                  <Button variant="outline">Apply</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty Cart State (hidden by default, shown when cart is empty) */}
        <div className="hidden">
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Button asChild className="mt-6">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
