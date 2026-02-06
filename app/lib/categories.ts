/**
 * Product Category Mappings
 *
 * Shared constants for mapping between URL slugs and database categories.
 * This file is safe to import in both client and server code.
 */

import type { ProductCategory } from '@prisma/client'

/**
 * All available product categories (full catalogue).
 * Includes mugs and apparel which are hidden in MVP but available for future expansion.
 */
export const ALL_CATEGORIES: ProductCategory[] = ['MUG', 'APPAREL', 'PRINT', 'STORYBOOK']

/**
 * MVP categories only - Prints and Storybooks.
 * Mugs and apparel are hidden in MVP scope but can be re-enabled in future phases.
 */
export const MVP_CATEGORIES: ProductCategory[] = ['PRINT', 'STORYBOOK']

/**
 * MVP category slugs for URL routing (products page)
 */
export const MVP_CATEGORY_SLUGS: string[] = ['prints', 'storybooks']

/**
 * MVP product type slugs for builder routing (/build/:productType)
 */
export const MVP_PRODUCT_TYPES: string[] = ['print', 'storybook']

/**
 * Map of URL-friendly category slugs to database category values
 */
export const CATEGORY_SLUG_MAP: Record<string, ProductCategory> = {
  mugs: 'MUG',
  apparel: 'APPAREL',
  prints: 'PRINT',
  storybooks: 'STORYBOOK',
}

/**
 * Map of database category values to URL-friendly slugs
 */
export const CATEGORY_TO_SLUG_MAP: Record<ProductCategory, string> = {
  MUG: 'mugs',
  APPAREL: 'apparel',
  PRINT: 'prints',
  STORYBOOK: 'storybooks',
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<string, string> = {
  mugs: 'Mugs',
  apparel: 'Apparel',
  prints: 'Prints',
  storybooks: 'Storybooks',
  MUG: 'Mugs',
  APPAREL: 'Apparel',
  PRINT: 'Prints',
  STORYBOOK: 'Storybooks',
}
