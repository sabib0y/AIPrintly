# E2E Testing Specification (Phase 1)

End-to-end testing strategy for AIPrintly MVP using Playwright.

---

## Overview

E2E tests validate complete user journeys through the application, ensuring all components work together correctly. These tests run against a real browser and interact with the application as a user would.

### Testing Philosophy

- **User-centric**: Tests simulate real user behaviour, not implementation details
- **Critical paths first**: Prioritise revenue-generating flows (checkout, orders)
- **Resilient selectors**: Use `data-testid` attributes, avoid brittle CSS selectors
- **Isolated**: Each test runs independently with clean state
- **Fast feedback**: Parallel execution, smart waiting, no arbitrary sleeps

---

## Test Infrastructure

### Technology Stack

| Tool | Purpose |
|------|---------|
| Playwright | Browser automation framework |
| @playwright/test | Test runner with assertions |
| playwright-test-coverage | Code coverage collection |
| @faker-js/faker | Test data generation |

### Directory Structure

```
e2e/
├── playwright.config.ts          # Playwright configuration
├── global-setup.ts               # Database seeding, auth setup
├── global-teardown.ts            # Cleanup after all tests
├── fixtures/
│   ├── auth.fixture.ts           # Authentication helpers
│   ├── database.fixture.ts       # Database seeding/cleanup
│   └── test-data.fixture.ts      # Test data generators
├── page-objects/
│   ├── BasePage.ts               # Common page methods
│   ├── HomePage.ts               # Landing page
│   ├── CreatePage.ts             # Creation hub
│   ├── UploadPage.ts             # Image upload
│   ├── GeneratePage.ts           # AI generation
│   ├── BuilderPage.ts            # Product builder
│   ├── StorybookBuilderPage.ts   # Storybook editor
│   ├── CartPage.ts               # Shopping cart
│   ├── CheckoutPage.ts           # Checkout flow
│   ├── OrderPage.ts              # Order tracking
│   ├── LoginPage.ts              # Login
│   └── RegisterPage.ts           # Registration
├── tests/
│   ├── critical/                 # P0 - Must pass for release
│   │   ├── upload-to-checkout.spec.ts
│   │   ├── generate-to-checkout.spec.ts
│   │   ├── storybook-to-checkout.spec.ts
│   │   └── payment-flow.spec.ts
│   ├── auth/                     # Authentication flows
│   │   ├── registration.spec.ts
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   └── session-migration.spec.ts
│   ├── asset-pipeline/           # Workstream A flows
│   │   ├── image-upload.spec.ts
│   │   ├── ai-generation.spec.ts
│   │   ├── story-generation.spec.ts
│   │   └── credits.spec.ts
│   ├── builder/                  # Workstream B flows
│   │   ├── mug-builder.spec.ts
│   │   ├── apparel-builder.spec.ts
│   │   ├── print-builder.spec.ts
│   │   ├── storybook-builder.spec.ts
│   │   └── quality-warnings.spec.ts
│   ├── commerce/                 # Workstream C flows
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── order-tracking.spec.ts
│   ├── mobile/                   # Mobile-specific tests
│   │   ├── responsive.spec.ts
│   │   ├── touch-gestures.spec.ts
│   │   └── mobile-checkout.spec.ts
│   └── accessibility/            # A11y tests
│       ├── keyboard-navigation.spec.ts
│       └── screen-reader.spec.ts
└── utils/
    ├── api-helpers.ts            # Direct API calls for setup
    ├── stripe-helpers.ts         # Stripe test mode helpers
    ├── wait-helpers.ts           # Custom wait utilities
    └── screenshot-helpers.ts     # Visual comparison helpers
```

### Configuration

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Critical User Journeys (P0)

These tests MUST pass before any release. They cover the primary revenue-generating flows.

### Journey 1: Upload → Build → Cart → Checkout → Order

**File**: `e2e/tests/critical/upload-to-checkout.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { UploadPage } from '../../page-objects/UploadPage';
import { BuilderPage } from '../../page-objects/BuilderPage';
import { CartPage } from '../../page-objects/CartPage';
import { CheckoutPage } from '../../page-objects/CheckoutPage';

test.describe('Upload to Checkout Flow', () => {
  test('guest user completes purchase with uploaded image', async ({ page }) => {
    // 1. Upload image
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/test-image-2000x2000.jpg');
    await uploadPage.waitForUploadComplete();
    await expect(uploadPage.qualityIndicator).toContainText('Great quality');
    await uploadPage.clickContinue();

    // 2. Select product and customise
    const builderPage = new BuilderPage(page);
    await builderPage.selectProduct('mug');
    await builderPage.selectColour('white');
    await builderPage.adjustImagePosition({ x: 0.5, y: 0.5, scale: 1.2 });
    await builderPage.waitForMockupGenerated();
    await expect(builderPage.priceDisplay).toContainText('£14.99');
    await builderPage.addToCart();

    // 3. View cart
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.itemCount).toBe(1);
    await expect(cartPage.totalPrice).toContainText('£18.98'); // incl shipping
    await cartPage.proceedToCheckout();

    // 4. Register (required for checkout)
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.registerNewAccount({
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
    });

    // 5. Complete Stripe checkout
    await checkoutPage.fillShippingAddress({
      name: 'Test User',
      address: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
    });
    await checkoutPage.proceedToPayment();

    // Stripe test mode card
    await checkoutPage.completeStripePayment({
      cardNumber: '4242424242424242',
      expiry: '12/30',
      cvc: '123',
    });

    // 6. Verify success
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByTestId('order-number')).toBeVisible();
    await expect(page.getByText('Thank you')).toBeVisible();
  });

  test('handles low quality image with warning', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/test-image-500x500.jpg');
    await uploadPage.waitForUploadComplete();
    await expect(uploadPage.qualityIndicator).toContainText('Low resolution');
    await uploadPage.clickContinue();

    const builderPage = new BuilderPage(page);
    await builderPage.selectProduct('mug');
    await expect(builderPage.qualityWarning).toBeVisible();
    await builderPage.addToCart();

    // Should show confirmation dialog
    await expect(builderPage.qualityConfirmDialog).toBeVisible();
    await builderPage.confirmQualityWarning();

    // Verify warning stored with cart item
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.getItemWarning(0)).toContainText('quality');
  });
});
```

### Journey 2: AI Generate → Build → Cart → Checkout → Order

**File**: `e2e/tests/critical/generate-to-checkout.spec.ts`

```typescript
test.describe('AI Generation to Checkout Flow', () => {
  test('user generates image and completes purchase', async ({ page }) => {
    // 1. Generate AI image
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await generatePage.selectStyle('fantasy');
    await generatePage.enterPrompt('A magical dragon flying over mountains');
    await generatePage.clickGenerate();

    // Wait for generation (may take 15-30s)
    await generatePage.waitForResults({ timeout: 60000 });
    await expect(generatePage.resultImages).toHaveCount(4);
    await generatePage.selectResult(0);

    // 2. Build product
    const builderPage = new BuilderPage(page);
    await builderPage.selectProduct('print');
    await builderPage.selectSize('A3');
    await builderPage.selectFrame('black');
    await builderPage.addToCart();

    // 3. Checkout flow
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // ... continue with checkout
  });

  test('handles generation failure gracefully', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await generatePage.selectStyle('realistic');
    await generatePage.enterPrompt('test'); // Minimal prompt

    // Simulate API failure via mock
    await page.route('**/api/generate/image', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Generation failed' }) });
    });

    await generatePage.clickGenerate();
    await expect(generatePage.errorMessage).toContainText('Generation failed');
    await expect(generatePage.retryButton).toBeVisible();
  });

  test('credits deducted on generation', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    const initialCredits = await generatePage.getCreditBalance();
    await generatePage.selectStyle('cartoon');
    await generatePage.enterPrompt('A cute cat wearing a hat');
    await generatePage.clickGenerate();
    await generatePage.waitForResults({ timeout: 60000 });

    const finalCredits = await generatePage.getCreditBalance();
    expect(finalCredits).toBe(initialCredits - 1);
  });

  test('blocks generation when out of credits', async ({ page, request }) => {
    // Set credits to 0 via API
    await request.post('/api/test/set-credits', { data: { credits: 0 } });

    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    await expect(generatePage.outOfCreditsGate).toBeVisible();
    await expect(generatePage.generateButton).toBeDisabled();
  });
});
```

### Journey 3: Story → Illustrations → Storybook → Checkout

**File**: `e2e/tests/critical/storybook-to-checkout.spec.ts`

```typescript
test.describe('Storybook Creation Flow', () => {
  test('user creates personalised storybook and purchases', async ({ page }) => {
    // 1. Generate story
    const storyPage = new StoryGeneratePage(page);
    await storyPage.goto();
    await storyPage.fillStoryForm({
      childName: 'Emma',
      childAge: 5,
      theme: 'adventure',
      interests: 'dragons, castles',
    });
    await storyPage.generateStory();
    await storyPage.waitForStoryGenerated({ timeout: 60000 });

    // Verify story structure
    await expect(storyPage.pageCount).toBeGreaterThanOrEqual(8);
    await expect(storyPage.storyTitle).toContainText('Emma');

    // 2. Generate illustrations
    await storyPage.continueToIllustrations();
    await storyPage.waitForIllustrationsGenerated({ timeout: 300000 }); // 5 mins for all pages

    // 3. Edit storybook
    const storybookBuilder = new StorybookBuilderPage(page);
    await storybookBuilder.selectPage(2);
    await storybookBuilder.editText('Once upon a time, Emma found a magical key...');
    await storybookBuilder.saveChanges();

    // 4. Configure book options
    await storybookBuilder.selectCoverType('hardcover');
    await storybookBuilder.previewBook();
    await storybookBuilder.addToCart();

    // 5. Complete purchase
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.getItemName(0)).toContainText('Storybook');
    await cartPage.proceedToCheckout();

    // ... continue with checkout
  });

  test('user can edit individual pages', async ({ page }) => {
    // Setup: create storybook project
    const projectId = await createTestStorybookProject(page);

    const storybookBuilder = new StorybookBuilderPage(page);
    await storybookBuilder.goto(projectId);

    // Edit text on page 3
    await storybookBuilder.selectPage(3);
    await storybookBuilder.editText('Custom text for this page');
    await storybookBuilder.saveChanges();

    // Replace illustration
    await storybookBuilder.replaceIllustration({
      method: 'upload',
      file: 'fixtures/custom-illustration.jpg',
    });
    await storybookBuilder.waitForIllustrationUpdated();

    // Verify changes persisted
    await page.reload();
    await storybookBuilder.selectPage(3);
    await expect(storybookBuilder.pageText).toContainText('Custom text');
  });
});
```

### Journey 4: Payment Scenarios

**File**: `e2e/tests/critical/payment-flow.spec.ts`

```typescript
test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Add item to cart via API for faster setup
    await addTestItemToCart(page);
  });

  test('successful payment creates order', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.loginExistingAccount();
    await checkoutPage.fillShippingAddress(testAddress);
    await checkoutPage.proceedToPayment();

    await checkoutPage.completeStripePayment({
      cardNumber: '4242424242424242', // Successful payment
      expiry: '12/30',
      cvc: '123',
    });

    await expect(page).toHaveURL(/\/checkout\/success/);
    const orderNumber = await page.getByTestId('order-number').textContent();
    expect(orderNumber).toMatch(/AIP-\d{4}-\d{4}/);
  });

  test('declined card shows error', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.loginExistingAccount();
    await checkoutPage.fillShippingAddress(testAddress);
    await checkoutPage.proceedToPayment();

    await checkoutPage.completeStripePayment({
      cardNumber: '4000000000000002', // Declined card
      expiry: '12/30',
      cvc: '123',
    });

    await expect(checkoutPage.paymentError).toContainText('declined');
    await expect(page).not.toHaveURL(/\/checkout\/success/);
  });

  test('cancelled checkout returns to cart', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.loginExistingAccount();
    await checkoutPage.fillShippingAddress(testAddress);
    await checkoutPage.proceedToPayment();

    // Cancel on Stripe page
    await checkoutPage.cancelStripePayment();

    await expect(page).toHaveURL(/\/checkout\/cancelled/);
    await expect(page.getByText('Payment cancelled')).toBeVisible();

    // Cart should still have items
    await cartPage.goto();
    await expect(cartPage.itemCount).toBeGreaterThan(0);
  });

  test('3D Secure authentication flow', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.loginExistingAccount();
    await checkoutPage.fillShippingAddress(testAddress);
    await checkoutPage.proceedToPayment();

    await checkoutPage.completeStripePayment({
      cardNumber: '4000002500003155', // 3DS required
      expiry: '12/30',
      cvc: '123',
    });

    // Handle 3DS modal
    await checkoutPage.complete3DSAuthentication();

    await expect(page).toHaveURL(/\/checkout\/success/);
  });
});
```

---

## Authentication Tests (P1)

**File**: `e2e/tests/auth/`

### Registration Flow

```typescript
test.describe('User Registration', () => {
  test('new user can register with email/password', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillForm({
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    await registerPage.submit();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('shows validation errors for weak password', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillForm({
      email: 'test@example.com',
      password: '123',
      confirmPassword: '123',
    });
    await registerPage.submit();

    await expect(registerPage.passwordError).toContainText('at least 8 characters');
  });

  test('prevents duplicate email registration', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillForm({
      email: 'existing@example.com', // Seeded user
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    await registerPage.submit();

    await expect(registerPage.emailError).toContainText('already registered');
  });
});
```

### Session Migration

```typescript
test.describe('Session Migration', () => {
  test('guest cart persists after registration', async ({ page }) => {
    // Add items as guest
    const builderPage = new BuilderPage(page);
    await builderPage.goto('mug');
    await builderPage.quickAddToCart();

    const cartPage = new CartPage(page);
    await cartPage.goto();
    const guestItemCount = await cartPage.getItemCount();
    expect(guestItemCount).toBe(1);

    // Register
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.registerNewUser();

    // Cart should persist
    await cartPage.goto();
    const userItemCount = await cartPage.getItemCount();
    expect(userItemCount).toBe(guestItemCount);
  });

  test('guest credits transfer on registration', async ({ page }) => {
    // Use a credit as guest
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    const guestCredits = await generatePage.getCreditBalance();
    expect(guestCredits).toBe(3); // Guest default

    await generatePage.generateImage('test prompt');
    await generatePage.waitForResults({ timeout: 60000 });

    const remainingCredits = await generatePage.getCreditBalance();
    expect(remainingCredits).toBe(2);

    // Register
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.registerNewUser();

    // Credits should be: guest remaining (2) + new user bonus (10) = 12
    await generatePage.goto();
    const userCredits = await generatePage.getCreditBalance();
    expect(userCredits).toBe(12);
  });

  test('guest assets transfer on registration', async ({ page }) => {
    // Upload as guest
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/test-image.jpg');
    await uploadPage.waitForUploadComplete();

    // Register
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.registerNewUser();

    // Asset should be accessible
    // Verify by going to builder with asset
    await expect(page.getByTestId('recent-assets')).toContainText('1 asset');
  });
});
```

---

## Asset Pipeline Tests (P1)

**File**: `e2e/tests/asset-pipeline/`

### Image Upload

```typescript
test.describe('Image Upload', () => {
  test('accepts valid image formats', async ({ page }) => {
    const uploadPage = new UploadPage(page);

    for (const format of ['jpg', 'png', 'webp']) {
      await uploadPage.goto();
      await uploadPage.uploadImage(`fixtures/test-image.${format}`);
      await uploadPage.waitForUploadComplete();
      await expect(uploadPage.successIndicator).toBeVisible();
    }
  });

  test('rejects invalid file types', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/document.pdf');

    await expect(uploadPage.errorMessage).toContainText('Invalid file type');
  });

  test('rejects files over 25MB', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/large-image-30mb.jpg');

    await expect(uploadPage.errorMessage).toContainText('File too large');
  });

  test('drag and drop upload works', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.dragAndDropImage('fixtures/test-image.jpg');
    await uploadPage.waitForUploadComplete();
    await expect(uploadPage.successIndicator).toBeVisible();
  });

  test('shows quality assessment after upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // High quality image
    await uploadPage.uploadImage('fixtures/test-image-4000x4000.jpg');
    await uploadPage.waitForUploadComplete();
    await expect(uploadPage.qualityIndicator).toContainText('Excellent');

    // Low quality image
    await uploadPage.goto();
    await uploadPage.uploadImage('fixtures/test-image-300x300.jpg');
    await uploadPage.waitForUploadComplete();
    await expect(uploadPage.qualityIndicator).toContainText('Low resolution');
  });
});
```

### Credits System

```typescript
test.describe('Credits System', () => {
  test('guest user starts with 3 credits', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    await expect(generatePage.creditBalance).toHaveText('3');
  });

  test('registered user starts with 10 credits', async ({ page }) => {
    await loginAsNewUser(page);

    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    await expect(generatePage.creditBalance).toHaveText('10');
  });

  test('credit deducted after successful generation', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    const before = await generatePage.getCreditBalance();
    await generatePage.generateImage('A test image');
    await generatePage.waitForResults({ timeout: 60000 });
    const after = await generatePage.getCreditBalance();

    expect(after).toBe(before - 1);
  });

  test('credit refunded on generation failure', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/generate/image', async (route) => {
      // First call: return job ID
      if (!route.request().url().includes('jobId')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ jobId: 'test-job' }),
        });
      } else {
        // Status poll: return failed
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ status: 'FAILED' }),
        });
      }
    });

    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    const before = await generatePage.getCreditBalance();
    await generatePage.generateImage('A test image');
    await generatePage.waitForError();
    const after = await generatePage.getCreditBalance();

    expect(after).toBe(before); // Refunded
  });
});
```

---

## Product Builder Tests (P1)

**File**: `e2e/tests/builder/`

### Canvas Interactions

```typescript
test.describe('Product Builder Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await uploadTestAsset(page);
  });

  test('image can be dragged within print area', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    const initialPosition = await builder.getImagePosition();
    await builder.dragImage({ deltaX: 50, deltaY: 30 });
    const newPosition = await builder.getImagePosition();

    expect(newPosition.x).toBeCloseTo(initialPosition.x + 50, 1);
    expect(newPosition.y).toBeCloseTo(initialPosition.y + 30, 1);
  });

  test('image can be scaled with controls', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    const initialScale = await builder.getImageScale();
    await builder.clickZoomIn();
    await builder.clickZoomIn();
    const newScale = await builder.getImageScale();

    expect(newScale).toBeGreaterThan(initialScale);
  });

  test('image can be rotated', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto('print');

    await builder.rotateImage(45);
    const rotation = await builder.getImageRotation();

    expect(rotation).toBeCloseTo(45, 1);
  });

  test('reset button restores default position', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    // Make changes
    await builder.dragImage({ deltaX: 100, deltaY: 100 });
    await builder.clickZoomIn();
    await builder.rotateImage(30);

    // Reset
    await builder.clickReset();

    const position = await builder.getImagePosition();
    const scale = await builder.getImageScale();
    const rotation = await builder.getImageRotation();

    expect(position.x).toBe(0.5);
    expect(position.y).toBe(0.5);
    expect(scale).toBe(1);
    expect(rotation).toBe(0);
  });

  test('print area boundary is enforced', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    // Try to drag image way outside
    await builder.dragImage({ deltaX: 500, deltaY: 500 });

    const position = await builder.getImagePosition();
    // Should be constrained
    expect(position.x).toBeLessThanOrEqual(1);
    expect(position.y).toBeLessThanOrEqual(1);
  });
});
```

### Mobile Touch Gestures

```typescript
test.describe('Mobile Builder Interactions', () => {
  test.use({ ...devices['iPhone 13'] });

  test('pinch to zoom works on mobile', async ({ page }) => {
    await uploadTestAsset(page);
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    const initialScale = await builder.getImageScale();
    await builder.pinchZoom(1.5);
    const newScale = await builder.getImageScale();

    expect(newScale).toBeGreaterThan(initialScale);
  });

  test('two-finger rotate works on mobile', async ({ page }) => {
    await uploadTestAsset(page);
    const builder = new BuilderPage(page);
    await builder.goto('print');

    await builder.twoFingerRotate(45);
    const rotation = await builder.getImageRotation();

    expect(rotation).toBeCloseTo(45, 5);
  });
});
```

---

## Commerce Tests (P1)

**File**: `e2e/tests/commerce/`

### Cart Operations

```typescript
test.describe('Shopping Cart', () => {
  test('add item to cart updates count', async ({ page }) => {
    await uploadTestAsset(page);
    const builder = new BuilderPage(page);
    await builder.goto('mug');
    await builder.addToCart();

    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('can update item quantity', async ({ page }) => {
    await addTestItemToCart(page);

    const cartPage = new CartPage(page);
    await cartPage.goto();

    await cartPage.setQuantity(0, 3);
    await expect(cartPage.getItemQuantity(0)).toBe(3);

    // Price should update
    const itemPrice = await cartPage.getItemPrice(0);
    const totalPrice = await cartPage.getSubtotal();
    expect(totalPrice).toBe(itemPrice * 3);
  });

  test('can remove item from cart', async ({ page }) => {
    await addTestItemToCart(page);

    const cartPage = new CartPage(page);
    await cartPage.goto();

    await cartPage.removeItem(0);
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test('cart persists across page navigation', async ({ page }) => {
    await addTestItemToCart(page);

    // Navigate away
    await page.goto('/');
    await page.goto('/products');

    // Cart should still have item
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.itemCount).toBe(1);
  });

  test('cart displays quality warnings', async ({ page }) => {
    // Add item with quality warning
    await uploadLowQualityAsset(page);
    const builder = new BuilderPage(page);
    await builder.goto('print');
    await builder.selectSize('A1'); // Large print with low quality image
    await builder.addToCart();
    await builder.confirmQualityWarning();

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.getItemWarning(0)).toBeVisible();
  });
});
```

### Checkout Flow

```typescript
test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await addTestItemToCart(page);
  });

  test('guest must register before checkout', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/\/register|\/login/);
  });

  test('logged in user can proceed to checkout', async ({ page }) => {
    await loginAsTestUser(page);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/\/checkout/);
  });

  test('shipping address is validated', async ({ page }) => {
    await loginAsTestUser(page);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);

    // Submit empty form
    await checkoutPage.proceedToPayment();
    await expect(checkoutPage.nameError).toBeVisible();
    await expect(checkoutPage.addressError).toBeVisible();
    await expect(checkoutPage.postcodeError).toBeVisible();
  });

  test('only UK addresses accepted', async ({ page }) => {
    await loginAsTestUser(page);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillShippingAddress({
      name: 'Test User',
      address: '123 Test Street',
      city: 'New York',
      postcode: '10001',
      country: 'US',
    });

    await expect(checkoutPage.countryError).toContainText('UK only');
  });
});
```

---

## Accessibility Tests (P2)

**File**: `e2e/tests/accessibility/`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no critical a11y violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('product builder is keyboard navigable', async ({ page }) => {
    await uploadTestAsset(page);
    const builder = new BuilderPage(page);
    await builder.goto('mug');

    // Tab through controls
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('zoom-in-button')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('zoom-out-button')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('rotate-button')).toBeFocused();

    // Activate with Enter
    await page.keyboard.press('Enter');
    // Rotation should change
  });

  test('form errors are announced to screen readers', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submit();

    // Error should have appropriate ARIA attributes
    const errorElement = page.getByTestId('email-error');
    await expect(errorElement).toHaveAttribute('role', 'alert');
    await expect(errorElement).toHaveAttribute('aria-live', 'polite');
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/products');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toBe('');
    }
  });

  test('colour contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();

    const contrastViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toHaveLength(0);
  });
});
```

---

## Test Data Management

### Fixtures

```typescript
// e2e/fixtures/test-data.fixture.ts
import { faker } from '@faker-js/faker';

export const testUser = {
  email: 'test@aiprintly.co.uk',
  password: 'TestPassword123!',
};

export const testAddress = {
  name: faker.person.fullName(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  postcode: 'SW1A 1AA',
  country: 'GB',
};

export function generateTestUser() {
  return {
    email: `test-${Date.now()}-${faker.string.alphanumeric(6)}@example.com`,
    password: 'SecurePass123!',
  };
}

export function generateTestAddress() {
  const postcodes = ['SW1A 1AA', 'EC1A 1BB', 'W1A 0AX', 'M1 1AE', 'B1 1AA'];
  return {
    name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postcode: faker.helpers.arrayElement(postcodes),
    country: 'GB',
  };
}
```

### Database Seeding

```typescript
// e2e/global-setup.ts
import { prisma } from '../app/services/prisma.server';
import bcrypt from 'bcryptjs';

export default async function globalSetup() {
  console.log('🌱 Seeding test database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'test@aiprintly.co.uk' },
    update: {},
    create: {
      email: 'test@aiprintly.co.uk',
      passwordHash: hashedPassword,
      credits: {
        create: { balance: 10 },
      },
    },
  });

  // Create existing user for duplicate email test
  await prisma.user.upsert({
    where: { email: 'existing@example.com' },
    update: {},
    create: {
      email: 'existing@example.com',
      passwordHash: hashedPassword,
    },
  });

  // Seed products if needed
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    console.log('Seeding products...');
    // Run seed script
    await import('../scripts/seed-products');
  }

  console.log('✅ Test database seeded');
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: aiprintly_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: Setup database
        run: |
          npm run db:push
          npm run db:seed
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/aiprintly_test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/aiprintly_test
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: screenshots
          path: test-results/
          retention-days: 7
```

---

## Test Execution Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/critical/upload-to-checkout.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome

# Run only critical tests
npm run test:e2e -- --grep @critical

# Debug mode (step through)
npm run test:e2e -- --debug

# Update snapshots
npm run test:e2e -- --update-snapshots

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:critical": "playwright test --grep @critical",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Test Counts by Category

| Category | Test Count | Priority |
|----------|------------|----------|
| Critical User Journeys | 15 | P0 |
| Authentication | 12 | P1 |
| Asset Pipeline | 15 | P1 |
| Product Builder | 18 | P1 |
| Commerce | 15 | P1 |
| Mobile | 8 | P2 |
| Accessibility | 10 | P2 |
| **Total** | **93** | — |

---

## Exit Criteria

Before Phase 1 release:

- [ ] All P0 (Critical) tests pass on Chromium, Firefox, WebKit
- [ ] All P0 tests pass on mobile viewports
- [ ] All P1 tests pass on Chromium
- [ ] No critical accessibility violations
- [ ] Test execution time < 15 minutes
- [ ] Flaky test rate < 2%

---

*Last updated: 2026-01-20*
