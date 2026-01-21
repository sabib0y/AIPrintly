/**
 * Registration Flow Tests
 *
 * E2E tests for user registration functionality.
 */

import { test, expect } from '@playwright/test'
import { RegisterPage, LoginPage } from '../../page-objects'
import { generateTestUser, existingUser } from '../../fixtures/test-data.fixture'

test.describe('User Registration', () => {
  test('new user can register with email and password', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    await registerPage.goto()
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
    })

    // Should redirect to home after successful registration
    await expect(page).toHaveURL('/')

    // User should be logged in
    await expect(page.getByTestId('user-menu')).toBeVisible()
  })

  test('shows validation error for invalid email', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()
    await registerPage.fillForm({
      email: 'not-an-email',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    })
    await registerPage.submit()

    // Should show email error
    await expect(registerPage.emailError).toBeVisible()
  })

  test('shows validation error for weak password', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()
    await registerPage.fillForm({
      email: 'test@example.com',
      password: '123',
      confirmPassword: '123',
    })
    await registerPage.submit()

    // Should show password error
    await expect(registerPage.passwordError).toBeVisible()
    const errorText = await registerPage.getPasswordErrorText()
    expect(errorText?.toLowerCase()).toContain('8 characters')
  })

  test('shows validation error for password mismatch', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()
    await registerPage.fillForm({
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
    })
    await registerPage.submit()

    // Should show confirm password error
    await expect(registerPage.confirmPasswordError).toBeVisible()
  })

  test('can navigate to login page', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()
    await registerPage.goToLogin()

    await expect(page).toHaveURL(/\/login/)
  })

  test('registration form is accessible by keyboard', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(registerPage.emailInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(registerPage.passwordInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(registerPage.confirmPasswordInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(registerPage.submitButton).toBeFocused()
  })
})

test.describe('Registration with redirect', () => {
  test('redirects to original page after registration', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    // Try to access checkout without being logged in
    await page.goto('/checkout')

    // Should redirect to login/register
    await expect(page).toHaveURL(/\/(login|register)/)

    // Register
    await page.goto('/register?redirect=/checkout')
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
    })

    // Should redirect to checkout
    await expect(page).toHaveURL(/\/checkout/)
  })
})
