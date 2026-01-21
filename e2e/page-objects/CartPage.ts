/**
 * Cart Page Object
 *
 * Page object for the shopping cart.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class CartPage extends BasePage {
  // Main elements
  readonly cartItems: Locator
  readonly emptyCartMessage: Locator
  readonly subtotal: Locator
  readonly shipping: Locator
  readonly total: Locator
  readonly checkoutButton: Locator
  readonly continueShoppingLink: Locator

  constructor(page: Page) {
    super(page)
    this.cartItems = page.getByTestId('cart-item')
    this.emptyCartMessage = page.getByTestId('empty-cart')
    this.subtotal = page.getByTestId('cart-subtotal')
    this.shipping = page.getByTestId('cart-shipping')
    this.total = page.getByTestId('cart-total')
    this.checkoutButton = page.getByTestId('checkout-button')
    this.continueShoppingLink = page.getByTestId('continue-shopping')
  }

  get urlPattern(): RegExp {
    return /\/cart/
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart')
    await this.waitForLoad()
  }

  /**
   * Get number of items in cart
   */
  async getItemCount(): Promise<number> {
    return this.cartItems.count()
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    return this.emptyCartMessage.isVisible()
  }

  /**
   * Get item at specific index
   */
  getItem(index: number): Locator {
    return this.cartItems.nth(index)
  }

  /**
   * Get item name by index
   */
  async getItemName(index: number): Promise<string | null> {
    return this.getItem(index).getByTestId('item-name').textContent()
  }

  /**
   * Get item price by index (in pence)
   */
  async getItemPrice(index: number): Promise<number> {
    const text = await this.getItem(index).getByTestId('item-price').textContent()
    // Parse price like "£14.99" to pence
    const match = text?.match(/£(\d+)\.(\d{2})/)
    if (match) {
      return parseInt(match[1], 10) * 100 + parseInt(match[2], 10)
    }
    return 0
  }

  /**
   * Get item quantity by index
   */
  async getItemQuantity(index: number): Promise<number> {
    const input = this.getItem(index).getByTestId('item-quantity')
    const value = await input.inputValue()
    return parseInt(value, 10)
  }

  /**
   * Set item quantity
   */
  async setQuantity(index: number, quantity: number): Promise<void> {
    const input = this.getItem(index).getByTestId('item-quantity')
    await input.fill(quantity.toString())
    await input.blur()
    // Wait for update
    await this.page.waitForResponse((response) => response.url().includes('/api/cart'))
  }

  /**
   * Remove item from cart
   */
  async removeItem(index: number): Promise<void> {
    await this.getItem(index).getByTestId('remove-item').click()
    // Wait for update
    await this.page.waitForResponse((response) => response.url().includes('/api/cart'))
  }

  /**
   * Get quality warning for item (if any)
   */
  getItemWarning(index: number): Locator {
    return this.getItem(index).getByTestId('quality-warning')
  }

  /**
   * Get subtotal in pence
   */
  async getSubtotal(): Promise<number> {
    const text = await this.subtotal.textContent()
    const match = text?.match(/£(\d+)\.(\d{2})/)
    if (match) {
      return parseInt(match[1], 10) * 100 + parseInt(match[2], 10)
    }
    return 0
  }

  /**
   * Get total in pence
   */
  async getTotal(): Promise<number> {
    const text = await this.total.textContent()
    const match = text?.match(/£(\d+)\.(\d{2})/)
    if (match) {
      return parseInt(match[1], 10) * 100 + parseInt(match[2], 10)
    }
    return 0
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click()
  }

  /**
   * Continue shopping
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingLink.click()
  }
}
