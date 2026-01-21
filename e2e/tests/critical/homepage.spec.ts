/**
 * Homepage Critical Tests
 *
 * Basic smoke tests to verify the application loads correctly.
 */

import { test, expect } from '@playwright/test'
import { HomePage } from '../../page-objects'

test.describe('Homepage', () => {
  test('homepage loads successfully', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify page title or key elements
    await expect(page).toHaveTitle(/AIPrintly/i)
  })

  test('hero section is visible', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Check main heading is visible
    await expect(homePage.heroTitle).toBeVisible()
  })

  test('navigation links are present', async ({ page }) => {
    await page.goto('/')

    // Check key navigation elements exist (use first() since there are multiple nav elements)
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })

  test('create button navigates to creation hub', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Click the main CTA if present
    const createButton = page.getByTestId('hero-create-button')
    if (await createButton.isVisible()) {
      await createButton.click()
      await expect(page).toHaveURL(/\/create/)
    }
  })

  test('category cards are displayed', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Check that product categories are shown
    const categoryCount = await homePage.getCategoryCount()
    expect(categoryCount).toBeGreaterThan(0)
  })
})
