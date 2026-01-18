import { Link, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export function meta({ params }: { params: { category: string } }) {
  const categoryName = params.category
    ? params.category.charAt(0).toUpperCase() + params.category.slice(1)
    : 'Products';

  return [
    { title: `${categoryName} - AIPrintly` },
    {
      name: 'description',
      content: `Browse our collection of customisable ${categoryName.toLowerCase()} with AI-powered design tools.`,
    },
  ];
}

const categories = [
  { name: 'All', href: '/products', slug: '' },
  { name: 'Mugs', href: '/products/mugs', slug: 'mugs' },
  { name: 'Apparel', href: '/products/apparel', slug: 'apparel' },
  { name: 'Prints', href: '/products/prints', slug: 'prints' },
  { name: 'Storybooks', href: '/products/storybooks', slug: 'storybooks' },
];

const categoryDescriptions: Record<string, string> = {
  mugs: 'Personalised mugs perfect for your morning coffee or as thoughtful gifts.',
  apparel: 'Custom designed t-shirts, hoodies, and more with your unique creations.',
  prints: 'High-quality art prints to decorate your home or office.',
  storybooks: 'Create magical personalised storybooks featuring your own characters.',
};

export default function ProductCategoryPage() {
  const { category } = useParams();

  const categoryName = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Products';

  const description =
    category && categoryDescriptions[category]
      ? categoryDescriptions[category]
      : 'Explore our range of customisable products.';

  // Placeholder products for the grid
  const placeholderProducts = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `${categoryName} Design ${i + 1}`,
    price: (Math.random() * 50 + 10).toFixed(2),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {categoryName}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.name}
              asChild
              variant={cat.slug === category ? 'default' : 'outline'}
              size="sm"
            >
              <Link to={cat.href}>{cat.name}</Link>
            </Button>
          ))}
        </div>

        {/* Product Grid Placeholder */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>Customisable {categoryName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    £{product.price}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                    <Button size="sm">Customise</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Create Your Own {categoryName} Design
          </h2>
          <p className="mt-2 text-sky-100">
            Use our AI-powered tools to create something unique
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-6 bg-white text-sky-600 hover:bg-gray-100"
          >
            <Link to="/create">Start Creating</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
