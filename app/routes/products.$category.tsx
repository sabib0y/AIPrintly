/**
 * Product Category Page
 *
 * Displays products filtered by category with real database data.
 */

import { Link, useLoaderData, useParams, useSearchParams, redirect } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Button } from '~/components/ui/button';
import { ProductCard } from '~/components/products/ProductCard';
import { getProductsByCategory, isMvpCategory, type ProductWithVariants } from '~/services/products.server';
import { CATEGORY_SLUG_MAP, CATEGORY_TO_SLUG_MAP, MVP_CATEGORY_SLUGS } from '~/lib/categories';
import type { ProductCategory } from '@prisma/client';

/**
 * Meta function for dynamic category titles
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const categoryName = data?.categoryName ?? 'Products';

  return [
    { title: `${categoryName} - AIPrintly` },
    {
      name: 'description',
      content: `Browse our collection of customisable ${categoryName.toLowerCase()} with AI-powered design tools.`,
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
 * Category descriptions for the page header
 */
const categoryDescriptions: Record<string, string> = {
  mugs: 'Personalised mugs perfect for your morning coffee or as thoughtful gifts.',
  apparel: 'Custom designed t-shirts, hoodies, and more with your unique creations.',
  prints: 'High-quality art prints to decorate your home or office.',
  storybooks: 'Create magical personalised storybooks featuring your own characters.',
};

/**
 * Category display names
 */
const categoryDisplayNames: Record<string, string> = {
  mugs: 'Mugs',
  apparel: 'Apparel',
  prints: 'Prints',
  storybooks: 'Storybooks',
};

/**
 * Loader function to fetch products by category.
 * MVP scope: Redirects non-MVP categories (mugs, apparel) to /products.
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { category } = params;

  // Validate category slug exists
  if (!category || !CATEGORY_SLUG_MAP[category]) {
    // Return empty result for invalid category
    return {
      products: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
      categoryName: 'Unknown Category',
      categorySlug: category ?? '',
      isValidCategory: false,
    };
  }

  // MVP scope: Redirect non-MVP categories (mugs, apparel) to /products
  // These categories exist in the database but are hidden in MVP
  if (!isMvpCategory(category)) {
    throw redirect('/products');
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const search = url.searchParams.get('search') ?? undefined;

  const result = await getProductsByCategory(category, {
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
    categoryName: categoryDisplayNames[category] ?? 'Products',
    categorySlug: category,
    isValidCategory: true,
  };
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

export default function ProductCategoryPage() {
  const {
    products,
    total,
    page,
    totalPages,
    categoryName,
    categorySlug,
    isValidCategory,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';

  const hasProducts = products.length > 0;
  const hasPagination = totalPages > 1;

  const description =
    categorySlug && categoryDescriptions[categorySlug]
      ? categoryDescriptions[categorySlug]
      : 'Explore our range of customisable products.';

  // Show error state for invalid category
  if (!isValidCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Category Not Found
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            The category you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="mt-8">
            <Link to="/products">View All Products</Link>
          </Button>
        </div>
      </div>
    );
  }

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
              variant={cat.slug === categorySlug ? 'default' : 'outline'}
              size="sm"
            >
              <Link to={cat.href}>{cat.name}</Link>
            </Button>
          ))}
        </div>

        {/* Results Summary */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {currentSearch ? (
            <p>
              Showing {products.length} results for &quot;{currentSearch}&quot; in{' '}
              {categoryName}
            </p>
          ) : (
            <p>
              Showing {products.length} of {total} {categoryName.toLowerCase()}
            </p>
          )}
        </div>

        {/* Product Grid */}
        {hasProducts ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              No {categoryName.toLowerCase()} found
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {currentSearch
                ? 'Try adjusting your search terms'
                : 'Check back soon for new products'}
            </p>
            {currentSearch && (
              <Button asChild variant="outline" className="mt-4">
                <Link to={`/products/${categorySlug}`}>Clear search</Link>
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
                to={`/products/${categorySlug}?page=${page - 1}${currentSearch ? `&search=${currentSearch}` : ''}`}
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
                to={`/products/${categorySlug}?page=${page + 1}${currentSearch ? `&search=${currentSearch}` : ''}`}
                aria-label="Next page"
              >
                Next
              </Link>
            </Button>
          </div>
        )}

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
