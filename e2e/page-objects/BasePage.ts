/**
 * Base Page Object
 *
 * Common methods and utilities for all page objects.
 */

import type { Page, Locator } from '@playwright/test'

export abstract class BasePage {
  protected readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Get page URL pattern (to be overridden)
   */
  abstract get urlPattern(): RegExp

  /**
   * Navigate to this page
   */
  abstract goto(...args: unknown[]): Promise<void>

  /**
   * Check if currently on this page
   */
  async isCurrentPage(): Promise<boolean> {
    return this.urlPattern.test(this.page.url())
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get element by data-testid
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  /**
   * Get text content by data-testid
   */
  async getTextByTestId(testId: string): Promise<string | null> {
    return this.page.getByTestId(testId).textContent()
  }

  /**
   * Click element by data-testid
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.page.getByTestId(testId).click()
  }

  /**
   * Fill input by data-testid
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).fill(value)
  }

  /**
   * Check if element exists by data-testid
   */
  async existsByTestId(testId: string): Promise<boolean> {
    return (await this.page.getByTestId(testId).count()) > 0
  }

  /**
   * Wait for element to be visible
   */
  async waitForTestId(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.page.getByTestId(testId).waitFor({ state: 'visible', ...options })
  }

  /**
   * Get cart count from header
   */
  async getCartCount(): Promise<number> {
    const text = await this.page.getByTestId('cart-count').textContent()
    return text ? parseInt(text, 10) : 0
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return (await this.page.getByTestId('user-menu').count()) > 0
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(expectedText?: string): Promise<void> {
    const toast = this.page.getByRole('alert')
    await toast.waitFor({ state: 'visible' })
    if (expectedText) {
      await this.page.getByText(expectedText).waitFor({ state: 'visible' })
    }
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
  }
}
