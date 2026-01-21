/**
 * Checkout Page Object
 *
 * Page object for the checkout flow including Stripe integration.
 */

import type { Page, Locator, FrameLocator } from '@playwright/test'
import { BasePage } from './BasePage'
import type { generateTestAddress } from '../fixtures/test-data.fixture'

type AddressData = ReturnType<typeof generateTestAddress>

export class CheckoutPage extends BasePage {
  // Shipping form
  readonly fullNameInput: Locator
  readonly addressLine1Input: Locator
  readonly addressLine2Input: Locator
  readonly cityInput: Locator
  readonly countyInput: Locator
  readonly postcodeInput: Locator
  readonly countrySelect: Locator

  // Form errors
  readonly nameError: Locator
  readonly addressError: Locator
  readonly cityError: Locator
  readonly postcodeError: Locator
  readonly countryError: Locator

  // Order summary
  readonly orderSummary: Locator
  readonly orderTotal: Locator

  // Actions
  readonly proceedToPaymentButton: Locator
  readonly backToCartButton: Locator

  // Stripe elements
  readonly stripeFrame: FrameLocator
  readonly paymentError: Locator

  constructor(page: Page) {
    super(page)
    // Shipping form
    this.fullNameInput = page.getByTestId('shipping-name')
    this.addressLine1Input = page.getByTestId('shipping-address1')
    this.addressLine2Input = page.getByTestId('shipping-address2')
    this.cityInput = page.getByTestId('shipping-city')
    this.countyInput = page.getByTestId('shipping-county')
    this.postcodeInput = page.getByTestId('shipping-postcode')
    this.countrySelect = page.getByTestId('shipping-country')

    // Form errors
    this.nameError = page.getByTestId('name-error')
    this.addressError = page.getByTestId('address-error')
    this.cityError = page.getByTestId('city-error')
    this.postcodeError = page.getByTestId('postcode-error')
    this.countryError = page.getByTestId('country-error')

    // Order summary
    this.orderSummary = page.getByTestId('order-summary')
    this.orderTotal = page.getByTestId('order-total')

    // Actions
    this.proceedToPaymentButton = page.getByTestId('proceed-to-payment')
    this.backToCartButton = page.getByTestId('back-to-cart')

    // Stripe
    this.stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]')
    this.paymentError = page.getByTestId('payment-error')
  }

  get urlPattern(): RegExp {
    return /\/checkout/
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout')
    await this.waitForLoad()
  }

  /**
   * Fill shipping address form
   */
  async fillShippingAddress(address: Partial<AddressData>): Promise<void> {
    if (address.fullName) await this.fullNameInput.fill(address.fullName)
    if (address.addressLine1) await this.addressLine1Input.fill(address.addressLine1)
    if (address.addressLine2) await this.addressLine2Input.fill(address.addressLine2)
    if (address.city) await this.cityInput.fill(address.city)
    if (address.county) await this.countyInput.fill(address.county)
    if (address.postcode) await this.postcodeInput.fill(address.postcode)
    if (address.country) {
      await this.countrySelect.click()
      await this.page.getByTestId(`country-${address.country}`).click()
    }
  }

  /**
   * Proceed to payment (redirects to Stripe)
   */
  async proceedToPayment(): Promise<void> {
    await this.proceedToPaymentButton.click()
  }

  /**
   * Alias for completeStripePayment with alternative property names
   */
  async fillPayment(card: {
    number?: string
    cardNumber?: string
    expiry: string
    cvc: string
  }): Promise<void> {
    await this.completeStripePayment({
      cardNumber: card.cardNumber || card.number || '',
      expiry: card.expiry,
      cvc: card.cvc,
    })
  }

  /**
   * Complete Stripe checkout with test card
   */
  async completeStripePayment(card: {
    cardNumber: string
    expiry: string
    cvc: string
  }): Promise<void> {
    // Wait for Stripe Checkout to load
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 })

    // Fill card details in Stripe's form
    const cardFrame = this.page.frameLocator('iframe[name*="__stripe"]').first()

    // Card number
    await this.page.locator('[data-testid="card-number"]').fill(card.cardNumber)
    await this.page.locator('[data-testid="card-expiry"]').fill(card.expiry)
    await this.page.locator('[data-testid="card-cvc"]').fill(card.cvc)

    // Alternative: Use Stripe's hosted checkout fields
    const cardNumberInput = this.page.locator('#cardNumber, [name="cardnumber"], [placeholder*="card number" i]')
    if (await cardNumberInput.isVisible()) {
      await cardNumberInput.fill(card.cardNumber)
      await this.page.locator('#cardExpiry, [name="exp-date"], [placeholder*="MM / YY" i]').fill(card.expiry)
      await this.page.locator('#cardCvc, [name="cvc"], [placeholder*="CVC" i]').fill(card.cvc)
    }

    // Submit payment
    await this.page.locator('button[type="submit"], [data-testid="submit-button"]').click()
  }

  /**
   * Cancel Stripe payment and return to site
   */
  async cancelStripePayment(): Promise<void> {
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 })
    // Click back/cancel link on Stripe page
    await this.page.locator('a[href*="cancel"], button:has-text("Cancel"), [aria-label="Close"]').first().click()
  }

  /**
   * Complete 3D Secure authentication
   */
  async complete3DSAuthentication(): Promise<void> {
    // Wait for 3DS frame
    const frame = this.page.frameLocator('iframe[name*="stripe-challenge"]')
    // Click "Complete" or "Authenticate" button in test mode
    await frame.locator('button:has-text("Complete"), button:has-text("Authenticate")').click()
  }

  /**
   * Register new account during checkout
   */
  async registerNewAccount(data: { email: string; password: string }): Promise<void> {
    await this.page.getByTestId('register-email').fill(data.email)
    await this.page.getByTestId('register-password').fill(data.password)
    await this.page.getByTestId('register-submit').click()
  }

  /**
   * Login existing account during checkout
   */
  async loginExistingAccount(): Promise<void> {
    await this.page.getByTestId('login-link').click()
    // Login form should appear
    await this.page.getByTestId('email-input').fill('test@aiprintly.co.uk')
    await this.page.getByTestId('password-input').fill('TestPassword123!')
    await this.page.getByTestId('login-button').click()
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<number> {
    const text = await this.orderTotal.textContent()
    const match = text?.match(/£(\d+)\.(\d{2})/)
    if (match) {
      return parseInt(match[1], 10) * 100 + parseInt(match[2], 10)
    }
    return 0
  }

  /**
   * Check for payment error
   */
  async hasPaymentError(): Promise<boolean> {
    return this.paymentError.isVisible()
  }

  /**
   * Get payment error text
   */
  async getPaymentErrorText(): Promise<string | null> {
    return this.paymentError.textContent()
  }
}
