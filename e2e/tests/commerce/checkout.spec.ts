/**
 * Checkout Flow Tests
 *
 * E2E tests for the checkout and payment flow.
 *
 * @tag @critical
 */

import { test, expect } from '@playwright/test'
import { CartPage, CheckoutPage } from '../../page-objects'
import { loginAsNewUser, addTestItemToCart } from '../../utils/api-helpers'
import { generateTestAddress, stripeTestCards } from '../../fixtures/test-data.fixture'

test.describe('Checkout Flow @critical', () => {
  test.beforeEach(async ({ page }) => {
    // Login and add item to cart for each test
    await loginAsNewUser(page)
    await addTestItemToCart(page)
  })

  test('displays order summary correctly', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    await expect(checkoutPage.orderSummary).toBeVisible()
    await expect(checkoutPage.orderTotal).toBeVisible()

    const total = await checkoutPage.getOrderTotal()
    expect(total).toBeGreaterThan(0)
  })

  test('validates required shipping fields', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)

    // Try to proceed without filling form
    await checkoutPage.proceedToPayment()

    // Should show validation errors
    await expect(checkoutPage.nameError).toBeVisible()
    await expect(checkoutPage.addressError).toBeVisible()
    await expect(checkoutPage.cityError).toBeVisible()
    await expect(checkoutPage.postcodeError).toBeVisible()
  })

  test('validates UK postcode format', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)

    // Fill with invalid postcode
    await checkoutPage.fillShippingAddress({
      fullName: 'John Doe',
      addressLine1: '123 Test Street',
      city: 'London',
      postcode: 'INVALID',
      country: 'GB',
    })

    await checkoutPage.proceedToPayment()

    // Should show postcode error
    await expect(checkoutPage.postcodeError).toBeVisible()
    await expect(checkoutPage.postcodeError).toContainText(/postcode|invalid/i)
  })

  test('accepts valid UK shipping address', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()

    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    // Should redirect to Stripe (no validation errors)
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })
  })

  test('back to cart link works', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    await checkoutPage.backToCartButton.click()

    await expect(page).toHaveURL(/\/cart/)
  })

  test('order total matches cart total', async ({ page }) => {
    // Get cart total
    const cartPage = new CartPage(page)
    await cartPage.goto()
    const cartTotal = await cartPage.getTotal()

    // Go to checkout
    await cartPage.proceedToCheckout()
    const checkoutPage = new CheckoutPage(page)
    const checkoutTotal = await checkoutPage.getOrderTotal()

    // Totals should match
    expect(checkoutTotal).toBe(cartTotal)
  })
})

test.describe('Stripe Integration @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page)
    await addTestItemToCart(page)
  })

  test('redirects to Stripe Checkout', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    // Should be on Stripe's hosted checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Stripe page should show order amount
    await expect(page.locator('text=/£\\d+/')).toBeVisible()
  })

  test('Stripe checkout shows correct line items', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Stripe page should show product name
    await expect(page.locator('text=/mug|print|apparel/i')).toBeVisible()
  })

  test('cancelled payment returns to site', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Click back/cancel on Stripe
    await checkoutPage.cancelStripePayment()

    // Should return to our site
    await expect(page).toHaveURL(/aiprintly|localhost/)
    await expect(page).toHaveURL(/checkout\.cancelled|cart/)
  })

  // Note: Full payment testing requires Stripe test mode with real test keys
  // In CI, we typically mock Stripe or use their test mode
  test.skip('successful payment shows confirmation', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Complete payment with test card
    await checkoutPage.fillPayment(stripeTestCards.success)

    // Should redirect to success page
    await expect(page).toHaveURL(/checkout\.success|order-confirmation/)

    // Should show order number
    await expect(page.getByTestId('order-number')).toBeVisible()
  })

  test.skip('declined card shows error', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Use declined card
    await checkoutPage.fillPayment(stripeTestCards.declined)

    // Should show error message
    await expect(page.locator('text=/declined|failed/i')).toBeVisible()
  })
})

test.describe('Checkout Edge Cases', () => {
  test('empty cart cannot checkout', async ({ page }) => {
    await loginAsNewUser(page)

    // Go directly to checkout with empty cart
    await page.goto('/checkout')

    // Should redirect to cart or show error
    await expect(page).toHaveURL(/\/cart/)

    // Or show empty cart message
    const emptyMessage = page.getByTestId('empty-cart-message')
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toContainText(/empty|no items/i)
    }
  })

  test('handles session expiry during checkout', async ({ page }) => {
    await loginAsNewUser(page)
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    // Clear cookies to simulate session expiry
    await page.context().clearCookies()

    // Try to proceed to payment
    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    // Should redirect to login or show error
    await expect(page).toHaveURL(/\/(login|checkout)/)
  })

  test('multiple quantity items show correct total', async ({ page }) => {
    await loginAsNewUser(page)
    await addTestItemToCart(page)

    // Update quantity
    const cartPage = new CartPage(page)
    await cartPage.goto()

    const initialTotal = await cartPage.getTotal()
    await cartPage.setQuantity(0, 3)

    // Wait for update
    await page.waitForTimeout(500)

    const newTotal = await cartPage.getTotal()
    expect(newTotal).toBeGreaterThan(initialTotal)

    // Proceed to checkout
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const checkoutTotal = await checkoutPage.getOrderTotal()

    // Checkout total should reflect quantity
    expect(checkoutTotal).toBe(newTotal)
  })
})

test.describe('Order Confirmation', () => {
  test.skip('success page shows order details', async ({ page }) => {
    // This test requires completing a Stripe payment
    // Skipped unless running with real Stripe test keys

    await loginAsNewUser(page)
    await addTestItemToCart(page)

    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    const checkoutPage = new CheckoutPage(page)
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)
    await checkoutPage.proceedToPayment()

    // Complete payment
    await checkoutPage.fillPayment(stripeTestCards.success)

    // Verify success page
    await expect(page).toHaveURL(/checkout\.success/)
    await expect(page.getByTestId('order-number')).toBeVisible()
    await expect(page.getByTestId('order-total')).toBeVisible()
    await expect(page.getByTestId('shipping-address')).toBeVisible()

    // Should show tracking link
    await expect(page.getByTestId('track-order-link')).toBeVisible()
  })

  test.skip('order confirmation email sent', async ({ page }) => {
    // This would require email testing infrastructure
    // Could use Mailhog, Mailtrap, or similar for testing
  })
})
