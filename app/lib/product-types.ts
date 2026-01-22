/**
 * Product Types
 *
 * Shared type definitions for products that can be used
 * in both server and client code.
 */

import type { Product, ProductVariant, ProductCategory } from '@prisma/client';

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
