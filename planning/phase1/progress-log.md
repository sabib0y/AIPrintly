# Progress Log

Chronological engineering log for AIPrintly Phase 1 development.

---

## 2026-01-21 — Checkout Auth Requirement & E2E Page Object Fixes

### Overview
Fixed checkout to require authentication per spec. Fixed E2E page object mismatches.

### Files Modified

**Checkout:**
- `app/routes/checkout.tsx` — Added auth redirect in loader, removed `GuestGate` component
- `app/routes.ts` — Added missing checkout route

**E2E Page Objects:**
- `e2e/page-objects/HomePage.ts` — Added `clickCreate()` alias
- `e2e/page-objects/BuilderPage.ts` — Added `designElement` alias
- `e2e/page-objects/UploadPage.ts` — Added `uploadSuccess`/`uploadError` aliases
- `e2e/page-objects/CheckoutPage.ts` — Added flexible `fillPayment()` method
- `e2e/tests/commerce/checkout.spec.ts` — Updated to use `fillPayment()`

### Status
- Checkout now requires authentication (redirects to login)
- E2E TypeScript errors resolved
- E2E tests need database connection to run full suite

---

## 2026-01-21 — Security & Accessibility Hardening (E.2/E.4)

### Overview
Completed security audit and accessibility audit. Applied Phase 1 fixes for high-priority issues.

### Files Modified

**Accessibility Fixes:**
- `app/routes/login.tsx` — Added `role="alert"` to form errors, rate limiting
- `app/routes/register.tsx` — Added `role="alert"` to form errors, rate limiting
- `app/routes/build.$productType.tsx` — Fixed heading hierarchy (h3→h2, h4→h2), added `aria-labelledby`/`aria-describedby` to dialogs
- `app/components/layout/Header.tsx` — Added skip to main content link
- `app/components/layout/Layout.tsx` — Added `id="main-content"` to main element

**Security Fixes:**
- `app/services/rate-limiter.server.ts` — Added `AUTH_RATE_LIMIT` (5 attempts/15min) and `checkAuthRateLimit()` function
- `app/services/session.server.ts` — Changed `sameSite: 'lax'` → `'strict'` for CSRF protection

**Documentation:**
- `planning/phase1/accessibility-audit.md` — Created with findings and remediation status
- `planning/phase1/security-audit.md` — Created with severity-ranked findings
- `planning/phase1/e2e-issues-tracker.md` — Created to track E2E test issues

### Status
- E.2 Accessibility: Phase 1 complete (4 high-priority fixes applied)
- E.4 Security: 2 of 6 high-severity issues fixed (auth rate limiting, CSRF)
- Remaining: Canvas keyboard nav (deferred), Redis rate limiting (production)

---

## 2026-01-21 — E2E Test Infrastructure & Test IDs

### Overview
Added all missing `data-testid` attributes across the application to enable E2E testing. Fixed page object selectors to match implementation.

### Files Modified

**Auth Pages:**
- `app/routes/login.tsx` — Added `email-input`, `password-input`, `login-button`, `form-error`, `forgot-password-link`, `go-to-register-link`, `email-error`, `password-error`
- `app/routes/register.tsx` — Added `email-input`, `password-input`, `confirm-password-input`, `register-button`, `form-error`, `go-to-login-link`, `email-error`, `password-error`, `confirm-password-error`

**Header:**
- `app/components/layout/Header.tsx` — Added `cart-button`, `cart-count`, `user-menu`, `logout-button`, `login-link`, `register-link`

**Cart:**
- `app/routes/cart.tsx` — Added `empty-cart-message`, `continue-shopping`

**Create/Upload:**
- `app/routes/create.tsx` — Added `upload-option`, `generate-option`
- `app/routes/create.upload.tsx` — Added `upload-success`, `product-{id}`

**Page Objects:**
- `e2e/page-objects/LoginPage.ts` — Fixed `registerLink` to use `go-to-register-link`
- `e2e/page-objects/RegisterPage.ts` — Fixed `loginLink` to use `go-to-login-link`

### Test Results
- Homepage tests: 5/5 passing ✅
- Auth navigation tests: 2/2 passing ✅
- Auth validation tests: 1/5 passing (see known issues)
- Total passing: 8/20

### Known Issues for Later Polish

**Auth Flow Issues (not test ID related):**
1. **Registration doesn't maintain session** — After `registerPage.register()`, the test expects `user-menu` to be visible but registration doesn't seem to properly redirect with authenticated state
2. **Empty field validation** — Tests expect `form-error` when submitting empty form, but HTML5 validation may prevent form submission before server-side validation runs
3. **Keyboard accessibility test** — Expects `form-error` after pressing Enter with invalid credentials, but validation timing may differ

**TypeScript Errors in E2E Tests:**
- `HomePage.clickCreate()` method doesn't exist
- `BuilderPage.designElement` property doesn't exist
- `UploadPage.uploadSuccess` and `uploadError` properties don't exist
- `CheckoutPage.fillPayment()` expects `cardNumber` but tests pass `number`

**Recommendation:**
When polishing E2E flow later:
1. Fix page object methods to match actual implementation
2. Add proper waits after registration/login for session to establish
3. Consider using `novalidate` on forms during E2E tests or test client-side validation separately
4. May need test database seeding for consistent auth testing

### Status
- Test ID coverage: ✅ Complete
- E2E infrastructure: 🟡 Needs page object fixes
- Auth E2E flow: 🟡 Needs session handling fixes

---

## 2026-01-20 — Mobile Builder Touch Support Fixed

### Overview
Fixed critical mobile touch issues for the product builder canvas, enabling touch-based drag, pinch-to-zoom, and two-finger rotation gestures.

### Files Modified
- `app/components/builder/Canvas.tsx` — Added full touch event support (TouchStart, TouchMove, TouchEnd), pinch-to-zoom and rotation gestures
- `app/routes/build.$productType.tsx` — Context-aware help text (mobile vs desktop instructions)
- `planning/phase1/mobile-issues-tracker.md` — Updated with fixes

### Key Changes
- Single-finger drag for element repositioning
- Two-finger pinch for scaling (min 0.1, max 3.0)
- Two-finger rotation gesture
- `touch-action: none` to prevent browser interference
- Device-appropriate help instructions using Tailwind breakpoints

### Status
- Issue #1 (Touch events): ✅ Fixed
- Issue #2 (Mobile gestures): ✅ Fixed
- Issue #3 (Help text): ✅ Fixed
- Remaining mobile issues: 5 (high/medium priority)

---

## 2026-01-20 — Wave II E2E Testing Started

### Overview
Started Wave II E2E testing infrastructure with Playwright. Created config, page objects, and test fixtures.

### Files Created

**E2E Infrastructure:**
- `e2e/playwright.config.ts` — Playwright config with multi-browser support
- `e2e/page-objects/BasePage.ts` — Base page object class
- `e2e/page-objects/HomePage.ts` — Landing page object
- `e2e/page-objects/RegisterPage.ts` — Registration page object
- `e2e/page-objects/LoginPage.ts` — Login page object
- `e2e/page-objects/CartPage.ts` — Cart page object
- `e2e/page-objects/BuilderPage.ts` — Product builder page object
- `e2e/page-objects/UploadPage.ts` — Upload page object
- `e2e/page-objects/CheckoutPage.ts` — Checkout page object with Stripe support
- `e2e/fixtures/test-data.fixture.ts` — Test data generators, Stripe test cards

**Dependencies:**
- Added `@playwright/test`, `@faker-js/faker`, `@axe-core/playwright`

### Status
- E2E infrastructure: 🟡 In Progress
- Page objects: ✅ Complete (8 created)
- Critical path tests (P0): 🔜 Next
- Build: ✅ Succeeds

### Next
- Write critical path tests (upload→checkout, generate→checkout)
- Create auth flow tests
- Add global setup/teardown for test database

---

## 2026-01-20 — Workstream D Fulfilment Complete

### Overview
Completed Workstream D (Fulfilment Integration) with Printful and Blurb provider services, webhook handlers, order routing, and order tracking page.

### Files Created

**Fulfilment Services:**
- `app/services/fulfilment/printful.server.ts` — Printful API integration (order creation, confirmation, cancellation, webhooks)
- `app/services/fulfilment/blurb.server.ts` — Blurb API integration (storybook orders, PDF generation, webhooks)
- `app/services/fulfilment/pdf-generator.server.ts` — Storybook PDF generation placeholder
- `app/services/fulfilment/order-router.server.ts` — Order routing to providers, retry logic, status tracking

**Webhook Handlers:**
- `app/routes/api.webhooks.printful.ts` — Printful webhook endpoint with HMAC verification
- `app/routes/api.webhooks.blurb.ts` — Blurb webhook endpoint with Bearer token verification

**Order Tracking:**
- `app/routes/orders.$orderId.tsx` — Order tracking page with token-based anonymous access

**Tests:**
- `__tests__/services/fulfilment/printful.server.test.ts` — 10 tests for Printful service
- `__tests__/services/fulfilment/blurb.server.test.ts` — 8 tests for Blurb service
- `__tests__/routes/api.webhooks.printful.test.ts` — 6 tests for Printful webhook
- `__tests__/services/fulfilment/order-router.server.test.ts` — 16 tests for order routing
- `__tests__/routes/api.webhooks.blurb.test.ts` — 11 tests for Blurb webhook

**Modified:**
- `app/services/stripe.server.ts` — Integrated fulfilment routing after order creation
- `app/routes/checkout.success.tsx` — Real order data fetching from database

### Features Implemented
- Printful order submission with HMAC webhook verification
- Blurb storybook order submission with PDF generation
- Order routing based on product category (PRINTFUL for merch, BLURB for storybooks)
- Webhook handlers for order status updates (shipped, delivered, failed)
- Order tracking page with timeline, tracking numbers, and status badges
- Token-based anonymous order tracking access
- Fulfilment retry mechanism for failed items
- Integration with checkout flow

### Workstream E (Polish & QA)
- Mobile QA audit completed (`planning/phase1/mobile-qa-audit.md`)
- Mobile issues tracker created (`planning/phase1/mobile-issues-tracker.md`)
- Identified critical builder touch support issues
- 8 mobile issues documented with severity ratings

### Test Results
- Fulfilment tests: 35 passing
- Build: ✅ Succeeds

### Status
- D.1 Printful Integration: ✅ Complete
- D.2 Blurb Integration: ✅ Complete
- D.3 Order Tracking Page: ✅ Complete
- D.4 Blurb Webhook Route: ✅ Complete
- D.5 Order Routing Service: ✅ Complete
- D.6 Checkout Integration: ✅ Complete
- E.1 Mobile QA Audit: ✅ Complete

### Next Session
- Wave II: E2E Testing with Playwright
- Fix critical mobile issues (builder touch support)

---

## 2026-01-20 — Quality Gates Complete (I.4)

### Overview
Completed Wave I Quality Gates (I.4) with confirmation prompts, quality warnings storage, and cart display.

### Files Created/Modified

**Created:**
- `app/components/ui/alert-dialog.tsx` — Radix UI AlertDialog component

**Modified:**
- `app/routes/build.$productType.tsx` — Quality warning confirmation dialog, updated add-to-cart flow
- `app/routes/api.cart.add.ts` — Accept and store quality warnings
- `app/services/configuration.server.ts` — Extended Customisation type with qualityWarnings
- `app/services/cart.server.ts` — Include customisation in cart queries
- `app/components/cart/CartItem.tsx` — Display quality warnings in cart

### Features Implemented
- Quality warning confirmation dialog before add-to-cart
- "Proceed Anyway" option for users accepting quality trade-offs
- Quality warnings stored with product configuration
- Quality warnings displayed in cart items
- Button text indicates when warnings present

### Status
- I.4 Quality Gates: ✅ Complete
- Build: ✅ Succeeds
- Wave I Integration: ✅ Complete

### Next Session
- Begin Workstream D (Fulfilment) or E (Polish)
- Or complete Wave I E2E testing

---

## 2026-01-20 — Auth System Complete (I.3)

### Overview
Completed Wave I Auth Completion (I.3) with email/password authentication, session migration, and logout functionality.

### Files Created/Modified

**Created:**
- `app/routes/logout.tsx` — POST logout action with session destruction

**Modified:**
- `app/routes/register.tsx` — Added action with Zod validation, bcrypt hashing, session migration
- `app/routes/login.tsx` — Added action with password verification, session migration
- `app/components/layout/Header.tsx` — Added logout button for authenticated users

**Tests:**
- `app/services/__tests__/auth.server.test.ts` — 8 tests for auth utilities

**Dependencies:**
- Added `bcryptjs` for password hashing

### Features Implemented
- Email/password registration with validation
- Email/password login with bcrypt verification
- Session migration on login/register (credits, assets, cart items)
- Logout with session destruction
- Error handling and form validation
- Redirect preservation across auth flows

### Status
- I.3 Auth Completion: ✅ Complete (email/password only)
- Magic link login: 🔜 Deferred (marked "Coming Soon" in UI)
- Password reset: 🔜 Deferred
- Build: ✅ Succeeds
- Tests: 417 passing (8 new auth tests)

### Next Session
- Add quality gates (I.4): DPI warnings, pre-checkout validation
- Complete Wave I integration testing
- Begin Workstream D (Fulfilment) or E (Polish)

---

## 2026-01-18 — Phase 1 Planning Complete

### Overview
Completed comprehensive Phase 1 MVP specification documents and set up Claude Code agents for parallel development.

### Files Created

**Specifications (planning/phase1/):**
- `02-sitemap.md` — Route structure and Remix file-based routing
- `03-data-model.md` — Database schema with 14 tables including credit system
- `04-user-flows.md` — 8 detailed user journey flows with ASCII diagrams
- `05-ai-generation.md` — Credit system, provider architecture, rate limiting
- `06-fulfilment-integration.md` — Printful and Blurb API integrations
- `07-product-builder.md` — Canvas customisation and mockup generation
- `08-checkout-and-orders.md` — Stripe Checkout, webhooks, order tracking
- `09-out-of-scope.md` — Explicit Phase 1 exclusions
- `10-roadmap.md` — Parallel workstream architecture (A/B/C/D/E)
- `11-tech-stack-recommendation.md` — Full technology justification

**Agents (.claude/agents/):**
- `remix-fullstack-architect.md` — Core Remix/React Router v7 expert
- `react-frontend-expert.md` — React UI specialist for Remix
- `fullstack-code-reviewer.md` — Code review with Remix patterns
- `refactoring-specialist.md` — Code quality and refactoring
- `testing-automation-engineer.md` — Vitest and Playwright testing
- `ui-html-generator.md` — HTML prototyping with Tailwind
- `asset-pipeline-specialist.md` — Upload, processing, AI generation (Workstream A)
- `commerce-integrations-expert.md` — Stripe, cart, checkout (Workstream C)
- `fulfilment-integrations-expert.md` — Printful, Blurb integration (Workstream D)

**Commands (.claude/commands/):**
- `wake.md` — Session start briefing
- `track.md` — Progress update logic
- `sleep.md` — Session wrap-up

### Status
- Phase 1 planning: ✅ Complete
- Ready to begin Wave 0: Foundation
- Next: Set up Remix project, database schema, basic auth

### Architecture Notes
- Parallel workstream design enables concurrent development
- Wave 0 establishes shared contracts for Workstreams A, B, C
- Credit system integrated throughout AI generation flow
- Multi-provider fulfilment routing (Printful for merch, Blurb for books)

---

## 2026-01-19 — Wave 0 + Wave 1 Complete

### Overview
Completed Wave 0 (Foundation) and Wave 1 (Workstreams A, B, C) in parallel. Full build succeeds, 409 tests passing.

### Files Created

**Workstream A — Asset Pipeline:**
- `app/services/ai/` — Provider interface, Replicate, OpenAI, story generator
- `app/routes/api.generate.image.ts`, `api.generate.story.ts`, `api.credits.ts`
- `app/components/generate/`, `app/components/credits/`, `app/components/upload/`
- `app/services/storage.server.ts`, `image-processing.server.ts`, `credits.server.ts`

**Workstream B — Product Builder:**
- `app/services/products.server.ts`, `mockup.server.ts`
- `app/routes/api.products.ts`, `api.mockups.ts`, `build.$productType.tsx`, `build.storybook.tsx`
- `app/components/builder/` — Canvas, TransformControls, PrintAreaOverlay, etc.
- `app/components/products/` — ProductCard, VariantSelector
- `app/components/storybook/` — PageEditor, PageThumbnailStrip, TextEditor, BookPreview

**Workstream C — Commerce Stack:**
- `app/services/cart.server.ts`, `orders.server.ts`, `stripe.server.ts`, `email.server.ts`
- `app/routes/api.cart.ts`, `api.checkout.create-session.ts`, `api.webhooks.stripe.ts`
- `app/routes/checkout.tsx`, `checkout.success.tsx`, `checkout.cancelled.tsx`
- `app/components/cart/`, `app/components/checkout/`
- `app/emails/` — Order confirmation, shipping notification templates

**Shared:**
- `app/lib/categories.ts` — Category mappings (client-safe)
- `scripts/seed-products.ts` — Product seeding script

### Status
- Wave 0: ✅ Complete
- Workstream A: ✅ Complete
- Workstream B: ✅ Complete
- Workstream C: ✅ Complete
- Build: ✅ Succeeds
- Tests: 409 passing, 57 need test infrastructure fixes (React Router context)
- Next: Wave I (Integration) → Connect flows end-to-end

### Commit
`d77729d` — feat: implement Wave 1 core functionality (107 files, 36,235 lines)

---

## 2026-01-19 — Wave I Integration Started

### Overview
Started Wave I (Integration) to connect workstreams A, B, C end-to-end. Completed flow connections (I.1) and began session continuity (I.2).

### Files Created/Modified

**Flow Connections:**
- `app/routes/create.upload.tsx` — Upload → Build flow entry
- `app/routes/create.generate.tsx` — Generate → Build flow entry
- `app/routes/api.cart.add.ts` — Build → Cart API endpoint
- `app/services/configuration.server.ts` — Product configuration service

**Session Migration:**
- `app/services/session-migration.server.ts` — Guest → account migration service

**Modified:**
- `app/routes/create.tsx` — Added links to upload/generate routes
- `app/routes/build.$productType.tsx` — Accept assetId param, add-to-cart integration

### Status
- I.1 Flow Connections: ✅ Complete (Upload→Build, Generate→Build, Build→Cart, Cart→Checkout)
- I.2 Session Continuity: 🟡 In Progress (migration service created, auth integration pending)
- I.3 Auth Completion: 🔜 Pending
- I.4 Quality Gates: 🔜 Pending
- Build: ✅ Succeeds

### Next Session
- Complete auth flow (registration action, login action)
- Integrate session migration into auth
- Add quality gates (DPI warnings, pre-checkout validation)

---

*Use `/track` to add new entries after completing work.*
