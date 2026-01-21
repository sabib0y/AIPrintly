import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function meta() {
  return [
    { title: 'AIPrintly - Create Custom Print Products with AI' },
    {
      name: 'description',
      content:
        'Transform your ideas into beautiful custom print products using AI. Create personalised mugs, apparel, prints, and storybooks.',
    },
  ];
}

const categories = [
  {
    title: 'Mugs',
    description: 'Custom designed mugs perfect for gifts or personal use',
    icon: '☕',
    href: '/products/mugs',
  },
  {
    title: 'Apparel',
    description: 'Unique clothing designs printed on quality garments',
    icon: '👕',
    href: '/products/apparel',
  },
  {
    title: 'Prints',
    description: 'Beautiful art prints for your home or office',
    icon: '🖼️',
    href: '/products/prints',
  },
  {
    title: 'Storybooks',
    description: 'Personalised storybooks featuring your characters',
    icon: '📚',
    href: '/products/storybooks',
  },
];

export default function IndexPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Turn Your Ideas Into
              <span className="block text-sky-600 dark:text-sky-400">
                Beautiful Print Products
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Use the power of AI to create stunning custom designs for mugs,
              apparel, art prints, and personalised storybooks. No design skills
              required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button asChild size="lg" data-testid="hero-create-button">
                <Link to="/create">Start Creating</Link>
              </Button>
              <Button asChild variant="outline" size="lg" data-testid="browse-products-link">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              What Would You Like to Create?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Choose a product category to get started
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.title} to={category.href} data-testid="category-card">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-2 text-4xl">{category.icon}</div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-sky-600 dark:bg-sky-700">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to Bring Your Ideas to Life?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-100">
              Upload your own images or let our AI generate unique designs for
              you. It only takes a few minutes to create something special.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-sky-600 hover:bg-gray-100"
              >
                <Link to="/create">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
