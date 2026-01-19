/**
 * Mockup Generation Service
 *
 * Server-side service for generating product mockups.
 * Handles client-side preview rendering and Printful API integration.
 */

import type { ProductCategory, FulfilmentProvider } from '@prisma/client';
import { prisma } from './prisma.server';

/**
 * Mockup generation request
 */
export interface MockupRequest {
  /** Product ID */
  productId: string;
  /** Variant ID */
  variantId: string;
  /** Asset ID (uploaded/generated image) */
  assetId: string;
  /** Design customisation */
  customisation: MockupCustomisation;
}

/**
 * Design customisation for mockup
 */
export interface MockupCustomisation {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

/**
 * Generated mockup result
 */
export interface MockupResult {
  /** Generated mockup URL */
  mockupUrl: string;
  /** Cache key for the mockup */
  cacheKey: string;
  /** Provider used for generation */
  provider: 'client' | 'printful' | 'blurb';
  /** Generation timestamp */
  generatedAt: Date;
}

/**
 * Mockup generation options
 */
export interface MockupOptions {
  /** Generate high-resolution mockup */
  highResolution?: boolean;
  /** Specific mockup angle/view */
  view?: 'front' | 'back' | 'side' | 'all';
  /** Background colour for the mockup */
  backgroundColor?: string;
}

/**
 * Print area specification per product type
 */
export interface PrintAreaSpec {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  productImageWidth: number;
  productImageHeight: number;
}

/**
 * Print area specifications for Printful products
 */
const PRINTFUL_PRINT_AREAS: Record<string, PrintAreaSpec> = {
  // Mugs - wrap around
  'printful-mug-001': {
    width: 900,
    height: 380,
    offsetX: 50,
    offsetY: 60,
    productImageWidth: 1000,
    productImageHeight: 500,
  },
  'printful-mug-002': {
    width: 900,
    height: 380,
    offsetX: 50,
    offsetY: 60,
    productImageWidth: 1000,
    productImageHeight: 500,
  },
  'printful-mug-003': {
    width: 900,
    height: 380,
    offsetX: 50,
    offsetY: 60,
    productImageWidth: 1000,
    productImageHeight: 500,
  },
  // T-shirts - chest print
  'printful-tshirt-001': {
    width: 1200,
    height: 1400,
    offsetX: 400,
    offsetY: 150,
    productImageWidth: 2000,
    productImageHeight: 2400,
  },
  // Hoodies - chest print
  'printful-hoodie-001': {
    width: 1200,
    height: 1200,
    offsetX: 400,
    offsetY: 250,
    productImageWidth: 2000,
    productImageHeight: 2400,
  },
  // Posters - full print
  'printful-poster-001': {
    width: 3508,
    height: 4961,
    offsetX: 0,
    offsetY: 0,
    productImageWidth: 3508,
    productImageHeight: 4961,
  },
  // Canvas - full print
  'printful-canvas-001': {
    width: 2400,
    height: 3200,
    offsetX: 100,
    offsetY: 100,
    productImageWidth: 2600,
    productImageHeight: 3400,
  },
  // Framed prints
  'printful-framed-001': {
    width: 2400,
    height: 3200,
    offsetX: 150,
    offsetY: 150,
    productImageWidth: 2700,
    productImageHeight: 3500,
  },
};

/**
 * Default print area for unknown products
 */
const DEFAULT_PRINT_AREA: PrintAreaSpec = {
  width: 1200,
  height: 1200,
  offsetX: 0,
  offsetY: 0,
  productImageWidth: 1200,
  productImageHeight: 1200,
};

/**
 * Generate a mockup for a product configuration
 *
 * @param request - Mockup generation request
 * @param options - Optional generation settings
 * @returns Generated mockup result
 *
 * @example
 * ```ts
 * const mockup = await generateMockup({
 *   productId: 'prod-123',
 *   variantId: 'var-456',
 *   assetId: 'asset-789',
 *   customisation: { position: { x: 450, y: 190 }, scale: 1, rotation: 0 },
 * });
 * ```
 */
export async function generateMockup(
  request: MockupRequest,
  options: MockupOptions = {}
): Promise<MockupResult> {
  const { productId, variantId, assetId, customisation } = request;

  // Fetch product and variant details
  const [product, variant, asset] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.productVariant.findUnique({ where: { id: variantId } }),
    prisma.asset.findUnique({ where: { id: assetId } }),
  ]);

  if (!product || !variant || !asset) {
    throw new Error('Product, variant, or asset not found');
  }

  // Generate cache key
  const cacheKey = generateCacheKey(request);

  // Check if we have a cached mockup
  const cachedMockup = await getCachedMockup(cacheKey);
  if (cachedMockup) {
    return {
      mockupUrl: cachedMockup,
      cacheKey,
      provider: 'client',
      generatedAt: new Date(),
    };
  }

  // For MVP, return client-side generated mockup URL
  // In production, this would call Printful/Blurb APIs
  const mockupUrl = generateClientMockupUrl(product.externalId, asset.storageUrl, customisation);

  // Cache the mockup URL
  await cacheMockup(cacheKey, mockupUrl);

  return {
    mockupUrl,
    cacheKey,
    provider: 'client',
    generatedAt: new Date(),
  };
}

/**
 * Generate a cache key for mockup requests
 */
function generateCacheKey(request: MockupRequest): string {
  const { productId, variantId, assetId, customisation } = request;
  const customisationStr = `${customisation.position.x}-${customisation.position.y}-${customisation.scale}-${customisation.rotation}`;
  return `mockup:${productId}:${variantId}:${assetId}:${customisationStr}`;
}

/**
 * Get cached mockup URL if available
 */
async function getCachedMockup(cacheKey: string): Promise<string | null> {
  // For MVP, we'll use a simple in-memory approach
  // In production, this would use Redis or similar
  return null;
}

/**
 * Cache a mockup URL
 */
async function cacheMockup(cacheKey: string, mockupUrl: string): Promise<void> {
  // For MVP, no-op
  // In production, this would store in Redis with TTL
}

/**
 * Generate a client-side mockup URL
 *
 * This creates a data URL or reference that the client can use
 * to render a preview mockup using canvas/CSS composition
 */
function generateClientMockupUrl(
  productExternalId: string,
  assetUrl: string,
  customisation: MockupCustomisation
): string {
  // For client-side rendering, we return a special URL format
  // that the MockupPreview component understands
  const params = new URLSearchParams({
    product: productExternalId,
    asset: assetUrl,
    x: customisation.position.x.toString(),
    y: customisation.position.y.toString(),
    scale: customisation.scale.toString(),
    rotation: customisation.rotation.toString(),
  });

  return `/api/mockups/preview?${params.toString()}`;
}

/**
 * Get print area specification for a product
 */
export function getPrintAreaSpec(productExternalId: string): PrintAreaSpec {
  return PRINTFUL_PRINT_AREAS[productExternalId] ?? DEFAULT_PRINT_AREA;
}

/**
 * Validate mockup quality
 */
export interface QualityValidation {
  isValid: boolean;
  effectiveDpi: number;
  minRequiredDpi: number;
  overlapPercentage: number;
  minRequiredOverlap: number;
  issues: string[];
}

/**
 * Validate mockup quality before generation
 */
export async function validateMockupQuality(
  assetId: string,
  productExternalId: string,
  customisation: MockupCustomisation
): Promise<QualityValidation> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });

  if (!asset) {
    return {
      isValid: false,
      effectiveDpi: 0,
      minRequiredDpi: 150,
      overlapPercentage: 0,
      minRequiredOverlap: 0.3,
      issues: ['Asset not found'],
    };
  }

  const printArea = getPrintAreaSpec(productExternalId);
  const issues: string[] = [];

  // Calculate effective DPI
  const scaledWidth = asset.width * customisation.scale;
  const scaledHeight = asset.height * customisation.scale;
  const printWidthInches = printArea.width / 300; // Assuming 300 DPI print
  const effectiveDpi = scaledWidth / printWidthInches;

  const minRequiredDpi = productExternalId.includes('poster') ||
    productExternalId.includes('canvas') ||
    productExternalId.includes('storybook')
    ? 300
    : 150;

  if (effectiveDpi < minRequiredDpi) {
    issues.push(`Image resolution too low (${Math.round(effectiveDpi)} DPI, minimum ${minRequiredDpi} DPI required)`);
  }

  // Calculate overlap percentage (simplified)
  const overlapPercentage = Math.min(
    (scaledWidth / printArea.width) * (scaledHeight / printArea.height),
    1
  );

  const minRequiredOverlap = productExternalId.includes('poster') ? 0.9 : 0.3;

  if (overlapPercentage < minRequiredOverlap) {
    issues.push('Design should cover more of the print area');
  }

  return {
    isValid: issues.length === 0,
    effectiveDpi: Math.round(effectiveDpi),
    minRequiredDpi,
    overlapPercentage,
    minRequiredOverlap,
    issues,
  };
}

/**
 * Get Printful mockup templates for a product
 *
 * @param productExternalId - Printful product ID
 * @returns Array of available mockup templates
 */
export async function getPrintfulMockupTemplates(
  productExternalId: string
): Promise<string[]> {
  // In production, this would call Printful API to get available mockup templates
  // For MVP, return placeholder
  return [
    `${productExternalId}-front`,
    `${productExternalId}-angle`,
  ];
}
