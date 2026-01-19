/**
 * Products API Endpoint Tests
 *
 * Tests for GET /api/products endpoint including:
 * - Basic product listing
 * - Pagination
 * - Category filtering
 * - Search functionality
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the products service
vi.mock('~/services/products.server', () => ({
  getProducts: vi.fn(),
  CATEGORY_SLUG_MAP: {
    mugs: 'MUG',
    apparel: 'APPAREL',
    prints: 'PRINT',
    storybooks: 'STORYBOOK',
  },
}));

import { loader } from '../api.products';
import { getProducts } from '~/services/products.server';

// Helper to create a mock Request
function createRequest(url: string): Request {
  return new Request(`http://localhost${url}`);
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful responses', () => {
    it('should return products list with default pagination', async () => {
      const mockResult = {
        products: [
          { id: 'prod-1', name: 'Product 1' },
          { id: 'prod-2', name: 'Product 2' },
        ],
        total: 2,
        page: 1,
        pageSize: 12,
        totalPages: 1,
      };

      vi.mocked(getProducts).mockResolvedValue(mockResult);

      const request = createRequest('/api/products');
      const response = await loader({ request, params: {}, context: {} });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.products).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
    });

    it('should pass pagination parameters from query string', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 100,
        page: 3,
        pageSize: 10,
        totalPages: 10,
      });

      const request = createRequest('/api/products?page=3&pageSize=10');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          pageSize: 10,
        })
      );
    });

    it('should pass category filter from query string', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?category=MUG');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'MUG',
        })
      );
    });

    it('should pass search query from query string', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?search=ceramic');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'ceramic',
        })
      );
    });

    it('should pass sort options from query string', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?sortBy=name&sortOrder=asc');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );
    });

    it('should include variants when includeVariants is true', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [{ id: 'prod-1', name: 'Product 1', variants: [] }],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
      });

      const request = createRequest('/api/products?includeVariants=true');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          includeVariants: true,
        })
      );
    });

    it('should set correct Content-Type header', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products');
      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should set cache control headers', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products');
      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });
  });

  describe('input validation', () => {
    it('should use default page when invalid page provided', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?page=invalid');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    it('should use default pageSize when invalid pageSize provided', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?pageSize=abc');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 12,
        })
      );
    });

    it('should cap pageSize at maximum 100', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 100,
        totalPages: 0,
      });

      const request = createRequest('/api/products?pageSize=500');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 100,
        })
      );
    });

    it('should ensure page is at least 1', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?page=0');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    it('should ignore invalid sortBy values', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?sortBy=invalid');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.not.objectContaining({
          sortBy: 'invalid',
        })
      );
    });

    it('should ignore invalid sortOrder values', async () => {
      vi.mocked(getProducts).mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });

      const request = createRequest('/api/products?sortOrder=random');
      await loader({ request, params: {}, context: {} });

      expect(getProducts).toHaveBeenCalledWith(
        expect.not.objectContaining({
          sortOrder: 'random',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should return 500 on service error', async () => {
      vi.mocked(getProducts).mockRejectedValue(new Error('Database error'));

      const request = createRequest('/api/products');
      const response = await loader({ request, params: {}, context: {} });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
