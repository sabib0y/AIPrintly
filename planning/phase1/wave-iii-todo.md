# Wave III — Human Validation & Polish

**Status**: 🟡 In Progress
**Priority**: HIGH (reprioritised 2026-01-21)
**Goal**: Get the app to a working, polished state end-to-end

---

## Phase Overview

This phase focuses on:
1. **Database & Environment** — Ensure everything is connected
2. **End-to-End Flows** — Verify each user journey works completely
3. **Third-Party API Reality Check** — Understand limitations and adjust UI/UX
4. **UI/UX Polish** — Improve the experience based on findings

---

## 1. Database & Environment Setup

### 1.1 Database Connection
- [x] Verify DATABASE_URL is configured correctly
- [x] Run `npm run db:push` to sync schema
- [x] Run `npm run db:studio` to verify tables exist
- [x] Check for any pending migrations

### 1.2 Product Seeding
- [x] Run `npm run db:seed` or seed script to populate products
- [x] Verify products appear on `/products` page
- [x] Check each category has products (mugs, apparel, prints, storybooks)
- [x] Verify product variants exist (sizes, colours)

**Seeded:** 11 products, 42 variants (2026-01-22)

### 1.3 Environment Variables Audit
Required for full functionality:
- [ ] `DATABASE_URL` / `DIRECT_URL` — Database connection
- [ ] `SESSION_SECRET` — Session encryption
- [ ] `APP_URL` — Application URL for redirects
- [ ] `STRIPE_SECRET_KEY` — Stripe payments
- [ ] `STRIPE_PUBLISHABLE_KEY` — Stripe frontend
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe webhooks
- [ ] `REPLICATE_API_TOKEN` — AI image generation
- [ ] `R2_ACCOUNT_ID` — Cloudflare R2 storage
- [ ] `R2_ACCESS_KEY_ID` — R2 access
- [ ] `R2_SECRET_ACCESS_KEY` — R2 secret
- [ ] `R2_BUCKET_NAME` — R2 bucket

Optional but recommended:
- [ ] `OPENAI_API_KEY` — AI fallback provider
- [ ] `RESEND_API_KEY` — Email sending (logs without)
- [ ] `PRINTFUL_API_KEY` — Fulfilment (mock mode without)
- [ ] `BLURB_API_KEY` — Storybook fulfilment

---

## 2. End-to-End Flow Verification

### 2.1 Flow A: Upload → Build → Cart → Checkout → Order

**Upload Phase:**
- [ ] Navigate to `/create` and select "Upload"
- [ ] Upload a test image (try various sizes: 500x500, 2000x2000, 4000x4000)
- [ ] Verify quality assessment displays correctly
- [ ] Verify image preview shows
- [ ] Select product type and continue

**Build Phase:**
- [ ] Verify builder loads with uploaded image
- [ ] Test drag to reposition
- [ ] Test zoom in/out controls
- [ ] Test rotation (if applicable)
- [ ] Test reset button
- [ ] Select size/colour variants
- [ ] Verify price updates
- [ ] Check quality warnings appear for low-res images
- [ ] Add to cart

**Cart Phase:**
- [ ] Verify item appears in cart
- [ ] Test quantity increment/decrement
- [ ] Test remove item
- [ ] Verify totals calculate correctly
- [ ] Proceed to checkout

**Checkout Phase:**
- [ ] Verify redirect to login if not authenticated
- [ ] Register/login and return
- [ ] Fill shipping form
- [ ] Verify form validation
- [ ] Submit to Stripe

**Payment Phase:**
- [ ] Stripe Checkout loads
- [ ] Use test card `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify redirect to success page

**Order Confirmation:**
- [ ] Order number displays
- [ ] Order items listed correctly
- [ ] Confirmation email sent (check logs if no Resend key)
- [ ] Order appears in database

### 2.2 Flow B: AI Generate → Build → Cart → Checkout

**Generate Phase:**
- [ ] Navigate to `/create` and select "Generate"
- [ ] Check credit balance displays
- [ ] Select a style preset
- [ ] Enter a test prompt
- [ ] Click generate
- [ ] Verify loading/progress state
- [ ] Verify image appears on completion
- [ ] Verify credit deducted
- [ ] Select product type and continue

**Remaining Steps:**
- [ ] Complete build → cart → checkout flow (as above)

### 2.3 Flow C: Storybook Creation (If Supported)

**Story Generation:**
- [ ] Navigate to storybook builder
- [ ] Enter child's name
- [ ] Generate or create story content
- [ ] Verify page editor works
- [ ] Test page navigation
- [ ] Add to cart

**Note:** Storybook backend may be incomplete — document any blockers.

### 2.4 Guest Experience

- [ ] Test complete flow without logging in
- [ ] Verify session persists cart items
- [ ] Verify redirect to login at checkout
- [ ] Verify cart items preserved after login

### 2.5 Mobile Experience

- [ ] Test upload flow on mobile viewport
- [ ] Test builder touch gestures (drag, pinch, rotate)
- [ ] Test cart on mobile
- [ ] Test checkout form on mobile
- [ ] Verify no horizontal scroll anywhere

---

## 3. Third-Party API Reality Check

### 3.1 Stripe Integration
**Status:** ✅ Real API, production-ready

- [ ] Test in Stripe test mode
- [ ] Verify webhook receives events (use Stripe CLI: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`)
- [ ] Test successful payment creates order
- [ ] Test failed payment shows error
- [ ] Test 3D Secure flow (card: `4000 0025 0000 3155`)

### 3.2 Replicate/OpenAI (AI Generation)
**Status:** ✅ Real API, production-ready

- [ ] Test image generation completes
- [ ] Verify generated image downloads to R2
- [ ] Test generation failure scenario (bad prompt)
- [ ] Verify credit refund on failure
- [ ] Test rate limiting behaviour

### 3.3 R2 Storage
**Status:** ✅ Real API, production-ready

- [ ] Verify uploads store correctly
- [ ] Verify images retrievable via public URL
- [ ] Check signed URL generation works

### 3.4 Printful Integration
**Status:** ⚠️ Partial — config data incomplete

**Investigation needed:**
- [ ] Review Printful API requirements
- [ ] Understand product variant mapping (Printful IDs vs. our IDs)
- [ ] Check what file format/resolution Printful needs
- [ ] Determine if mockup generation uses Printful API or is local
- [ ] Document any gaps between our data model and Printful's

**Potential UX impact:**
- [ ] May need to revise product seeding to include Printful variant IDs
- [ ] May need to generate print-ready files in specific format
- [ ] Consider: Should we show Printful mockups or generate our own?

### 3.5 Blurb Integration
**Status:** ⚠️ Partial — PDF generation needed

**Investigation needed:**
- [ ] Review Blurb API requirements
- [ ] Understand PDF spec for storybooks
- [ ] Check `pdf-generator.server.ts` implementation status
- [ ] Determine page count, dimensions, format requirements

**Potential UX impact:**
- [ ] Storybook builder may need significant backend work
- [ ] Consider: Is storybook MVP-critical or can it be Phase 2?

### 3.6 Email (Resend)
**Status:** ✅ Production-ready with fallback

- [ ] Verify order confirmation email content
- [ ] Check email renders correctly (send test)
- [ ] Verify shipping notification template

---

## 4. UI/UX Improvements

### 4.1 Critical Fixes (Must Have)

**Based on exploration findings:**

- [ ] **Checkout Payment Step** — Currently only shows shipping, need visual payment step or clearer flow
- [ ] **Mockup Preview** — Product builder shows placeholder, need real mockup generation or clear preview
- [ ] **Quality Warning Clarity** — Dialog may confuse users; improve copy to explain what warnings mean
- [ ] **Form Error Display** — Verify all forms show validation errors clearly

### 4.2 High Priority Polish

- [ ] **Loading States** — Review all async operations have proper loading indicators
- [ ] **Error States** — Review all error scenarios have user-friendly messages
- [ ] **Empty States** — Check empty cart, no products, no orders states
- [ ] **Success Feedback** — Add toast/notification on successful actions (add to cart, etc.)

### 4.3 Copy & Content Review

- [ ] Review all button text (actionable, clear)
- [ ] Review all headings (descriptive, not generic)
- [ ] Review all help text (useful, not obvious)
- [ ] Review error messages (specific, actionable)
- [ ] Review empty states (helpful, not generic)
- [ ] Check for placeholder text like "Lorem ipsum" or "TODO"

### 4.4 Visual Polish

- [ ] Consistent spacing throughout app
- [ ] Consistent font sizes
- [ ] Consistent button styles
- [ ] Dark mode works everywhere
- [ ] No layout shifts on load

### 4.5 Accessibility Quick Wins

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Focus states visible
- [ ] Skip to main content link works
- [ ] Heading hierarchy is logical (h1 → h2 → h3)

---

## 5. Decision Points

### 5.1 Storybook Scope Decision
**Question:** Is storybook creation MVP-critical?

Options:
1. **Include in MVP** — Complete backend, PDF generation, Blurb integration
2. **Defer to Phase 2** — Hide/disable storybook option, focus on print products
3. **Include with limitations** — Allow creation but manual fulfilment

**Factors to consider:**
- Blurb API integration complexity
- PDF generation requirements
- Time to complete vs. value delivered

### 5.2 Mockup Generation Approach
**Question:** How should product mockups be generated?

Options:
1. **Use Printful Mockup API** — Real, accurate mockups from Printful
2. **Generate client-side** — Use canvas overlay on product templates
3. **Static templates** — Pre-made templates with image placement

**Current state:** Placeholder/unclear from code exploration

### 5.3 Product Catalogue Source
**Question:** Where do products come from?

Options:
1. **Sync from Printful** — Keep our DB in sync with Printful catalogue
2. **Manual seeding** — Curate specific products we want to offer
3. **Hybrid** — Seed from Printful, curate selection

**Note:** Need Printful variant IDs for order submission

---

## 6. Testing Checklist (Manual)

### Before Marking Complete

- [ ] Complete Flow A (upload) end-to-end on desktop
- [ ] Complete Flow A on mobile
- [ ] Complete Flow B (generate) end-to-end on desktop
- [ ] Complete Flow B on mobile
- [ ] Test guest → authenticated transition
- [ ] Test all form validations
- [ ] Test all error states
- [ ] Verify order created in database
- [ ] Verify webhook received (check logs)
- [ ] Review all pages in dark mode

---

## Progress Tracking

| Section | Status | Notes |
|---------|--------|-------|
| 1. Database & Environment | ✅ Complete | Supabase connected, products seeded |
| 2. E2E Flow Verification | 🟡 In Progress | Routes fixed, ready for manual testing |
| 3. Third-Party API Check | 🔜 Not started | |
| 4. UI/UX Improvements | 🔜 Not started | |
| 5. Decision Points | 🔜 Pending discussion | |
| 6. Testing Checklist | 🔜 Not started | |

---

## Blockers & Questions

*Document any blockers or questions that arise during this phase:*

1. ...
2. ...
3. ...

---

*Created: 2026-01-21*
*Last Updated: 2026-01-21*
