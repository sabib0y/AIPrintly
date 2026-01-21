/**
 * Home Page Object
 *
 * Page object for the landing page.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class HomePage extends BasePage {
  // Locators
  readonly heroTitle: Locator
  readonly createButton: Locator
  readonly browseProductsLink: Locator
  readonly categoryCards: Locator
  readonly featuresList: Locator

  constructor(page: Page) {
    super(page)
    this.heroTitle = page.getByRole('heading', { level: 1 })
    this.createButton = page.getByTestId('hero-create-button')
    this.browseProductsLink = page.getByTestId('browse-products-link')
    this.categoryCards = page.getByTestId('category-card')
    this.featuresList = page.getByTestId('features-list')
  }

  get urlPattern(): RegExp {
    return /^\/$/
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.waitForLoad()
  }

  /**
   * Click the main CTA button to start creating
   */
  async clickCreateButton(): Promise<void> {
    await this.createButton.click()
  }

  /**
   * Alias for clickCreateButton
   */
  async clickCreate(): Promise<void> {
    await this.clickCreateButton()
  }

  /**
   * Navigate to products by category
   */
  async selectCategory(category: 'mugs' | 'apparel' | 'prints' | 'storybooks'): Promise<void> {
    await this.page.getByTestId(`category-${category}`).click()
  }

  /**
   * Get number of category cards displayed
   */
  async getCategoryCount(): Promise<number> {
    return this.categoryCards.count()
  }

  /**
   * Check if the hero section is visible
   */
  async isHeroVisible(): Promise<boolean> {
    return this.heroTitle.isVisible()
  }
}
