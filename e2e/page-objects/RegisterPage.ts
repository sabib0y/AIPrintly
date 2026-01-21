/**
 * Register Page Object
 *
 * Page object for user registration.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { generateTestUser } from '../fixtures/test-data.fixture'

export class RegisterPage extends BasePage {
  // Form inputs
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator

  // Error messages
  readonly emailError: Locator
  readonly passwordError: Locator
  readonly confirmPasswordError: Locator
  readonly formError: Locator

  // Links
  readonly loginLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.confirmPasswordInput = page.getByTestId('confirm-password-input')
    this.submitButton = page.getByTestId('register-button')
    this.emailError = page.getByTestId('email-error')
    this.passwordError = page.getByTestId('password-error')
    this.confirmPasswordError = page.getByTestId('confirm-password-error')
    this.formError = page.getByTestId('form-error')
    this.loginLink = page.getByTestId('go-to-login-link')
  }

  get urlPattern(): RegExp {
    return /\/register/
  }

  async goto(): Promise<void> {
    await this.page.goto('/register')
    await this.waitForLoad()
  }

  /**
   * Fill the registration form
   */
  async fillForm(data: { email: string; password: string; confirmPassword?: string }): Promise<void> {
    await this.emailInput.fill(data.email)
    await this.passwordInput.fill(data.password)
    if (data.confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(data.confirmPassword)
    }
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /**
   * Register with form data
   */
  async register(data: { email: string; password: string; confirmPassword?: string }): Promise<void> {
    await this.fillForm(data)
    await this.submit()
  }

  /**
   * Register a new unique user
   */
  async registerNewUser(): Promise<{ email: string; password: string }> {
    const userData = generateTestUser()
    await this.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
    })
    return { email: userData.email, password: userData.password }
  }

  /**
   * Navigate to login page
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click()
  }

  /**
   * Check if there are validation errors
   */
  async hasEmailError(): Promise<boolean> {
    return this.emailError.isVisible()
  }

  async hasPasswordError(): Promise<boolean> {
    return this.passwordError.isVisible()
  }

  async hasFormError(): Promise<boolean> {
    return this.formError.isVisible()
  }

  /**
   * Get email error message
   */
  async getEmailErrorText(): Promise<string | null> {
    return this.emailError.textContent()
  }

  /**
   * Get password error message
   */
  async getPasswordErrorText(): Promise<string | null> {
    return this.passwordError.textContent()
  }
}
