/**
 * Products Service
 *
 * Server-side service for product queries and operations.
 * Handles fetching products, variants, and filtering by category.
 */

import type { Product, ProductVariant, ProductCategory, StockStatus } from '@prisma/client';
import { prisma } from './prisma.server';
import { CATEGORY_SLUG_MAP, CATEGORY_TO_SLUG_MAP } from '~/lib/categories';

// Re-export for backwards compatibility
export { CATEGORY_SLUG_MAP, CATEGORY_TO_SLUG_MAP };

/**
 * Product with included variants
 */
export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

/**
 * Options for filtering and paginating product lists
 */
export interface ProductListOptions {
  /** Page number (1-based), defaults to 1 */
  page?: number;
  /** Number of items per page, defaults to 12 */
  pageSize?: number;
  /** Filter by product category */
  category?: ProductCategory | string;
  /** Search query for name and description */
  search?: string;
  /** Field to sort by */
  sortBy?: 'name' | 'sellingPricePence' | 'createdAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Include variant data in results */
  includeVariants?: boolean;
}

/**
 * Result of a product list query with pagination metadata
 */
export interface ProductListResult<T = Product> {
  /** Array of products */
  products: T[];
  /** Total number of matching products */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Options for fetching a single product
 */
export interface GetProductOptions {
  /** Include inactive products */
  includeInactive?: boolean;
}

/**
 * Options for fetching product variants
 */
export interface GetVariantsOptions {
  /** Only return variants that are in stock */
  inStockOnly?: boolean;
}

/**
 * Valid product categories
 */
const VALID_CATEGORIES: ProductCategory[] = ['MUG', 'APPAREL', 'PRINT', 'STORYBOOK'];

/**
 * Normalise a category string to a valid ProductCategory
 */
function normaliseCategory(category: string): ProductCategory | null {
  const upper = category.toUpperCase() as ProductCategory;
  if (VALID_CATEGORIES.includes(upper)) {
    return upper;
  }

  // Check if it's a slug
  const fromSlug = CATEGORY_SLUG_MAP[category.toLowerCase()];
  if (fromSlug) {
    return fromSlug;
  }

  return null;
}

/**
 * Get a paginated list of active products
 *
 * @param options - Filtering and pagination options
 * @returns Paginated product list with metadata
 *
 * @example
 * ```ts
 * // Get first page of all products
 * const result = await getProducts();
 *
 * // Get mugs with variants
 * const mugs = await getProducts({
 *   category: 'MUG',
 *   includeVariants: true,
 * });
 * ```
 */
export async function getProducts(
  options: ProductListOptions = {}
): Promise<ProductListResult<Product | ProductWithVariants>> {
  const {
    page = 1,
    pageSize = 12,
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeVariants = false,
  } = options;

  // Build where clause
  const where: {
    isActive: boolean;
    category?: ProductCategory;
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
  } = {
    isActive: true,
  };

  // Add category filter
  if (category) {
    const normalisedCategory = normaliseCategory(String(category));
    if (normalisedCategory) {
      where.category = normalisedCategory;
    }
  }

  // Add search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Execute queries in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take: pageSize,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: includeVariants ? { variants: true } : undefined,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

/**
 * Get a single product by ID with its variants
 *
 * @param id - Product ID
 * @param options - Options for fetching
 * @returns Product with variants or null if not found
 *
 * @example
 * ```ts
 * const product = await getProductById('prod-123');
 * if (product) {
 *   console.log(product.variants);
 * }
 * ```
 */
export async function getProductById(
  id: string,
  options: GetProductOptions = {}
): Promise<ProductWithVariants | null> {
  const { includeInactive = false } = options;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  // Return null if product doesn't exist
  if (!product) {
    return null;
  }

  // Return null if product is inactive and we're not including inactive
  if (!includeInactive && !product.isActive) {
    return null;
  }

  return product;
}

/**
 * Get products filtered by category
 *
 * @param category - Product category (case-insensitive, supports slugs)
 * @param options - Additional filtering options
 * @returns Paginated product list
 *
 * @example
 * ```ts
 * // Using category enum
 * const mugs = await getProductsByCategory('MUG');
 *
 * // Using URL slug
 * const apparel = await getProductsByCategory('apparel');
 * ```
 */
export async function getProductsByCategory(
  category: ProductCategory | string,
  options: Omit<ProductListOptions, 'category'> = {}
): Promise<ProductListResult<Product | ProductWithVariants>> {
  const normalisedCategory = normaliseCategory(String(category));

  if (!normalisedCategory) {
    // Return empty result for invalid category
    return {
      products: [],
      total: 0,
      page: options.page || 1,
      pageSize: options.pageSize || 12,
      totalPages: 0,
    };
  }

  return getProducts({
    ...options,
    category: normalisedCategory,
  });
}

/**
 * Get all variants for a product
 *
 * @param productId - Product ID
 * @param options - Filtering options
 * @returns Array of product variants
 *
 * @example
 * ```ts
 * // Get all variants
 * const variants = await getProductVariants('prod-123');
 *
 * // Get only in-stock variants
 * const inStock = await getProductVariants('prod-123', { inStockOnly: true });
 * ```
 */
export async function getProductVariants(
  productId: string,
  options: GetVariantsOptions = {}
): Promise<ProductVariant[]> {
  const { inStockOnly = false } = options;

  const where: { productId: string; stockStatus?: StockStatus } = {
    productId,
  };

  if (inStockOnly) {
    where.stockStatus = 'IN_STOCK';
  }

  return prisma.productVariant.findMany({
    where,
    orderBy: [{ colour: 'asc' }, { size: 'asc' }],
  });
}

/**
 * Get a single product variant by ID
 *
 * @param id - Variant ID
 * @returns Product variant or null if not found
 */
export async function getProductVariantById(
  id: string
): Promise<ProductVariant | null> {
  return prisma.productVariant.findUnique({
    where: { id },
  });
}

/**
 * Get available sizes for a product
 *
 * @param productId - Product ID
 * @returns Array of unique sizes
 */
export async function getAvailableSizes(productId: string): Promise<string[]> {
  const variants = await prisma.productVariant.findMany({
    where: {
      productId,
      stockStatus: { not: 'OUT_OF_STOCK' },
    },
    select: { size: true },
    distinct: ['size'],
  });

  return variants
    .map((v) => v.size)
    .filter((size): size is string => size !== null);
}

/**
 * Get available colours for a product
 *
 * @param productId - Product ID
 * @returns Array of colour objects with name and hex value
 */
export async function getAvailableColours(
  productId: string
): Promise<Array<{ colour: string; colourHex: string | null }>> {
  const variants = await prisma.productVariant.findMany({
    where: {
      productId,
      stockStatus: { not: 'OUT_OF_STOCK' },
    },
    select: { colour: true, colourHex: true },
    distinct: ['colour'],
  });

  return variants
    .filter((v): v is { colour: string; colourHex: string | null } => v.colour !== null)
    .map((v) => ({ colour: v.colour, colourHex: v.colourHex }));
}

/**
 * Find a variant by product, size, and colour
 *
 * @param productId - Product ID
 * @param size - Size value
 * @param colour - Colour value
 * @returns Matching variant or null
 */
export async function findVariantByAttributes(
  productId: string,
  size: string | null,
  colour: string | null
): Promise<ProductVariant | null> {
  return prisma.productVariant.findFirst({
    where: {
      productId,
      size,
      colour,
    },
  });
}
