# Progress Log

Chronological engineering log for AIPrintly Phase 1 development.

---

## 2026-02-06 — Wave III: Bug Fixes & Mobile Testing

### Session 2: Outstanding Issues Fixed

**Issues Resolved:**

1. **Missing `/orders` route** — Created order history list page (`routes/orders.tsx`)
   - Displays all user orders in descending order by date
   - Shows order number, status badge, item summary, date, and total
   - Empty state with "Browse Products" CTA
   - Registered route in `routes.ts`

2. **Product images showing placeholders** — Added category-based images
   - Created `getProductImageUrl()` function in products pages
   - Uses Unsplash images for PRINT and STORYBOOK categories
   - Falls back to metadata.imageUrl if available

3. **Missing asset image proxy route** — Registered `/api/assets/:id/image`
   - Route file existed but wasn't registered in `routes.ts`
   - Enables generated images to be served through authenticated proxy

4. **Mug/Apparel options visible in MVP** — Hidden non-MVP product types
   - Added `MVP_PRODUCT_TYPES` constant to `categories.ts`
   - Builder (`build.$productType.tsx`) now redirects mug/apparel to /products
   - Removed Mug/Apparel from `create.upload.tsx` and `create.generate.tsx`
   - Product type selector now only shows "Art Print" option

5. **Credits deduction verification** — Logic confirmed correct
   - Backend correctly deducts credits in `api.generate.image.ts`
   - Response includes `creditsRemaining` for UI update
   - `ImageGenerator` component updates local state with new balance
   - Refund logic in place for failed generations

**Files Modified:**
- `app/routes/orders.tsx` — NEW: Order history list page
- `app/routes.ts` — Added /orders and /api/assets/:id/image routes
- `app/routes/products.tsx` — Added getProductImageUrl function
- `app/routes/products.$category.tsx` — Added getProductImageUrl function
- `app/routes/build.$productType.tsx` — Added MVP redirect for mug/apparel
- `app/routes/create.upload.tsx` — Removed Mug/Apparel from product types
- `app/routes/create.generate.tsx` — Removed Mug/Apparel from product types
- `app/lib/categories.ts` — Added MVP_PRODUCT_TYPES constant

---

## 2026-02-06 — Wave III: Mobile Responsive Testing

### Session 1 Overview
Conducted comprehensive mobile responsive testing (375x667 - iPhone SE viewport). All key pages render correctly with proper touch targets and responsive layouts.

### Pages Tested (Mobile)

**Homepage** ✅
- Header with logo, cart badge, hamburger menu
- Hero text readable, CTAs properly sized
- Product category cards stack vertically
- Footer links wrap nicely

**Mobile Navigation Menu** ✅
- Full-screen overlay
- Products, Create, Cart links
- Login/Register buttons at bottom
- Close (X) button

**Products Page** ✅
- Filter buttons (All, Prints, Storybooks) touch-friendly
- Product cards single-column layout
- Prices and badges visible

**Create Page** ✅
- Upload and AI Generate options stack vertically
- Feature lists readable
- Buttons properly sized

**Cart Page** ✅
- Product thumbnail, name, variant visible
- Quantity controls touch-friendly
- Order summary with totals
- Promo code section

**Storybook Builder** ✅
- Title and action buttons fit
- Page thumbnail strip scrollable
- Layout selector icons touch-friendly
- Preview section with navigation
- Tips section visible

**Login Page** ✅
- Form fields properly sized
- Buttons touch-friendly
- Magic Link option shown

**Checkout Page** ✅
- All form fields accessible
- Address fields with helpful placeholders
- Order summary section
- Stripe trust indicator

**Credits Purchase Page** ✅
- Balance display
- Credit packs stack vertically
- Best Value badge visible
- Purchase buttons touch-friendly

### Mobile Testing Result
**PASS** — All tested pages are mobile-responsive with proper touch targets and readable text.

### Next Steps
- Add `/orders` list route for order history (known missing route)
- Investigate product image paths (placeholders showing)
- Debug R2 image URL configuration
- Wave III complete — ready for Wave II E2E test fixes

---

## 2026-02-05 — Wave III: Manual Flow Testing & Bug Fixes (Continued)

### Session 2: Storybook Builder Fix & Additional Flow Testing

**Bugs Fixed:**
1. **Header auth state** (`root.tsx`): Added loader to fetch userId, user data, and cart count. Updated App component to pass headerProps to AppLayout. Header now correctly shows user icon, logout button, and cart count for authenticated users.

2. **Missing credit routes** (`routes.ts`): Routes for `/credits/purchase`, `/credits/success`, and `/api/credits/purchase` existed as files but weren't registered in routes.ts. Added route registrations.

3. **PageEditor CSS bug** (`PageEditor.tsx:298`): The PagePreview container had `position: static` which caused `absolute inset-0` child element to escape and cover the entire viewport instead of being contained within the 600x600px preview. Added `relative` class to fix.

**Flows Tested:**
- Flow 6: Credit Purchase ✅ (credit packs page loads with 100/250/700 options)
- Flow 7: Storybook Creation ✅ (title, child name, page editing, text input, mock illustration generation all working)
- Flow 8: Order Tracking ⚠️ (ISSUE: `/orders` route returns 404 - no order list page exists)
- Flow 9: Account & Privacy ✅ (Account settings page shows user info, order count, danger zone with delete account)

**Files Modified:**
- `app/root.tsx` — Added loader for auth state and cart count
- `app/routes.ts` — Added missing credit purchase routes
- `app/components/storybook/PageEditor.tsx` — Fixed CSS positioning bug

**Issues Remaining:**
1. **Missing `/orders` route** — Account page links to `/orders` but route doesn't exist. Only `/orders/:orderId` exists.
2. Product images missing (placeholder images instead of actual)
3. Generated images not displaying in some previews
4. Credits deduction needs verification
5. Mug/Apparel visibility in MVP

### Session 1: Initial Testing

### Overview
Conducted manual browser testing of user flows (Wave III validation). Fixed critical registration bug, identified several UI/UX issues for resolution.

### Bug Fixed
- **Registration credits conflict** (`session.server.ts:229`): `linkUserToSession` was trying to link session credits to user who already has credits from signup bonus, violating unique constraint. Added check for existing user credits before attempting update.

### Issues Identified

**Critical:**
1. ~~**Header auth state** — Logged-in users still see "Login" and "Register" buttons instead of account/logout menu~~ FIXED

**High Priority:**
2. **Product images missing** — Products page shows placeholders instead of actual images
3. **Generated images not displaying** — AI-generated images show broken image icons in preview boxes (R2 URL issue)
4. **Credits not deducting** — Credit balance appears unchanged after AI generation

**Medium Priority:**
5. **Mug/Apparel visible** — Product type selectors still show Mug and Apparel options (should be hidden for MVP)

### Flows Tested
- Flow 1: Guest Browse & Discovery ✅
- Flow 2: Upload → Build → Cart ✅ (partial - consent flow works)
- Flow 3: AI Generate → Build → Cart ✅ (generation works, display issues)
- Flow 4: Registration & Login ✅ (after bug fix)
- Flow 5: Checkout form ✅ (form display and validation working)

### Files Modified
- `app/services/session.server.ts` — Fixed credits unique constraint bug

### Next Steps
- ~~Fix header authentication state display~~ DONE
- Add `/orders` list route for order history
- Investigate product image paths
- Debug R2 image URL configuration
- Verify credit deduction logic
- Mobile responsive testing

---

## 2026-01-23 — Wave P Complete: Privacy, Compliance & MVP Scope

### Overview
Completed Wave P (Privacy & Compliance). Implemented GDPR consent flows, avatar selector, privacy policy, credit packs, and AI generation safeguards. 267 new tests added.

### What Was Done

**P.2 — Photo Upload Consent Flow:**
- `PhotoConsentForm` component with GDPR-compliant checkboxes
- Consent required before upload (rights + child guardian confirmation)
- Consent stored in asset metadata with timestamp
- "Delete photo" option after upload

**P.3 — Avatar Selector:**
- `AvatarSelector` + `AvatarPreview` components
- Gender, skin tone (6 options), hair colour (8 options), hair style
- SVG-based live preview
- Privacy-friendly alternative to photo upload

**P.4 — Privacy Policy Page:**
- Comprehensive `/privacy` route with 10 sections
- Prominent "Children's Data" section with ICO compliance info
- GDPR rights, data retention table, third-party links
- Table of contents with anchor navigation

**P.5 — MVP Scope Refinement:**
- Hidden mugs/apparel from UI (prints + storybooks only)
- Registered user credits: 10 → 25
- Credit pack purchase flow (100/250/700 credits via Stripe)
- `CreditPackSelector` component + purchase API

**P.6 — AI Generation Safeguards:**
- Low-res previews (1024×1024) default, print-quality (2048×2048) after payment
- Asset proxy endpoint blocks direct downloads
- Watermark service for storybook previews (Sharp-based diagonal watermark)
- Free preview tracking for storybooks

### Files Created
- `app/components/upload/PhotoConsentForm.tsx`
- `app/components/ui/checkbox.tsx`
- `app/components/storybook/AvatarSelector.tsx`
- `app/components/storybook/AvatarPreview.tsx`
- `app/components/credits/CreditPackSelector.tsx`
- `app/routes/privacy.tsx`
- `app/routes/api.credits.purchase.ts`
- `app/routes/credits.purchase.tsx`
- `app/routes/credits.success.tsx`
- `app/routes/api.assets.$id.image.ts`
- `app/services/watermark.server.ts`
- `app/services/storybook-preview.server.ts`
- `app/services/ai/print-quality.server.ts`
- `app/lib/credit-packs.ts`

### Test Results
- 267 new tests (all passing)
- P.6 tests: 97 passing
- Consent/Privacy tests: 97 passing
- Avatar tests: 53 passing
- Credit pack tests: 20 passing

### Status
- Wave P: ✅ Complete (code done, P.1 UK/EU provider awaiting response)
- Email drafted to Stability AI Enterprise re: UK/EU data residency
- Using Replicate for MVP development in the meantime
- Next: Wave III (Human Polish) or Wave II (E2E Testing)

---

## 2026-01-22 — Business Model & Pricing Strategy Research

### Overview
Comprehensive business planning session. Researched AI API pricing, POD margins, competitor pricing, and ICO Children's Code compliance for photo uploads.

### Key Decisions Made

**MVP Scope Refined:**
- **Products**: Storybooks + Prints only (no apparel for MVP)
- Reduces complexity, focuses on highest-margin products

**AI Generation Pricing:**
- 20-30 free credits (tighter than original 50)
- Credit packs: 100 for £4.99, 250 for £9.99, 700 for £19.99
- Target 50% margin on AI costs
- Low-res previews (1024×1024), print-quality (2048×2048) only after payment
- No direct downloads until purchase

**Product Pricing:**
- Storybooks: £27.99 (hardcover), £7.99 (PDF only) — matches Wonderbly
- Prints/Posters: £9.99-£34.99 (40-70% margins)
- Shipping: £3.99 flat, free over £30

**Storybook Features:**
- 1-3 themes for MVP (Adventure, Magic, Bedtime)
- Simple customisation: child's name, appearance, dedication
- One format: hardcover only (+ optional PDF)
- One size: standard 8×8" or 8×10"
- 1 free storybook preview (watermarked), then credits for more

**Child Photo Upload (GDPR/ICO Compliance):**
- Photo feature included in MVP with full consent flow
- 30-day retention, auto-delete
- Explicit parental consent required
- "Never used for AI training" commitment
- Avatar selector as privacy-friendly alternative
- Need DPA from Replicate before launch

### Research Files Created
- `planning/research/ai-generation-api-research-prompt.md`
- `planning/research/findings.txt` (AI API comparison)
- `planning/research/business-model-research-prompt.md`
- `planning/research/business-research-findings.txt` (competitor/pricing analysis)

### ICO Children's Code Findings
- Code partially applies (parents are users, children are data subjects)
- ~8-9 of 15 standards relevant (data handling, not child-UX standards)
- Key requirements: DPIA, explicit consent, data minimisation, transparency
- Replicate's privacy policy needs review — they state "no children's data" but we'd be sending it

### Phase 2 Deferred
- Bundles & upsells (e.g., "Add matching mug for £7.99")
- Gift packaging (requires fulfilment provider research)
- Subscriptions (credits simpler for MVP)

### Status
- Business model: ✅ Defined
- Next: Research Blurb API/pricing for book fulfilment
- Next: Contact Replicate for DPA
- Next: Continue Cart → Checkout flow testing

---

## 2026-01-22 — Wave III Manual Flow Testing & Bug Fixes

### Overview
Wave III manual flow testing. Fixed critical bugs in Upload and AI Generation flows. Both paths now working end-to-end to builder.

### What Was Done

**Session 1 — Database Setup & Route Registration:**
- Configured Supabase PostgreSQL via session pooler (IPv4 compatible)
- Pushed Prisma schema to database
- Seeded 11 products with 42 variants (mugs, apparel, prints, storybooks)
- Fixed `app/routes.ts` — only 8 of 30+ routes were registered
- Fixed `orders.$orderId.tsx` — React Router v7 compatibility

**Session 2 — Upload Flow Fixes:**

1. **R2 Storage URL Fix:**
   - Upload preview wasn't rendering — `R2_PUBLIC_URL` was pointing to wrong port
   - User updated `.env` with correct Cloudflare R2 public URL
   - Upload preview now works ✅

2. **Server-Only Module Error:**
   - Builder page crashed with "Server-only module referenced by client"
   - `build.$productType.tsx` was importing from `~/services/products.server` at top level
   - Created `app/lib/product-types.ts` for shared type definitions
   - Changed to dynamic import inside loader for server functions
   - Builder page now loads ✅

3. **Auto-Select Variant Fix:**
   - "Add to Basket" button was disabled because no variant was auto-selected
   - Added `useEffect` to auto-select first available variant when product loads
   - Tested and confirmed working ✅

**Session 3 — AI Generation Flow Fixes:**

4. **ES Module Fix in AI Service:**
   - AI generation failed with "require is not defined"
   - `app/services/ai/index.ts` was using CommonJS `require()` inside ES module functions
   - Fixed by importing provider functions separately for internal use
   - AI service now works ✅

5. **Replicate API Token:**
   - User added valid Replicate API token to `.env`
   - AI image generation tested and working ✅
   - Generated pop art golden retriever image successfully

### Files Created
- `app/lib/product-types.ts` — Shared product type definitions
- `planning/research/ai-generation-api-research-prompt.md` — Prompt for researching AI APIs

### Files Modified
- `app/services/products.server.ts` — Re-export types from shared file
- `app/routes/build.$productType.tsx` — Dynamic import for server module, auto-select variant
- `app/services/ai/index.ts` — Fixed ES module imports for provider functions

### Flow Testing Progress
- [x] Landing page → Create hub
- [x] Upload image → Success with preview
- [x] AI Generate image → Success (Replicate SDXL)
- [x] Select product type → Continue to Builder
- [x] Builder page loads with design on canvas
- [x] Add to Basket button enabled (variant auto-select working)
- [ ] Cart page
- [ ] Checkout flow

### API Status
| API | Status |
|-----|--------|
| Cloudflare R2 | ✅ Working |
| Replicate (SDXL) | ✅ Working |
| OpenAI (fallback) | ⏸️ Not tested |

### Status
- Upload → Build flow: ✅ Working
- Generate → Build flow: ✅ Working
- Next: Test Cart → Checkout flow

---

## 2026-01-21 — Roadmap Reprioritisation: Human Polish First

### Overview
Reprioritised the roadmap to focus on getting the app to a working, polished state before comprehensive E2E testing and performance optimisation.

### Priority Change

**Before**: Wave II (E2E) → Wave III (Human Polish) → Verification
**After**: Wave III (Human Polish) → Wave II (E2E) → Verification

### Rationale
1. Users experience the app through manual flows first — this should work smoothly
2. Human validation catches UX issues that automated tests miss
3. E2E tests are more valuable when testing a stable, working app
4. Performance optimisation can happen after core functionality is verified

### Files Modified
- `planning/phase1/10-roadmap.md` — Updated status, reordered waves, revised timeline and dependencies
- `planning/phase1/progress-log.md` — Added this entry
- `planning/phase1/e2e-issues-tracker.md` — Updated status to reflect deferral
- `planning/phase1/13-e2e-testing.md` — Added deferral note

### New Priority Order
1. **Database Setup** — Connect E2E tests to real database for full flow validation
2. **Wave III: Human Polish** — Manual walkthrough, UI refinements, copy/content review
3. **Wave II: E2E Testing** — Fix remaining test issues, achieve full coverage
4. **E.3: Performance** — Lighthouse audit, optimisation (deferred)

### Next Steps
- [ ] Set up database connection for E2E tests
- [ ] Begin Wave III: Manual flow walkthroughs
- [ ] UI/UX review and refinements
- [ ] Copy and content polish

### Planning Document Created
- `planning/phase1/wave-iii-todo.md` — Comprehensive todo list for this phase

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
