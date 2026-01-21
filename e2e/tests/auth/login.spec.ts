/**
 * Login Flow Tests
 *
 * E2E tests for user login functionality.
 */

import { test, expect } from '@playwright/test'
import { LoginPage, RegisterPage } from '../../page-objects'
import { testUser, generateTestUser } from '../../fixtures/test-data.fixture'

test.describe('User Login', () => {
  test('user can login with valid credentials', async ({ page }) => {
    // First register a user
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    await registerPage.goto()
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    })

    // Logout
    await page.getByTestId('user-menu').click()
    await page.getByTestId('logout-button').click()

    // Now login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login({
      email: userData.email,
      password: userData.password,
    })

    // Should be logged in and redirected to home
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('user-menu')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.login({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    })

    // Should show error message
    await expect(loginPage.formError).toBeVisible()
    const errorText = await loginPage.getFormErrorText()
    expect(errorText?.toLowerCase()).toContain('invalid')
  })

  test('shows error for incorrect password', async ({ page }) => {
    // First register a user
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    await registerPage.goto()
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    })

    // Logout
    await page.getByTestId('user-menu').click()
    await page.getByTestId('logout-button').click()

    // Try to login with wrong password
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login({
      email: userData.email,
      password: 'WrongPassword123!',
    })

    // Should show error
    await expect(loginPage.formError).toBeVisible()
  })

  test('shows validation error for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.submit()

    // Should show validation errors or form error
    const hasError =
      (await loginPage.emailError.isVisible()) ||
      (await loginPage.formError.isVisible())
    expect(hasError).toBe(true)
  })

  test('can navigate to register page', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.goToRegister()

    await expect(page).toHaveURL(/\/register/)
  })

  test('login preserves redirect parameter', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    // First register a user
    await registerPage.goto()
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    })

    // Logout
    await page.getByTestId('user-menu').click()
    await page.getByTestId('logout-button').click()

    // Go to login with redirect
    await loginPage.goto('/checkout')
    await loginPage.login({
      email: userData.email,
      password: userData.password,
    })

    // Should redirect to checkout
    await expect(page).toHaveURL(/\/checkout/)
  })

  test('login form is accessible by keyboard', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(loginPage.emailInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(loginPage.passwordInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(loginPage.submitButton).toBeFocused()

    // Can submit with Enter
    await loginPage.emailInput.focus()
    await loginPage.fillForm({
      email: 'test@example.com',
      password: 'password',
    })
    await page.keyboard.press('Enter')

    // Form should submit (will show error for invalid creds, but that's fine)
    await expect(loginPage.formError).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Logout', () => {
  test('user can logout', async ({ page }) => {
    // Register and login a user
    const registerPage = new RegisterPage(page)
    const userData = generateTestUser()

    await registerPage.goto()
    await registerPage.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    })

    // User should be logged in
    await expect(page.getByTestId('user-menu')).toBeVisible()

    // Logout
    await page.getByTestId('user-menu').click()
    await page.getByTestId('logout-button').click()

    // Should be redirected and logged out
    await expect(page.getByTestId('user-menu')).not.toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })
})
