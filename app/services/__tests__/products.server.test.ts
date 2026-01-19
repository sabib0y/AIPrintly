/**
 * Products Service Tests
 *
 * Tests for product queries and operations including:
 * - Fetching all products with filtering and pagination
 * - Fetching single product by ID
 * - Fetching products by category
 * - Product variant operations
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Product, ProductVariant, ProductCategory, StockStatus, FulfilmentProvider } from '@prisma/client';

// Mock Prisma client
vi.mock('../prisma.server', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../prisma.server';
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductVariants,
  getProductVariantById,
  type ProductWithVariants,
  type ProductListOptions,
  type ProductListResult,
} from '../products.server';

// Helper to create mock product data
const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-123',
  externalId: 'printful-123',
  provider: 'PRINTFUL' as FulfilmentProvider,
  category: 'MUG' as ProductCategory,
  name: 'Classic Mug',
  description: 'A beautiful ceramic mug',
  basePricePence: 800,
  sellingPricePence: 1499,
  isActive: true,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Helper to create mock variant data
const createMockVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 'var-123',
  productId: 'prod-123',
  externalId: 'printful-var-123',
  name: 'White 11oz',
  size: '11oz',
  colour: 'White',
  colourHex: '#FFFFFF',
  basePricePence: 800,
  sellingPricePence: 1499,
  stockStatus: 'IN_STOCK' as StockStatus,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Products Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all active products with default pagination', async () => {
      const mockProducts = [
        createMockProduct({ id: 'prod-1' }),
        createMockProduct({ id: 'prod-2' }),
      ];

      (prisma.product.findMany as Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as Mock).mockResolvedValue(2);

      const result = await getProducts();

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(12);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          take: 12,
          skip: 0,
        })
      );
    });

    it('should apply custom pagination options', async () => {
      const mockProducts = [createMockProduct()];
      (prisma.product.findMany as Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as Mock).mockResolvedValue(25);

      const options: ProductListOptions = { page: 3, pageSize: 10 };
      const result = await getProducts(options);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should filter by category when provided', async () => {
      const mockProducts = [createMockProduct({ category: 'APPAREL' as ProductCategory })];
      (prisma.product.findMany as Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as Mock).mockResolvedValue(1);

      const result = await getProducts({ category: 'APPAREL' });

      expect(result.products).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, category: 'APPAREL' },
        })
      );
    });

    it('should filter by search query when provided', async () => {
      (prisma.product.findMany as Mock).mockResolvedValue([]);
      (prisma.product.count as Mock).mockResolvedValue(0);

      await getProducts({ search: 'mug' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'mug', mode: 'insensitive' } },
              { description: { contains: 'mug', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should include variants when specified', async () => {
      const mockProducts = [
        {
          ...createMockProduct(),
          variants: [createMockVariant()],
        },
      ];
      (prisma.product.findMany as Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as Mock).mockResolvedValue(1);

      const result = await getProducts({ includeVariants: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { variants: true },
        })
      );
      expect((result.products[0] as ProductWithVariants).variants).toBeDefined();
    });

    it('should sort products by specified field', async () => {
      (prisma.product.findMany as Mock).mockResolvedValue([]);
      (prisma.product.count as Mock).mockResolvedValue(0);

      await getProducts({ sortBy: 'name', sortOrder: 'asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should default sort by createdAt descending', async () => {
      (prisma.product.findMany as Mock).mockResolvedValue([]);
      (prisma.product.count as Mock).mockResolvedValue(0);

      await getProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should handle empty results', async () => {
      (prisma.product.findMany as Mock).mockResolvedValue([]);
      (prisma.product.count as Mock).mockResolvedValue(0);

      const result = await getProducts();

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getProductById', () => {
    it('should return product with variants by ID', async () => {
      const mockProduct = {
        ...createMockProduct(),
        variants: [createMockVariant()],
      };
      (prisma.product.findUnique as Mock).mockResolvedValue(mockProduct);

      const result = await getProductById('prod-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('prod-123');
      expect(result?.variants).toHaveLength(1);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        include: { variants: true },
      });
    });

    it('should return null for non-existent product', async () => {
      (prisma.product.findUnique as Mock).mockResolvedValue(null);

      const result = await getProductById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for inactive product by default', async () => {
      (prisma.product.findUnique as Mock).mockResolvedValue(
        createMockProduct({ isActive: false })
      );

      const result = await getProductById('prod-123');

      expect(result).toBeNull();
    });

    it('should return inactive product when includeInactive is true', async () => {
      const mockProduct = {
        ...createMockProduct({ isActive: false }),
        variants: [],
      };
      (prisma.product.findUnique as Mock).mockResolvedValue(mockProduct);

      const result = await getProductById('prod-123', { includeInactive: true });

      expect(result).toBeDefined();
      expect(result?.isActive).toBe(false);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for the specified category', async () => {
      const mockProducts = [
        createMockProduct({ id: 'prod-1', category: 'MUG' as ProductCategory }),
        createMockProduct({ id: 'prod-2', category: 'MUG' as ProductCategory }),
      ];
      (prisma.product.findMany as Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as Mock).mockResolvedValue(2);

      const result = await getProductsByCategory('MUG');

      expect(result.products).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, category: 'MUG' },
        })
      );
    });

    it('should accept category as lowercase string', async () => {
      (prisma.product.findMany as Mock).mockResolvedValue([]);
      (prisma.product.count as Mock).mockResolvedValue(0);

      await getProductsByCategory('mug');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, category: 'MUG' },
        })
      );
    });

    it('should return empty result for invalid category', async () => {
      const result = await getProductsByCategory('INVALID' as ProductCategory);

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getProductVariants', () => {
    it('should return all variants for a product', async () => {
      const mockVariants = [
        createMockVariant({ id: 'var-1' }),
        createMockVariant({ id: 'var-2' }),
      ];
      (prisma.productVariant.findMany as Mock).mockResolvedValue(mockVariants);

      const result = await getProductVariants('prod-123');

      expect(result).toHaveLength(2);
      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-123' },
        orderBy: [{ colour: 'asc' }, { size: 'asc' }],
      });
    });

    it('should filter by stock status when specified', async () => {
      (prisma.productVariant.findMany as Mock).mockResolvedValue([]);

      await getProductVariants('prod-123', { inStockOnly: true });

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          productId: 'prod-123',
          stockStatus: 'IN_STOCK',
        },
        orderBy: [{ colour: 'asc' }, { size: 'asc' }],
      });
    });

    it('should return empty array for product with no variants', async () => {
      (prisma.productVariant.findMany as Mock).mockResolvedValue([]);

      const result = await getProductVariants('prod-no-variants');

      expect(result).toHaveLength(0);
    });
  });

  describe('getProductVariantById', () => {
    it('should return variant by ID', async () => {
      const mockVariant = createMockVariant();
      (prisma.productVariant.findUnique as Mock).mockResolvedValue(mockVariant);

      const result = await getProductVariantById('var-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('var-123');
    });

    it('should return null for non-existent variant', async () => {
      (prisma.productVariant.findUnique as Mock).mockResolvedValue(null);

      const result = await getProductVariantById('non-existent');

      expect(result).toBeNull();
    });
  });
});

describe('Product Type Exports', () => {
  it('should export ProductWithVariants type', () => {
    // Type assertion test - if this compiles, the type is exported correctly
    const product: ProductWithVariants = {
      ...createMockProduct(),
      variants: [createMockVariant()],
    };
    expect(product.variants).toBeDefined();
  });

  it('should export ProductListOptions type', () => {
    const options: ProductListOptions = {
      page: 1,
      pageSize: 12,
      category: 'MUG',
      search: 'test',
      sortBy: 'name',
      sortOrder: 'asc',
      includeVariants: true,
    };
    expect(options).toBeDefined();
  });

  it('should export ProductListResult type', () => {
    const result: ProductListResult = {
      products: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
    };
    expect(result).toBeDefined();
  });
});
