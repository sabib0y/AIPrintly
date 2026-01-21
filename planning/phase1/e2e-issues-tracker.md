# E2E Test Issues Tracker

Issues identified during E2E test implementation that need fixing before full test suite passes.

---

## Priority: High (Blocking Critical Path Tests)

### 1. Checkout Not Requiring Authentication — FIXED ✅
**File:** `app/routes/checkout.tsx`
**Symptom:** Test navigates to `/checkout` expecting redirect to `/login`, but stays at checkout
**Root Cause:** Checkout page had `GuestGate` component allowing guest checkout, contrary to spec
**Fixed:**
- Added authentication requirement in checkout loader (redirects to `/login?redirectTo=/checkout`)
- Removed `GuestGate` component usage (spec requires account at checkout)
- Simplified checkout to 2-step flow: Shipping → Payment
- Added checkout route to `app/routes.ts` (was missing)

### 1b. Auth Session After Registration (Remaining)
**Files:** `e2e/tests/auth/login.spec.ts`, `e2e/tests/auth/registration.spec.ts`
**Symptom:** After registration, `user-menu` not visible — session may not be detected properly
**Status:** Needs investigation during Wave III (may be test timing or root loader issue)

### 2. Page Object Methods Don't Match Implementation — FIXED ✅
**Files:** `e2e/page-objects/*.ts`
**Issues (all resolved):**
- ~~`HomePage.clickCreate()` — method doesn't exist~~ → Added alias
- ~~`BuilderPage.designElement` — property doesn't exist~~ → Added alias to imageLayer
- ~~`UploadPage.uploadSuccess` / `uploadError` — properties don't exist~~ → Added aliases
- ~~`CheckoutPage.fillPayment()` expects `{ cardNumber }` but tests pass `{ number }`~~ → Added flexible `fillPayment()` method

### 3. Form Validation Timing
**File:** `e2e/tests/auth/login.spec.ts:84`
**Symptom:** Test submits empty form expecting `form-error` but HTML5 validation prevents submission
**Fix Options:**
1. Add `noValidate` prop to forms in test environment
2. Test client-side validation separately from server-side
3. Fill fields with invalid data instead of empty

---

## Priority: Medium (Non-Critical Path)

### 4. Keyboard Navigation Test Timing
**File:** `e2e/tests/auth/login.spec.ts:134`
**Symptom:** Keyboard submission doesn't trigger form error in expected timeframe
**Fix Required:** Add explicit waits or use different assertion strategy

### 5. Stripe Test Card Property Mismatch — FIXED ✅
**File:** `e2e/tests/commerce/checkout.spec.ts`
**Issue:** ~~`stripeTestCards` fixture uses `number` but `CheckoutPage.fillPayment()` expects `cardNumber`~~
**Fixed:** Added flexible `fillPayment()` method that accepts either `number` or `cardNumber`

---

## Priority: Low (Polish)

### 6. TypeScript Errors in Test Files — FIXED ✅
**Files:** Multiple in `e2e/tests/`
**Issues:** ~~Various type mismatches between fixtures, page objects, and test code~~
**Fixed:** All TypeScript errors resolved via page object updates

### 7. Missing Test Database Seeding
**Issue:** Auth tests create users on the fly, which may cause conflicts or slow tests
**Fix:** Create proper test database seeding in `globalSetup.ts`

---

## Test ID Coverage (Complete ✅)

All necessary `data-testid` attributes have been added:

| Component | Test IDs |
|-----------|----------|
| Login Page | `email-input`, `password-input`, `login-button`, `form-error`, `email-error`, `password-error`, `forgot-password-link`, `go-to-register-link` |
| Register Page | `email-input`, `password-input`, `confirm-password-input`, `register-button`, `form-error`, `email-error`, `password-error`, `confirm-password-error`, `go-to-login-link` |
| Header | `cart-button`, `cart-count`, `user-menu`, `logout-button`, `login-link`, `register-link` |
| Cart | `empty-cart-message`, `continue-shopping`, `cart-item-{id}`, `remove-item-{id}`, `cart-summary`, `cart-subtotal`, `cart-total`, `checkout-button` |
| Builder | `builder-canvas`, `add-to-cart-button`, `quality-confirm-dialog`, `confirm-quality-warning` |
| Create | `upload-option`, `generate-option` |
| Upload | `upload-success`, `product-{id}`, `file-input`, `dropzone` |
| Checkout | `shipping-form`, `shipping-submit`, `order-summary`, `order-item-{id}`, `order-total`, `guest-gate`, `continue-as-guest` |
| Homepage | `hero-create-button`, `browse-products-link`, `category-card` |

---

## Current Test Status

```
Homepage:     5/5  ✅
Auth Nav:     2/2  ✅
Auth Other:   1/13 ⚠️
Cart:         0/?  (not run)
Checkout:     0/?  (not run)
Critical:     0/?  (TypeScript errors)
```

---

## Next Steps (When Polish Time)

1. Fix auth session handling (Issue #1)
2. Update page objects with missing methods (Issue #2)
3. Fix fixture/page object property mismatches (Issue #5)
4. Run full E2E suite and iterate

---

*Last updated: 2026-01-21*
