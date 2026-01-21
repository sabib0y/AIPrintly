/**
 * Login Page Object
 *
 * Page object for user login.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { testUser } from '../fixtures/test-data.fixture'

export class LoginPage extends BasePage {
  // Form inputs
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  // Error messages
  readonly emailError: Locator
  readonly passwordError: Locator
  readonly formError: Locator

  // Links
  readonly registerLink: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.submitButton = page.getByTestId('login-button')
    this.emailError = page.getByTestId('email-error')
    this.passwordError = page.getByTestId('password-error')
    this.formError = page.getByTestId('form-error')
    this.registerLink = page.getByTestId('go-to-register-link')
    this.forgotPasswordLink = page.getByTestId('forgot-password-link')
  }

  get urlPattern(): RegExp {
    return /\/login/
  }

  async goto(redirect?: string): Promise<void> {
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Fill the login form
   */
  async fillForm(data: { email: string; password: string }): Promise<void> {
    await this.emailInput.fill(data.email)
    await this.passwordInput.fill(data.password)
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /**
   * Login with credentials
   */
  async login(data: { email: string; password: string }): Promise<void> {
    await this.fillForm(data)
    await this.submit()
  }

  /**
   * Login with default test user
   */
  async loginAsTestUser(): Promise<void> {
    await this.login(testUser)
  }

  /**
   * Navigate to register page
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click()
  }

  /**
   * Check if there are validation errors
   */
  async hasFormError(): Promise<boolean> {
    return this.formError.isVisible()
  }

  /**
   * Get form error message
   */
  async getFormErrorText(): Promise<string | null> {
    return this.formError.textContent()
  }
}
