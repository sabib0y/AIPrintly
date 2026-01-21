/**
 * Cart Service
 *
 * Server-side cart operations for managing shopping cart items.
 * All prices are stored and calculated in pence.
 */

import { prisma } from './prisma.server'
import type { CartItem, Product, ProductVariant, Asset, ProductConfiguration } from '@prisma/client'

/**
 * Maximum quantity allowed per cart item
 */
const MAX_QUANTITY = 99

/**
 * Cart item with related configuration data
 */
export type CartItemWithConfiguration = CartItem & {
  configuration: ProductConfiguration & {
    product: Product
    variant: ProductVariant
    asset: Asset
  }
}

/**
 * Cart summary with items and totals
 */
export interface CartWithItems {
  items: CartItemWithConfiguration[]
  itemCount: number
  subtotalPence: number
}

/**
 * Cart total breakdown
 */
export interface CartTotal {
  subtotalPence: number
  shippingPence: number
  totalPence: number
}

/**
 * Cart item validation result
 */
export interface CartItemValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  newPricePence?: number
}

/**
 * Include configuration for cart item queries
 */
const cartItemInclude = {
  configuration: {
    include: {
      product: true,
      variant: true,
      asset: true,
    },
  },
}

/**
 * Extended include with customisation data
 */
const cartItemIncludeWithCustomisation = {
  configuration: {
    select: {
      id: true,
      mockupUrl: true,
      customisation: true,
      product: true,
      variant: true,
      asset: true,
    },
  },
}

/**
 * Get cart items for a session
 *
 * @param sessionId - The session ID
 * @returns Cart with items and calculated totals
 */
export async function getCart(sessionId: string): Promise<CartWithItems> {
  const items = await prisma.cartItem.findMany({
    where: { sessionId },
    include: cartItemIncludeWithCustomisation,
    orderBy: { createdAt: 'desc' },
  })

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0
  )

  return {
    items: items as CartItemWithConfiguration[],
    itemCount,
    subtotalPence,
  }
}

/**
 * Get a single cart item by ID
 *
 * @param itemId - The cart item ID
 * @param sessionId - The session ID (for security)
 * @returns Cart item or null if not found
 */
export async function getCartItem(
  itemId: string,
  sessionId: string
): Promise<CartItemWithConfiguration | null> {
  const item = await prisma.cartItem.findUnique({
    where: {
      id: itemId,
      sessionId,
    },
    include: cartItemInclude,
  })

  return item as CartItemWithConfiguration | null
}

/**
 * Add an item to the cart
 *
 * If the configuration already exists in the cart, increases the quantity.
 *
 * @param sessionId - The session ID
 * @param configurationId - The product configuration ID
 * @param quantity - Quantity to add (default: 1)
 * @returns Created or updated cart item
 * @throws Error if configuration not found or quantity invalid
 */
export async function addToCart(
  sessionId: string,
  configurationId: string,
  quantity: number = 1
): Promise<CartItemWithConfiguration> {
  // Validate quantity
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1')
  }
  if (quantity > MAX_QUANTITY) {
    throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`)
  }

  // Get the configuration with variant price
  const configuration = await prisma.productConfiguration.findUnique({
    where: { id: configurationId },
    include: { variant: true },
  })

  if (!configuration) {
    throw new Error('Configuration not found')
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      sessionId,
      configurationId,
    },
  })

  if (existingItem) {
    // Update existing item quantity
    const newQuantity = existingItem.quantity + quantity
    if (newQuantity > MAX_QUANTITY) {
      throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`)
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
      include: cartItemInclude,
    })

    return updatedItem as CartItemWithConfiguration
  }

  // Create new cart item
  const newItem = await prisma.cartItem.create({
    data: {
      sessionId,
      configurationId,
      quantity,
      unitPricePence: configuration.variant.sellingPricePence,
    },
    include: cartItemInclude,
  })

  return newItem as CartItemWithConfiguration
}

/**
 * Update cart item quantity
 *
 * @param itemId - The cart item ID
 * @param sessionId - The session ID (for security)
 * @param quantity - New quantity
 * @returns Updated cart item or null if not found
 * @throws Error if quantity invalid
 */
export async function updateCartItemQuantity(
  itemId: string,
  sessionId: string,
  quantity: number
): Promise<CartItemWithConfiguration | null> {
  // Validate quantity
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1')
  }
  if (quantity > MAX_QUANTITY) {
    throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`)
  }

  // Verify item exists and belongs to session
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      id: itemId,
      sessionId,
    },
  })

  if (!existingItem) {
    return null
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: itemId, sessionId },
    data: { quantity },
    include: cartItemInclude,
  })

  return updatedItem as CartItemWithConfiguration
}

/**
 * Remove an item from the cart
 *
 * @param itemId - The cart item ID
 * @param sessionId - The session ID (for security)
 * @returns True if item was removed, false if not found
 */
export async function removeCartItem(
  itemId: string,
  sessionId: string
): Promise<boolean> {
  // Verify item exists and belongs to session
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      id: itemId,
      sessionId,
    },
  })

  if (!existingItem) {
    return false
  }

  await prisma.cartItem.delete({
    where: { id: itemId, sessionId },
  })

  return true
}

/**
 * Clear all items from the cart
 *
 * @param sessionId - The session ID
 */
export async function clearCart(sessionId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { sessionId },
  })
}

/**
 * Get cart total with shipping
 *
 * @param sessionId - The session ID
 * @param shippingPence - Shipping cost in pence
 * @returns Cart total breakdown
 */
export async function getCartTotal(
  sessionId: string,
  shippingPence: number
): Promise<CartTotal> {
  const items = await prisma.cartItem.findMany({
    where: { sessionId },
    select: {
      quantity: true,
      unitPricePence: true,
    },
  })

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0
  )

  // Don't charge shipping for empty cart
  const finalShipping = items.length > 0 ? shippingPence : 0

  return {
    subtotalPence,
    shippingPence: finalShipping,
    totalPence: subtotalPence + finalShipping,
  }
}

/**
 * Validate a cart item
 *
 * Checks stock availability and price changes.
 *
 * @param item - The cart item to validate
 * @returns Validation result with errors and warnings
 */
export async function validateCartItem(
  item: CartItemWithConfiguration
): Promise<CartItemValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  let newPricePence: number | undefined

  // Get current variant data
  const variant = await prisma.productVariant.findUnique({
    where: { id: item.configuration.variant.id },
    select: {
      stockStatus: true,
      sellingPricePence: true,
    },
  })

  if (!variant) {
    return {
      isValid: false,
      errors: ['This product variant is no longer available'],
      warnings: [],
    }
  }

  // Check stock status
  if (variant.stockStatus === 'OUT_OF_STOCK') {
    errors.push('This item is currently out of stock')
  } else if (variant.stockStatus === 'LOW_STOCK') {
    warnings.push('This item has limited stock remaining')
  }

  // Check for price changes
  if (variant.sellingPricePence !== item.unitPricePence) {
    errors.push('Price has changed since you added this item')
    newPricePence = variant.sellingPricePence
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    newPricePence,
  }
}

/**
 * Validate entire cart
 *
 * @param sessionId - The session ID
 * @returns Object with validation results for each item
 */
export async function validateCart(
  sessionId: string
): Promise<{
  isValid: boolean
  items: Array<{ itemId: string; validation: CartItemValidation }>
}> {
  const cart = await getCart(sessionId)
  const validations: Array<{ itemId: string; validation: CartItemValidation }> = []

  for (const item of cart.items) {
    const validation = await validateCartItem(item)
    validations.push({ itemId: item.id, validation })
  }

  const isValid = validations.every((v) => v.validation.isValid)

  return { isValid, items: validations }
}

/**
 * Update cart item price to current variant price
 *
 * @param itemId - The cart item ID
 * @param sessionId - The session ID
 * @returns Updated cart item
 */
export async function syncCartItemPrice(
  itemId: string,
  sessionId: string
): Promise<CartItemWithConfiguration | null> {
  const item = await getCartItem(itemId, sessionId)

  if (!item) {
    return null
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: item.configuration.variant.id },
    select: { sellingPricePence: true },
  })

  if (!variant) {
    return null
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: itemId, sessionId },
    data: { unitPricePence: variant.sellingPricePence },
    include: cartItemInclude,
  })

  return updatedItem as CartItemWithConfiguration
}

/**
 * Get cart item count for session
 *
 * @param sessionId - The session ID
 * @returns Total quantity of items in cart
 */
export async function getCartItemCount(sessionId: string): Promise<number> {
  const items = await prisma.cartItem.findMany({
    where: { sessionId },
    select: { quantity: true },
  })

  return items.reduce((sum, item) => sum + item.quantity, 0)
}
