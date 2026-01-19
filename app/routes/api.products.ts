/**
 * Products API Endpoint
 *
 * GET /api/products - List products with filtering and pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 12, max: 100)
 * - category: Filter by category (MUG, APPAREL, PRINT, STORYBOOK)
 * - search: Search term for name and description
 * - sortBy: Field to sort by (name, sellingPricePence, createdAt)
 * - sortOrder: Sort direction (asc, desc)
 * - includeVariants: Include variant data (true/false)
 */

import type { LoaderFunctionArgs } from 'react-router';
import { getProducts, type ProductListOptions } from '~/services/products.server';

/**
 * Maximum allowed page size to prevent excessive queries
 */
const MAX_PAGE_SIZE = 100;

/**
 * Default page size
 */
const DEFAULT_PAGE_SIZE = 12;

/**
 * Valid sort fields
 */
const VALID_SORT_BY = ['name', 'sellingPricePence', 'createdAt'] as const;

/**
 * Valid sort orders
 */
const VALID_SORT_ORDER = ['asc', 'desc'] as const;

/**
 * Parse and validate a numeric query parameter
 */
function parseNumber(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate and constrain pagination values
 */
function validatePagination(page: number, pageSize: number): { page: number; pageSize: number } {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE),
  };
}

/**
 * Validate sortBy parameter
 */
function validateSortBy(sortBy: string | null): ProductListOptions['sortBy'] | undefined {
  if (!sortBy) return undefined;
  if (VALID_SORT_BY.includes(sortBy as (typeof VALID_SORT_BY)[number])) {
    return sortBy as ProductListOptions['sortBy'];
  }
  return undefined;
}

/**
 * Validate sortOrder parameter
 */
function validateSortOrder(sortOrder: string | null): ProductListOptions['sortOrder'] | undefined {
  if (!sortOrder) return undefined;
  if (VALID_SORT_ORDER.includes(sortOrder as (typeof VALID_SORT_ORDER)[number])) {
    return sortOrder as ProductListOptions['sortOrder'];
  }
  return undefined;
}

/**
 * Loader function for GET /api/products
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const rawPage = parseNumber(searchParams.get('page'), 1);
    const rawPageSize = parseNumber(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
    const { page, pageSize } = validatePagination(rawPage, rawPageSize);

    // Build options object
    const options: ProductListOptions = {
      page,
      pageSize,
    };

    // Add optional filters
    const category = searchParams.get('category');
    if (category) {
      options.category = category;
    }

    const search = searchParams.get('search');
    if (search) {
      options.search = search;
    }

    const sortBy = validateSortBy(searchParams.get('sortBy'));
    if (sortBy) {
      options.sortBy = sortBy;
    }

    const sortOrder = validateSortOrder(searchParams.get('sortOrder'));
    if (sortOrder) {
      options.sortOrder = sortOrder;
    }

    const includeVariants = searchParams.get('includeVariants');
    if (includeVariants === 'true') {
      options.includeVariants = true;
    }

    // Fetch products
    const result = await getProducts(options);

    // Return JSON response with caching headers
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
