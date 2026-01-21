/**
 * API Helpers
 *
 * Direct API calls for test setup and teardown.
 */

import type { Page, APIRequestContext } from '@playwright/test'

/**
 * Login as test user via API
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('email-input').fill('test@aiprintly.co.uk')
  await page.getByTestId('password-input').fill('TestPassword123!')
  await page.getByTestId('login-button').click()
  await page.waitForURL('/')
}

/**
 * Login as a new user (registers first)
 */
export async function loginAsNewUser(page: Page): Promise<{ email: string; password: string }> {
  const email = `test-${Date.now()}@example.com`
  const password = 'SecurePass123!'

  await page.goto('/register')
  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(password)
  await page.getByTestId('register-button').click()
  await page.waitForURL('/')

  return { email, password }
}

/**
 * Add a test item to cart via the builder flow
 */
export async function addTestItemToCart(page: Page): Promise<void> {
  // Navigate to a product builder with a test asset
  await page.goto('/build/mug')

  // Wait for builder to load
  await page.waitForSelector('[data-testid="builder-canvas"]', { timeout: 10000 })

  // Add to cart
  await page.getByTestId('add-to-cart-button').click()

  // Handle quality warning if present
  const qualityDialog = page.getByTestId('quality-confirm-dialog')
  if (await qualityDialog.isVisible()) {
    await page.getByTestId('confirm-quality-warning').click()
  }

  // Wait for cart update
  await page.waitForResponse((response) => response.url().includes('/api/cart'))
}

/**
 * Upload a test asset
 */
export async function uploadTestAsset(page: Page): Promise<string> {
  await page.goto('/create/upload')

  // Use a placeholder since we don't have actual test images in CI
  // In a real setup, we'd have fixtures with test images
  const fileInput = page.locator('input[type="file"]')

  // Create a simple test image using canvas
  const imageData = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1000
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(0, 0, 1000, 1000)
      ctx.fillStyle = '#ffffff'
      ctx.font = '48px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Test Image', 500, 500)
    }
    return canvas.toDataURL('image/jpeg')
  })

  // For file input, we'd need actual files - this is a placeholder
  // In real tests, use page.setInputFiles with actual fixture files
  return 'test-asset-id'
}

/**
 * Upload a low quality test asset
 */
export async function uploadLowQualityAsset(page: Page): Promise<void> {
  await page.goto('/create/upload')
  // Similar to above but with smaller dimensions
}

/**
 * Create a test storybook project
 */
export async function createTestStorybookProject(page: Page): Promise<string> {
  await page.goto('/create')
  await page.getByTestId('create-storybook').click()

  // Fill storybook form
  await page.getByTestId('child-name-input').fill('Emma')
  await page.getByTestId('child-age-input').fill('5')
  await page.getByTestId('theme-select').click()
  await page.getByTestId('theme-adventure').click()
  await page.getByTestId('interests-input').fill('dragons, castles')

  // Generate story
  await page.getByTestId('generate-story-button').click()

  // Wait for generation (this would be mocked in real tests)
  await page.waitForURL(/\/build\/storybook/, { timeout: 120000 })

  // Extract project ID from URL
  const url = page.url()
  const match = url.match(/projectId=([^&]+)/)
  return match ? match[1] : 'test-project-id'
}

/**
 * Set user credits via API (requires test endpoint)
 */
export async function setUserCredits(
  request: APIRequestContext,
  credits: number
): Promise<void> {
  await request.post('/api/test/set-credits', {
    data: { credits },
  })
}

/**
 * Clear cart via API
 */
export async function clearCart(page: Page): Promise<void> {
  await page.goto('/cart')

  // Remove all items
  while (await page.getByTestId('cart-item').count() > 0) {
    await page.getByTestId('remove-item').first().click()
    await page.waitForResponse((response) => response.url().includes('/api/cart'))
  }
}

/**
 * Get current credit balance
 */
export async function getCreditBalance(page: Page): Promise<number> {
  const balanceText = await page.getByTestId('credit-balance').textContent()
  return balanceText ? parseInt(balanceText, 10) : 0
}
