/**
 * Cart Service Tests
 *
 * Tests for cart operations including get, add, update, remove,
 * and validation functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  cartItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  productConfiguration: {
    findUnique: vi.fn(),
  },
  productVariant: {
    findUnique: vi.fn(),
  },
}

vi.mock('~/services/prisma.server', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import {
  getCart,
  getCartItem,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  getCartTotal,
  validateCartItem,
  type CartWithItems,
} from '../cart.server'

describe('Cart Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCart', () => {
    it('should return empty cart when no items exist', async () => {
      mockPrisma.cartItem.findMany.mockResolvedValue([])

      const result = await getCart('session-123')

      expect(result.items).toEqual([])
      expect(result.itemCount).toBe(0)
      expect(result.subtotalPence).toBe(0)
      expect(mockPrisma.cartItem.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return cart with items and calculated totals', async () => {
      const mockItems = [
        {
          id: 'item-1',
          sessionId: 'session-123',
          configurationId: 'config-1',
          quantity: 2,
          unitPricePence: 1499,
          createdAt: new Date(),
          updatedAt: new Date(),
          configuration: {
            id: 'config-1',
            productId: 'product-1',
            variantId: 'variant-1',
            assetId: 'asset-1',
            mockupUrl: 'https://example.com/mockup.jpg',
            product: { name: 'Custom Mug', category: 'MUG' },
            variant: {
              name: 'White / Large',
              stockStatus: 'IN_STOCK',
              sellingPricePence: 1499,
            },
            asset: { storageUrl: 'https://example.com/image.jpg' },
          },
        },
        {
          id: 'item-2',
          sessionId: 'session-123',
          configurationId: 'config-2',
          quantity: 1,
          unitPricePence: 2499,
          createdAt: new Date(),
          updatedAt: new Date(),
          configuration: {
            id: 'config-2',
            productId: 'product-2',
            variantId: 'variant-2',
            assetId: 'asset-2',
            mockupUrl: null,
            product: { name: 'T-Shirt', category: 'APPAREL' },
            variant: {
              name: 'Black / Medium',
              stockStatus: 'IN_STOCK',
              sellingPricePence: 2499,
            },
            asset: { storageUrl: 'https://example.com/image2.jpg' },
          },
        },
      ]

      mockPrisma.cartItem.findMany.mockResolvedValue(mockItems)

      const result = await getCart('session-123')

      expect(result.items).toHaveLength(2)
      expect(result.itemCount).toBe(3) // 2 + 1
      expect(result.subtotalPence).toBe(5497) // (1499 * 2) + (2499 * 1)
    })
  })

  describe('getCartItem', () => {
    it('should return null when item does not exist', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)

      const result = await getCartItem('nonexistent-item', 'session-123')

      expect(result).toBeNull()
    })

    it('should return cart item when it exists for the session', async () => {
      const mockItem = {
        id: 'item-1',
        sessionId: 'session-123',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499,
        configuration: {
          product: { name: 'Custom Mug' },
          variant: { name: 'White' },
        },
      }

      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem)

      const result = await getCartItem('item-1', 'session-123')

      expect(result).toEqual(mockItem)
      expect(mockPrisma.cartItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'item-1',
          sessionId: 'session-123',
        },
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      })
    })
  })

  describe('addToCart', () => {
    it('should create new cart item when configuration not in cart', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)
      mockPrisma.productConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        variant: { sellingPricePence: 1499 },
      })
      mockPrisma.cartItem.create.mockResolvedValue({
        id: 'new-item',
        sessionId: 'session-123',
        configurationId: 'config-1',
        quantity: 1,
        unitPricePence: 1499,
      })

      const result = await addToCart('session-123', 'config-1', 1)

      expect(result.id).toBe('new-item')
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-123',
          configurationId: 'config-1',
          quantity: 1,
          unitPricePence: 1499,
        },
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      })
    })

    it('should update quantity when configuration already in cart', async () => {
      const existingItem = {
        id: 'existing-item',
        sessionId: 'session-123',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499,
      }

      mockPrisma.cartItem.findFirst.mockResolvedValue(existingItem)
      mockPrisma.productConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        variant: { sellingPricePence: 1499 },
      })
      mockPrisma.cartItem.update.mockResolvedValue({
        ...existingItem,
        quantity: 3,
      })

      const result = await addToCart('session-123', 'config-1', 1)

      expect(result.quantity).toBe(3)
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'existing-item' },
        data: { quantity: 3 },
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      })
    })

    it('should throw error when configuration does not exist', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)
      mockPrisma.productConfiguration.findUnique.mockResolvedValue(null)

      await expect(addToCart('session-123', 'invalid-config', 1)).rejects.toThrow(
        'Configuration not found'
      )
    })

    it('should throw error when quantity exceeds maximum', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)
      mockPrisma.productConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        variant: { sellingPricePence: 1499 },
      })

      await expect(addToCart('session-123', 'config-1', 100)).rejects.toThrow(
        'Maximum quantity per item is 99'
      )
    })

    it('should throw error when quantity is less than 1', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)
      mockPrisma.productConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        variant: { sellingPricePence: 1499 },
      })

      await expect(addToCart('session-123', 'config-1', 0)).rejects.toThrow(
        'Quantity must be at least 1'
      )
    })
  })

  describe('updateCartItemQuantity', () => {
    it('should update cart item quantity', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sessionId: 'session-123',
        quantity: 2,
      })
      mockPrisma.cartItem.update.mockResolvedValue({
        id: 'item-1',
        sessionId: 'session-123',
        quantity: 5,
        unitPricePence: 1499,
      })

      const result = await updateCartItemQuantity('item-1', 'session-123', 5)

      expect(result?.quantity).toBe(5)
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1', sessionId: 'session-123' },
        data: { quantity: 5 },
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
              asset: true,
            },
          },
        },
      })
    })

    it('should return null when item does not exist', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)

      const result = await updateCartItemQuantity('nonexistent', 'session-123', 5)

      expect(result).toBeNull()
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled()
    })

    it('should throw error when quantity exceeds maximum', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sessionId: 'session-123',
        quantity: 2,
      })

      await expect(
        updateCartItemQuantity('item-1', 'session-123', 100)
      ).rejects.toThrow('Maximum quantity per item is 99')
    })

    it('should throw error when quantity is less than 1', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sessionId: 'session-123',
        quantity: 2,
      })

      await expect(
        updateCartItemQuantity('item-1', 'session-123', 0)
      ).rejects.toThrow('Quantity must be at least 1')
    })
  })

  describe('removeCartItem', () => {
    it('should remove cart item and return true', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sessionId: 'session-123',
      })
      mockPrisma.cartItem.delete.mockResolvedValue({
        id: 'item-1',
      })

      const result = await removeCartItem('item-1', 'session-123')

      expect(result).toBe(true)
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1', sessionId: 'session-123' },
      })
    })

    it('should return false when item does not exist', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)

      const result = await removeCartItem('nonexistent', 'session-123')

      expect(result).toBe(false)
      expect(mockPrisma.cartItem.delete).not.toHaveBeenCalled()
    })
  })

  describe('clearCart', () => {
    it('should delete all cart items for the session', async () => {
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 3 })

      await clearCart('session-123')

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
      })
    })
  })

  describe('getCartTotal', () => {
    it('should calculate correct total with shipping', async () => {
      const mockItems = [
        { quantity: 2, unitPricePence: 1499 },
        { quantity: 1, unitPricePence: 2499 },
      ]
      mockPrisma.cartItem.findMany.mockResolvedValue(mockItems)

      const result = await getCartTotal('session-123', 499) // 499p shipping

      expect(result.subtotalPence).toBe(5497) // (1499 * 2) + (2499 * 1)
      expect(result.shippingPence).toBe(499)
      expect(result.totalPence).toBe(5996) // 5497 + 499
    })

    it('should return zero totals for empty cart', async () => {
      mockPrisma.cartItem.findMany.mockResolvedValue([])

      const result = await getCartTotal('session-123', 0)

      expect(result.subtotalPence).toBe(0)
      expect(result.shippingPence).toBe(0)
      expect(result.totalPence).toBe(0)
    })
  })

  describe('validateCartItem', () => {
    it('should return valid when variant is in stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        stockStatus: 'IN_STOCK',
        sellingPricePence: 1499,
      })

      const result = await validateCartItem({
        id: 'item-1',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499,
        configuration: {
          variant: { id: 'variant-1' },
        },
      } as any)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid when variant is out of stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        stockStatus: 'OUT_OF_STOCK',
        sellingPricePence: 1499,
      })

      const result = await validateCartItem({
        id: 'item-1',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499,
        configuration: {
          variant: { id: 'variant-1' },
        },
      } as any)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('This item is currently out of stock')
    })

    it('should return warning when variant has low stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        stockStatus: 'LOW_STOCK',
        sellingPricePence: 1499,
      })

      const result = await validateCartItem({
        id: 'item-1',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499,
        configuration: {
          variant: { id: 'variant-1' },
        },
      } as any)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('This item has limited stock remaining')
    })

    it('should return invalid when price has changed', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        stockStatus: 'IN_STOCK',
        sellingPricePence: 1999, // Price increased
      })

      const result = await validateCartItem({
        id: 'item-1',
        configurationId: 'config-1',
        quantity: 2,
        unitPricePence: 1499, // Old price
        configuration: {
          variant: { id: 'variant-1' },
        },
      } as any)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Price has changed since you added this item')
      expect(result.newPricePence).toBe(1999)
    })
  })
})
