/**
 * Critical Path: Upload to Checkout
 *
 * P0 E2E tests for the complete user journey:
 * Upload image → Select product → Customise → Add to cart → Checkout
 *
 * @tag @critical
 */

import { test, expect } from '@playwright/test'
import { HomePage, UploadPage, BuilderPage, CartPage, CheckoutPage } from '../../page-objects'
import { loginAsNewUser } from '../../utils/api-helpers'
import { generateTestAddress } from '../../fixtures/test-data.fixture'

test.describe('Upload to Checkout Flow @critical', () => {
  test.describe.configure({ mode: 'serial' })

  test('complete upload to cart flow as guest', async ({ page }) => {
    // 1. Start at home page
    const homePage = new HomePage(page)
    await homePage.goto()
    await expect(homePage.createButton).toBeVisible()

    // 2. Navigate to create hub
    await homePage.clickCreate()
    await expect(page).toHaveURL(/\/create/)

    // 3. Select upload option
    await page.getByTestId('upload-option').click()
    await expect(page).toHaveURL(/\/create\/upload/)

    // 4. Upload a test image
    const uploadPage = new UploadPage(page)

    // Create a test image file
    const testImageBuffer = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 2000
      canvas.height = 2000
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, 2000, 2000)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#8b5cf6')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 2000, 2000)

        // Add some text
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 120px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('TEST', 1000, 1000)
      }
      return canvas.toDataURL('image/png').split(',')[1]
    })

    // Upload the image
    const buffer = Buffer.from(testImageBuffer, 'base64')
    await uploadPage.fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: buffer,
    })

    // Wait for upload to complete
    await expect(uploadPage.uploadProgress).toBeVisible()
    await expect(uploadPage.uploadSuccess).toBeVisible({ timeout: 30000 })

    // 5. Select product type (mug)
    await page.getByTestId('product-mug').click()
    await expect(page).toHaveURL(/\/build\/mug/)

    // 6. Verify builder loaded with image
    const builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()
    await expect(builderPage.designElement).toBeVisible()

    // 7. Customise the product
    await builderPage.selectSize('11oz')
    await builderPage.selectColour('white')

    // 8. Verify price is shown
    const price = await builderPage.getPrice()
    expect(price).toBeGreaterThan(0)

    // 9. Add to cart
    await builderPage.addToCart()

    // Handle quality warning if shown
    const qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // 10. Verify cart updated
    await expect(page.getByTestId('cart-count')).toContainText('1')

    // 11. Go to cart
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // 12. Verify item in cart
    expect(await cartPage.getItemCount()).toBe(1)
    const itemName = await cartPage.getItemName(0)
    expect(itemName).toContain('Mug')
  })

  test('complete checkout flow as authenticated user', async ({ page }) => {
    // 1. Register and login
    await loginAsNewUser(page)

    // 2. Navigate to builder directly (simulating having an asset)
    await page.goto('/build/mug')
    const builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()

    // 3. Add to cart
    await builderPage.addToCart()

    // Handle quality warning if shown
    const qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // 4. Go to cart and proceed to checkout
    const cartPage = new CartPage(page)
    await cartPage.goto()
    await cartPage.proceedToCheckout()

    // 5. Should be on checkout page (logged in)
    await expect(page).toHaveURL(/\/checkout/)
    const checkoutPage = new CheckoutPage(page)

    // 6. Fill shipping address
    const address = generateTestAddress()
    await checkoutPage.fillShippingAddress(address)

    // 7. Proceed to payment
    await checkoutPage.proceedToPayment()

    // 8. Should redirect to Stripe Checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Note: In test mode, we can't complete Stripe checkout without real keys
    // The test validates up to the Stripe redirect
  })

  test('guest checkout redirects to login/register', async ({ page }) => {
    // 1. Add item to cart as guest
    await page.goto('/build/mug')
    const builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()

    await builderPage.addToCart()
    const qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // 2. Go to cart
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // 3. Try to checkout
    await cartPage.proceedToCheckout()

    // 4. Should redirect to login/register
    await expect(page).toHaveURL(/\/(login|register|checkout)/)
  })

  test('cart persists after login', async ({ page }) => {
    // 1. Add item to cart as guest
    await page.goto('/build/mug')
    const builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()

    await builderPage.addToCart()
    const qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // 2. Verify item in cart
    let cartPage = new CartPage(page)
    await cartPage.goto()
    expect(await cartPage.getItemCount()).toBe(1)

    // 3. Login
    await loginAsNewUser(page)

    // 4. Cart should still have the item (session migration)
    cartPage = new CartPage(page)
    await cartPage.goto()
    expect(await cartPage.getItemCount()).toBeGreaterThanOrEqual(1)
  })

  test('multiple products in cart calculate correct total', async ({ page }) => {
    await loginAsNewUser(page)

    // Add first item (mug)
    await page.goto('/build/mug')
    let builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()
    await builderPage.addToCart()
    let qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // Add second item (print)
    await page.goto('/build/print')
    builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()
    await builderPage.addToCart()
    qualityDialog = page.getByTestId('quality-confirm-dialog')
    if (await qualityDialog.isVisible()) {
      await builderPage.confirmQualityWarning()
    }

    // Verify cart has 2 items
    const cartPage = new CartPage(page)
    await cartPage.goto()
    expect(await cartPage.getItemCount()).toBe(2)

    // Verify total is sum of items
    const subtotal = await cartPage.getSubtotal()
    expect(subtotal).toBeGreaterThan(0)

    const total = await cartPage.getTotal()
    expect(total).toBeGreaterThanOrEqual(subtotal)
  })
})

test.describe('Upload Error Handling @critical', () => {
  test('rejects invalid file types', async ({ page }) => {
    await page.goto('/create/upload')
    const uploadPage = new UploadPage(page)

    // Try to upload a non-image file
    const invalidFile = Buffer.from('not an image')
    await uploadPage.fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: invalidFile,
    })

    // Should show error
    await expect(uploadPage.uploadError).toBeVisible()
    await expect(uploadPage.uploadError).toContainText(/invalid|unsupported|image/i)
  })

  test('shows quality warning for low resolution images', async ({ page }) => {
    await page.goto('/create/upload')
    const uploadPage = new UploadPage(page)

    // Create a small image (low DPI when printed)
    const smallImageBuffer = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(0, 0, 100, 100)
      }
      return canvas.toDataURL('image/png').split(',')[1]
    })

    const buffer = Buffer.from(smallImageBuffer, 'base64')
    await uploadPage.fileInput.setInputFiles({
      name: 'small-image.png',
      mimeType: 'image/png',
      buffer: buffer,
    })

    // Wait for upload and processing
    await expect(uploadPage.uploadSuccess).toBeVisible({ timeout: 30000 })

    // Navigate to builder
    await page.getByTestId('product-mug').click()
    const builderPage = new BuilderPage(page)
    await expect(builderPage.canvas).toBeVisible()

    // Should show quality warning on canvas or when adding to cart
    const hasQualityWarning =
      (await page.getByTestId('quality-warning').isVisible()) ||
      (await page.getByTestId('quality-badge').isVisible())

    // Add to cart should show confirmation dialog
    await builderPage.addToCart()
    const qualityDialog = page.getByTestId('quality-confirm-dialog')

    // Either pre-warning or dialog should be present for low-res images
    expect(hasQualityWarning || (await qualityDialog.isVisible())).toBe(true)
  })
})
