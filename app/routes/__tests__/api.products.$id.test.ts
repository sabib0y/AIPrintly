/**
 * Single Product API Endpoint Tests
 *
 * Tests for GET /api/products/:id endpoint including:
 * - Successful product fetch
 * - Product not found
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the products service
vi.mock('~/services/products.server', () => ({
  getProductById: vi.fn(),
}));

import { loader } from '../api.products.$id';
import { getProductById } from '~/services/products.server';

// Helper to create a mock Request
function createRequest(url: string): Request {
  return new Request(`http://localhost${url}`);
}

// Mock product data
const mockProduct = {
  id: 'prod-123',
  externalId: 'printful-123',
  provider: 'PRINTFUL',
  category: 'MUG',
  name: 'Classic Mug',
  description: 'A beautiful ceramic mug',
  basePricePence: 800,
  sellingPricePence: 1499,
  isActive: true,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  variants: [
    {
      id: 'var-1',
      productId: 'prod-123',
      externalId: 'printful-var-1',
      name: 'White 11oz',
      size: '11oz',
      colour: 'White',
      colourHex: '#FFFFFF',
      basePricePence: 800,
      sellingPricePence: 1499,
      stockStatus: 'IN_STOCK',
      metadata: {},
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'var-2',
      productId: 'prod-123',
      externalId: 'printful-var-2',
      name: 'Black 11oz',
      size: '11oz',
      colour: 'Black',
      colourHex: '#000000',
      basePricePence: 800,
      sellingPricePence: 1499,
      stockStatus: 'IN_STOCK',
      metadata: {},
      createdAt: new Date('2024-01-01'),
    },
  ],
};

describe('GET /api/products/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful responses', () => {
    it('should return product with variants when found', async () => {
      vi.mocked(getProductById).mockResolvedValue(mockProduct);

      const request = createRequest('/api/products/prod-123');
      const response = await loader({
        request,
        params: { id: 'prod-123' },
        context: {},
      });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe('prod-123');
      expect(data.name).toBe('Classic Mug');
      expect(data.variants).toHaveLength(2);
    });

    it('should call service with correct product ID', async () => {
      vi.mocked(getProductById).mockResolvedValue(mockProduct);

      const request = createRequest('/api/products/prod-456');
      await loader({
        request,
        params: { id: 'prod-456' },
        context: {},
      });

      expect(getProductById).toHaveBeenCalledWith('prod-456', expect.any(Object));
    });

    it('should set correct Content-Type header', async () => {
      vi.mocked(getProductById).mockResolvedValue(mockProduct);

      const request = createRequest('/api/products/prod-123');
      const response = await loader({
        request,
        params: { id: 'prod-123' },
        context: {},
      });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should set cache control headers for found products', async () => {
      vi.mocked(getProductById).mockResolvedValue(mockProduct);

      const request = createRequest('/api/products/prod-123');
      const response = await loader({
        request,
        params: { id: 'prod-123' },
        context: {},
      });

      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });
  });

  describe('not found responses', () => {
    it('should return 404 when product not found', async () => {
      vi.mocked(getProductById).mockResolvedValue(null);

      const request = createRequest('/api/products/non-existent');
      const response = await loader({
        request,
        params: { id: 'non-existent' },
        context: {},
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Product not found');
    });

    it('should return 400 when no ID provided', async () => {
      const request = createRequest('/api/products/');
      const response = await loader({
        request,
        params: {},
        context: {},
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Product ID is required');
    });
  });

  describe('error handling', () => {
    it('should return 500 on service error', async () => {
      vi.mocked(getProductById).mockRejectedValue(new Error('Database error'));

      const request = createRequest('/api/products/prod-123');
      const response = await loader({
        request,
        params: { id: 'prod-123' },
        context: {},
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to fetch product');
    });

    it('should include error message in 500 response', async () => {
      vi.mocked(getProductById).mockRejectedValue(new Error('Connection timeout'));

      const request = createRequest('/api/products/prod-123');
      const response = await loader({
        request,
        params: { id: 'prod-123' },
        context: {},
      });

      const data = await response.json();
      expect(data.message).toBe('Connection timeout');
    });
  });
});
