/**
 * Products Page
 *
 * Main product listing page showing all products with category filtering.
 * Connects to the database via loader for real product data.
 */

import { Link, useLoaderData, useSearchParams } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Button } from '~/components/ui/button';
import { ProductCard, ProductCardSkeleton } from '~/components/products/ProductCard';
import { getMvpProducts, type ProductWithVariants } from '~/services/products.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Products - AIPrintly' },
    {
      name: 'description',
      content:
        'Browse our collection of customisable print products including prints and storybooks.',
    },
  ];
};

/**
 * Categories for filter navigation.
 * MVP scope: Only Prints and Storybooks are shown.
 * Mugs and apparel are available in the database for future expansion.
 */
const categories = [
  { name: 'All', href: '/products', slug: '' },
  { name: 'Prints', href: '/products/prints', slug: 'prints' },
  { name: 'Storybooks', href: '/products/storybooks', slug: 'storybooks' },
];

/**
 * Loader function to fetch products from the database.
 * MVP scope: Only fetches Prints and Storybooks categories.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const search = url.searchParams.get('search') ?? undefined;

  // Use getMvpProducts to filter to Prints and Storybooks only
  const result = await getMvpProducts({
    page: Math.max(1, page),
    pageSize: 12,
    search,
    includeVariants: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return {
    products: result.products as ProductWithVariants[],
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
}

/**
 * Get the minimum selling price from all variants
 */
function getMinPrice(product: ProductWithVariants): number {
  if (!product.variants || product.variants.length === 0) {
    return product.sellingPricePence;
  }
  return Math.min(...product.variants.map((v) => v.sellingPricePence));
}

/**
 * Get the best stock status from all variants
 */
function getBestStockStatus(
  product: ProductWithVariants
): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (!product.variants || product.variants.length === 0) {
    return 'IN_STOCK';
  }

  const hasInStock = product.variants.some((v) => v.stockStatus === 'IN_STOCK');
  const hasLowStock = product.variants.some((v) => v.stockStatus === 'LOW_STOCK');

  if (hasInStock) return 'IN_STOCK';
  if (hasLowStock) return 'LOW_STOCK';
  return 'OUT_OF_STOCK';
}

export default function ProductsPage() {
  const { products, total, page, totalPages } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';

  const hasProducts = products.length > 0;
  const hasPagination = totalPages > 1;

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
              variant={category.slug === '' ? 'default' : 'outline'}
              size="sm"
            >
              <Link to={category.href}>{category.name}</Link>
            </Button>
          ))}
        </div>

        {/* Results Summary */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {currentSearch ? (
            <p>
              Showing {products.length} results for &quot;{currentSearch}&quot;
            </p>
          ) : (
            <p>
              Showing {products.length} of {total} products
            </p>
          )}
        </div>

        {/* Product Grid */}
        {hasProducts ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                stockStatus={getBestStockStatus(product)}
                variantCount={product.variants?.length}
                hasMultiplePrices={
                  product.variants &&
                  product.variants.length > 1 &&
                  new Set(product.variants.map((v) => v.sellingPricePence)).size > 1
                }
                showCustomiseButton
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <EmptyStateIcon />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No products found
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {currentSearch
                ? 'Try adjusting your search terms'
                : 'Check back soon for new products'}
            </p>
            {currentSearch && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/products">Clear search</Link>
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {hasPagination && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
            >
              <Link
                to={`/products?page=${page - 1}${currentSearch ? `&search=${currentSearch}` : ''}`}
                aria-label="Previous page"
              >
                Previous
              </Link>
            </Button>
            <span className="px-4 text-sm text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
            >
              <Link
                to={`/products?page=${page + 1}${currentSearch ? `&search=${currentSearch}` : ''}`}
                aria-label="Next page"
              >
                Next
              </Link>
            </Button>
          </div>
        )}

        {/* Call to Action - Create Your Own */}
        <div className="mt-16 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Create Your Own Design
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

/**
 * Empty state illustration
 */
function EmptyStateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
