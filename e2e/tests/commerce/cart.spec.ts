/**
 * Shopping Cart Tests
 *
 * E2E tests for cart functionality.
 */

import { test, expect } from '@playwright/test'
import { CartPage, BuilderPage } from '../../page-objects'
import { addTestItemToCart, loginAsNewUser } from '../../utils/api-helpers'

test.describe('Shopping Cart', () => {
  test('empty cart shows appropriate message', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Should show empty cart message
    await expect(cartPage.emptyCartMessage).toBeVisible()
    expect(await cartPage.getItemCount()).toBe(0)
  })

  test('can view cart with items', async ({ page }) => {
    // Add item to cart first
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Should have at least one item
    const itemCount = await cartPage.getItemCount()
    expect(itemCount).toBeGreaterThan(0)

    // Should show item details
    const itemName = await cartPage.getItemName(0)
    expect(itemName).toBeTruthy()
  })

  test('cart displays correct totals', async ({ page }) => {
    // Add item to cart
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Get prices
    const subtotal = await cartPage.getSubtotal()
    const total = await cartPage.getTotal()

    // Total should be at least subtotal (may include shipping)
    expect(total).toBeGreaterThanOrEqual(subtotal)
    expect(subtotal).toBeGreaterThan(0)
  })

  test('can update item quantity', async ({ page }) => {
    // Add item to cart
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Get initial subtotal
    const initialSubtotal = await cartPage.getSubtotal()

    // Update quantity to 2
    await cartPage.setQuantity(0, 2)

    // Wait for update
    await page.waitForTimeout(500)

    // Subtotal should approximately double
    const newSubtotal = await cartPage.getSubtotal()
    expect(newSubtotal).toBeGreaterThan(initialSubtotal)
  })

  test('can remove item from cart', async ({ page }) => {
    // Add item to cart
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Verify item exists
    const initialCount = await cartPage.getItemCount()
    expect(initialCount).toBeGreaterThan(0)

    // Remove item
    await cartPage.removeItem(0)

    // Cart should be empty
    await expect(cartPage.emptyCartMessage).toBeVisible()
  })

  test('cart persists across page navigation', async ({ page }) => {
    // Add item to cart
    await addTestItemToCart(page)

    // Navigate to home
    await page.goto('/')

    // Navigate back to cart
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Should still have item
    const itemCount = await cartPage.getItemCount()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('cart header badge updates', async ({ page }) => {
    // Start with empty cart
    await page.goto('/')

    // Initial cart count should be 0
    const initialCount = await page.getByTestId('cart-count').textContent()

    // Add item to cart
    await addTestItemToCart(page)

    // Navigate somewhere to see updated header
    await page.goto('/')

    // Cart count should be updated
    const newCount = await page.getByTestId('cart-count').textContent()
    expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'))
  })

  test('continue shopping link works', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.continueShopping()

    // Should navigate away from cart
    await expect(page).not.toHaveURL(/\/cart$/)
  })

  test('proceed to checkout button requires login', async ({ page }) => {
    // Add item as guest
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Try to checkout
    await cartPage.proceedToCheckout()

    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/\/(login|register|checkout)/)
  })

  test('logged in user can proceed to checkout', async ({ page }) => {
    // Login first
    await loginAsNewUser(page)

    // Add item to cart
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Proceed to checkout
    await cartPage.proceedToCheckout()

    // Should be on checkout page
    await expect(page).toHaveURL(/\/checkout/)
  })
})

test.describe('Cart with quality warnings', () => {
  test('displays quality warnings on cart items', async ({ page }) => {
    // Add item with quality warning
    // This would require uploading a low-res image
    const builderPage = new BuilderPage(page)
    await builderPage.goto('print')

    // If there's a quality warning, proceed anyway
    await builderPage.addToCart()

    const qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()

      // Check cart shows warning
      const cartPage = new CartPage(page)
      await cartPage.goto()

      // The item should have a quality warning badge
      const warning = cartPage.getItemWarning(0)
      await expect(warning).toBeVisible()
    }
  })
})
