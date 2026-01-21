/**
 * Test Data Fixtures
 *
 * Reusable test data generators and constants for E2E tests.
 */

import { faker } from '@faker-js/faker'

/**
 * Pre-seeded test user credentials
 */
export const testUser = {
  email: 'test@aiprintly.co.uk',
  password: 'TestPassword123!',
}

/**
 * Pre-seeded existing user for duplicate email tests
 */
export const existingUser = {
  email: 'existing@example.com',
  password: 'ExistingPass123!',
}

/**
 * Sample UK addresses for testing
 */
export const testAddress = {
  fullName: 'Test User',
  addressLine1: '123 Test Street',
  addressLine2: '',
  city: 'London',
  county: '',
  postcode: 'SW1A 1AA',
  country: 'GB',
}

/**
 * UK postcodes for random address generation
 */
const ukPostcodes = ['SW1A 1AA', 'EC1A 1BB', 'W1A 0AX', 'M1 1AE', 'B1 1AA', 'G1 1AA', 'EH1 1AA']

/**
 * Generate a unique test user with random email
 */
export function generateTestUser() {
  return {
    email: `test-${Date.now()}-${faker.string.alphanumeric(6).toLowerCase()}@example.com`,
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
  }
}

/**
 * Generate a random UK address
 */
export function generateTestAddress() {
  return {
    fullName: faker.person.fullName(),
    addressLine1: faker.location.streetAddress(),
    addressLine2: faker.datatype.boolean() ? faker.location.secondaryAddress() : '',
    city: faker.location.city(),
    county: faker.location.county(),
    postcode: faker.helpers.arrayElement(ukPostcodes),
    country: 'GB',
  }
}

/**
 * Stripe test card numbers
 */
export const stripeTestCards = {
  // Successful payment
  success: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
  },
  // Card declined
  declined: {
    number: '4000000000000002',
    expiry: '12/30',
    cvc: '123',
  },
  // Requires 3D Secure authentication
  requires3ds: {
    number: '4000002500003155',
    expiry: '12/30',
    cvc: '123',
  },
  // Insufficient funds
  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/30',
    cvc: '123',
  },
  // Expired card
  expired: {
    number: '4000000000000069',
    expiry: '12/30',
    cvc: '123',
  },
}

/**
 * AI generation prompts for testing
 */
export const testPrompts = {
  fantasy: 'A magical dragon flying over misty mountains at sunset',
  realistic: 'A professional photograph of a golden retriever in a park',
  cartoon: 'A cute cartoon cat wearing a tiny wizard hat',
  abstract: 'Abstract geometric shapes in vibrant neon colours',
  minimal: 'test', // Minimal prompt for edge case testing
}

/**
 * Storybook test data
 */
export const testStorybookData = {
  childName: 'Emma',
  childAge: 5,
  theme: 'adventure',
  interests: 'dragons, castles, magic',
}

/**
 * Product test data by category
 */
export const testProducts = {
  mug: {
    name: 'Custom Mug',
    variant: '11oz White',
    price: 1499, // pence
  },
  tshirt: {
    name: 'Classic T-Shirt',
    variant: 'Medium Black',
    price: 1999,
  },
  print: {
    name: 'Art Print',
    variant: 'A3 Unframed',
    price: 1499,
  },
  storybook: {
    name: 'Personalised Storybook',
    variant: 'Hardcover',
    price: 2499,
  },
}

/**
 * File paths for test assets
 */
export const testAssets = {
  highQuality: 'fixtures/test-image-2000x2000.jpg',
  mediumQuality: 'fixtures/test-image-1000x1000.jpg',
  lowQuality: 'fixtures/test-image-500x500.jpg',
  tooSmall: 'fixtures/test-image-300x300.jpg',
  largeFile: 'fixtures/large-image-30mb.jpg',
  invalidType: 'fixtures/document.pdf',
  customIllustration: 'fixtures/custom-illustration.jpg',
}
