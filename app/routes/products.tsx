import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export function meta() {
  return [
    { title: 'Products - AIPrintly' },
    {
      name: 'description',
      content:
        'Browse our collection of customisable print products including mugs, apparel, prints, and storybooks.',
    },
  ];
}

const categories = [
  { name: 'All', href: '/products' },
  { name: 'Mugs', href: '/products/mugs' },
  { name: 'Apparel', href: '/products/apparel' },
  { name: 'Prints', href: '/products/prints' },
  { name: 'Storybooks', href: '/products/storybooks' },
];

// Placeholder products for the grid
const placeholderProducts = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1].name,
  price: (Math.random() * 50 + 10).toFixed(2),
}));

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Our Products
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Discover our range of customisable print products
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              asChild
              variant={category.name === 'All' ? 'default' : 'outline'}
              size="sm"
            >
              <Link to={category.href}>{category.name}</Link>
            </Button>
          ))}
        </div>

        {/* Product Grid Placeholder */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {placeholderProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    £{product.price}
                  </span>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Placeholder */}
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>
      </div>
    </div>
  );
}
