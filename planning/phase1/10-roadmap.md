# AIPrintly — Phase 1 Master Roadmap

This roadmap represents the complete end-to-end lifecycle of Phase 1, including planning, build waves, testing, verification, and deployment.

It is the **single source of truth** for what must happen before AIPrintly Phase 1 is releasable.

---

## Phase Structure Overview

Phase 1 is delivered in four layers:

1. **Product Definition Layer** — flows, data model, UX decisions
2. **Build Layer** — executed in parallel workstreams with sync points
3. **Verification Layer** — testing, QA, user review
4. **Deployment Layer** — production readiness, monitoring, content & legal

Each layer has explicit exit criteria.

---

## Current Status

| Layer | Status |
|-------|--------|
| 1. Product Definition | ✅ Complete |
| 2. Build (Workstreams A-E) | 🟡 In Progress (Wave 0 + A/B/C + Wave I + D done, E partial) |
| 3. Verification (E2E + QA) | 🟡 In Progress (E2E infrastructure done) |
| 4. Deployment | 🔜 Not started |

**Overall Progress**: ~80% (Wave 0 + Workstreams A, B, C + Wave I + D complete, E and Wave II in progress)

### Workstream Status

| Workstream | Status | Tests |
|------------|--------|-------|
| Wave 0 — Foundation | ✅ Complete | — |
| A — Asset Pipeline | ✅ Complete | 417 passing |
| B — Product Builder | ✅ Complete | (included above) |
| C — Commerce Stack | ✅ Complete | (included above) |
| Wave I — Integration | ✅ Complete | — |
| D — Fulfilment | ✅ Complete | 35 passing |
| E — Polish & QA | 🟡 In Progress (E.1, E.2, E.4 done) | — |
| Wave II — E2E Testing | 🟡 In Progress (infra done, tests need fixes) | 8/20 passing |
| Wave III — Human Polish | 🔜 Not started | — |

---

# Layer 1 — Product Definition ✅

All specs complete:
- [x] `01-overview.md` — Core deliverables, user journey
- [x] `02-sitemap.md` — Route structure
- [x] `03-data-model.md` — Database schema with credits
- [x] `04-user-flows.md` — Detailed flows
- [x] `05-ai-generation.md` — AI specs + credit system
- [x] `06-fulfilment-integration.md` — Printful/Blurb APIs
- [x] `07-product-builder.md` — Customisation UI
- [x] `08-checkout-and-orders.md` — Payments + tracking
- [x] `09-out-of-scope.md` — Exclusions
- [x] `11-tech-stack-recommendation.md` — Technology choices
- [x] `12-storage-policy.md` — Asset retention tiers
- [x] `13-e2e-testing.md` — E2E testing specification

---

# Layer 2 — Build Layer (Parallel Workstreams)

## Architecture for Parallelisation

The build is structured into **5 independent workstreams** that can run simultaneously after a shared foundation phase.

```
                    ┌─────────────────────────────────────┐
                    │     FOUNDATION (Wave 0)             │
                    │  Remix + DB + Base UI + Auth Shell  │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   WORKSTREAM A    │   │   WORKSTREAM B    │   │   WORKSTREAM C    │
│                   │   │                   │   │                   │
│  Asset Pipeline   │   │  Product Builder  │   │  Commerce Stack   │
│  ─────────────    │   │  ─────────────    │   │  ─────────────    │
│  • Upload         │   │  • Canvas UI      │   │  • Cart API       │
│  • R2 Storage     │   │  • Transforms     │   │  • Stripe         │
│  • Image process  │   │  • Variant select │   │  • Orders         │
│  • AI generation  │   │  • Mockup gen     │   │  • Webhooks       │
│  • Credits        │   │  • Storybook UI   │   │  • Emails         │
└───────────────────┘   └───────────────────┘   └───────────────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     INTEGRATION (Wave I)            │
                    │  Connect workstreams + flow tests   │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                                                   │
            ▼                                                   ▼
┌───────────────────┐                               ┌───────────────────┐
│   WORKSTREAM D    │                               │   WORKSTREAM E    │
│                   │                               │                   │
│  Fulfilment       │                               │  Polish & QA      │
│  ─────────────    │                               │  ─────────────    │
│  • Printful API   │                               │  • Mobile QA      │
│  • Blurb API      │                               │  • A11y audit     │
│  • Order routing  │                               │  • Performance    │
│  • Tracking page  │                               │  • Security       │
└───────────────────┘                               └───────────────────┘
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     E2E TESTING (Wave II)           │
                    │  Full user journey validation       │
                    │  See: 13-e2e-testing.md             │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     VERIFICATION (Layer 3)          │
                    │  UAT + Bug fixes + Final QA         │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     DEPLOYMENT (Layer 4)            │
                    │  Production + Monitoring + Launch   │
                    └─────────────────────────────────────┘
```

---

## Wave 0 — Foundation (Blocking)

**Duration**: Must complete before parallel work begins

**Owner**: Full team

This wave establishes shared infrastructure that all workstreams depend on.

### Tasks

- [ ] Remix project setup with React Router v7
- [ ] Tailwind CSS v4 configuration
- [ ] PostgreSQL database setup (Supabase)
- [ ] Prisma schema creation (ALL tables — complete schema)
- [ ] Database migrations
- [ ] Base UI component library (Button, Input, Card, Modal, Toast)
- [ ] Layout components (Header, Footer, Navigation)
- [ ] Auth shell (session middleware, protected route wrapper)
- [ ] Error pages (404, 500)
- [ ] Legal page shells (privacy, terms, cookies, returns, delivery)
- [ ] Environment configuration
- [ ] CI/CD pipeline (build + test)

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| `/` | Landing page shell |
| `/login`, `/register` | Auth page shells (UI only) |
| `/products` | Product listing shell |
| `/create` | Creation hub shell |
| `/cart` | Cart page shell |
| Prisma schema | All 14 tables defined |
| Component library | 10+ base components |

### Exit Criteria

- [ ] `pnpm build` succeeds
- [ ] All shells render without errors
- [ ] Database migrations apply cleanly
- [ ] CI pipeline green

### Tests: 50+

---

## Workstream A — Asset Pipeline

**Dependencies**: Wave 0 complete

**Can run parallel with**: B, C

**Owner**: Backend-focused developer

### Scope

Everything related to getting images into the system (upload or AI generation).

### Tasks

#### A.1 — Upload System
- [ ] `POST /api/assets/upload` endpoint
- [ ] R2/S3 client integration
- [ ] Sharp image processing (resize, format convert)
- [ ] Upload UI component (drag & drop)
- [ ] Progress indicator
- [ ] Quality validation (DPI check, dimension check)
- [ ] Asset metadata storage

#### A.2 — AI Generation
- [ ] AI provider interface (abstract)
- [ ] Replicate SDXL provider
- [ ] OpenAI DALL-E provider (fallback)
- [ ] `POST /api/generate/image` endpoint
- [ ] `GET /api/generate/image/$jobId` polling
- [ ] Generation job queue/status
- [ ] Style preset system
- [ ] Image generation UI (style picker, prompt input)
- [ ] Loading states + progress

#### A.3 — Story Generation
- [ ] `POST /api/generate/story` endpoint
- [ ] GPT-4 story generation
- [ ] Story structure parsing
- [ ] Illustration prompt extraction
- [ ] Story preview UI

#### A.4 — Credit System
- [ ] `user_credits` table operations
- [ ] Credit initialisation (3 for guest, 10 for registered)
- [ ] Credit deduction on generation
- [ ] Credit refund on failure
- [ ] `GET /api/credits` endpoint
- [ ] Credit balance UI component
- [ ] "Out of credits" gate UI

#### A.5 — Rate Limiting
- [ ] Per-session rate limiter
- [ ] Per-IP rate limiter
- [ ] Concurrent job limiter
- [ ] Abuse detection (rapid-fire blocking)

### Deliverables

| Route | Function |
|-------|----------|
| `/create/upload` | Working upload flow |
| `/create/generate/image` | Working AI image generation |
| `/create/generate/story` | Working story generation |
| `/api/credits` | Credit balance API |

### Exit Criteria

- [ ] Can upload image → stored in R2 → asset created
- [ ] Can generate image with AI → credits deducted
- [ ] Can generate story → pages with illustration prompts
- [ ] Rate limits enforced
- [ ] Credit gate blocks when empty

### Tests: 80+

---

## Workstream B — Product Builder

**Dependencies**: Wave 0 complete

**Can run parallel with**: A, C

**Owner**: Frontend-focused developer

### Scope

Product display, customisation canvas, mockup generation.

### Tasks

#### B.1 — Product Catalogue
- [ ] Printful product sync script
- [ ] `products` + `product_variants` seeding
- [ ] Product listing page (`/products`)
- [ ] Product category pages (`/products/mugs`, etc.)
- [ ] Product card component
- [ ] Variant availability display

#### B.2 — Builder Canvas
- [ ] Canvas component with fabric.js or custom
- [ ] Image transform controls (drag, scale, rotate)
- [ ] Print area boundary display
- [ ] Constraint system (min overlap, max scale)
- [ ] Mobile touch gestures (pinch, rotate)
- [ ] Keyboard shortcuts

#### B.3 — Variant Selection
- [ ] Size selector component
- [ ] Colour selector component (swatches)
- [ ] Price display component
- [ ] Stock status indicator

#### B.4 — Mockup Generation
- [ ] Client-side preview rendering
- [ ] Printful mockup API integration
- [ ] Mockup caching system
- [ ] Quality warning display

#### B.5 — Storybook Builder
- [ ] Page thumbnail strip
- [ ] Page editor component
- [ ] Text editing inline
- [ ] Image replacement per page
- [ ] Page layout options
- [ ] Book preview (flip-through)

### Deliverables

| Route | Function |
|-------|----------|
| `/products` | Product listing |
| `/products/$category` | Category filtering |
| `/build/mug` | Mug builder |
| `/build/apparel` | Apparel builder |
| `/build/print` | Print builder |
| `/build/storybook` | Storybook builder |

### Exit Criteria

- [ ] Can browse products by category
- [ ] Can customise product with transforms
- [ ] Mockups generate correctly
- [ ] Storybook editor is functional
- [ ] Works on mobile

### Tests: 70+

---

## Workstream C — Commerce Stack

**Dependencies**: Wave 0 complete

**Can run parallel with**: A, B

**Owner**: Full-stack developer

### Scope

Cart, checkout, payments, orders, emails.

### Tasks

#### C.1 — Cart System
- [ ] `cart_items` table operations
- [ ] `GET /api/cart` endpoint
- [ ] `POST /api/cart/items` endpoint
- [ ] `PATCH /api/cart/items/$id` endpoint
- [ ] `DELETE /api/cart/items/$id` endpoint
- [ ] Cart page UI (`/cart`)
- [ ] Quantity controls
- [ ] Remove item
- [ ] Cart validation (quality checks)

#### C.2 — Checkout Flow
- [ ] Checkout page (`/checkout`)
- [ ] Guest-to-account gate
- [ ] Registration form (inline)
- [ ] Shipping address form (UK only)
- [ ] Shipping rate calculation
- [ ] Order summary display

#### C.3 — Stripe Integration
- [ ] `POST /api/checkout/create-session`
- [ ] Stripe Checkout redirect
- [ ] `POST /api/webhooks/stripe`
- [ ] `checkout.session.completed` handler
- [ ] `payment_intent.payment_failed` handler
- [ ] Success page (`/checkout/success`)
- [ ] Cancelled page (`/checkout/cancelled`)

#### C.4 — Order Creation
- [ ] Order number generation
- [ ] Tracking token generation
- [ ] Order record creation
- [ ] Order items creation
- [ ] Cart clearing

#### C.5 — Email System
- [ ] Resend integration
- [ ] Order confirmation template
- [ ] Email sending service

### Deliverables

| Route | Function |
|-------|----------|
| `/cart` | Working cart |
| `/checkout` | Checkout with Stripe |
| `/checkout/success` | Post-payment success |
| `/checkout/cancelled` | Payment cancelled |
| `/api/webhooks/stripe` | Payment webhooks |

### Exit Criteria

- [ ] Can add items to cart
- [ ] Can complete Stripe checkout
- [ ] Order created on payment success
- [ ] Confirmation email sent

### Tests: 90+

---

## Wave I — Integration

**Dependencies**: Workstreams A, B, C complete

**Owner**: Full team

Connect the independent workstreams into complete user flows.

### Tasks

#### I.1 — Flow Connections
- [ ] Upload → Build flow (pass asset ID)
- [ ] Generate → Build flow (pass asset ID)
- [ ] Build → Cart flow (create configuration, add to cart)
- [ ] Cart → Checkout flow (validate, redirect)
- [ ] Storybook story → illustrations → build flow

#### I.2 — Session Continuity
- [ ] Guest session → assets → cart → account → order
- [ ] Credit migration on signup
- [ ] Asset migration on signup

#### I.3 — Auth Completion
- [ ] Email/password registration (full)
- [ ] Magic link login (full)
- [ ] Password reset (full)
- [ ] Session persistence

#### I.4 — Quality Gates
- [ ] Pre-checkout validation
- [ ] DPI warnings
- [ ] Bleed zone warnings
- [ ] Confirmation prompts

### Exit Criteria

- [ ] Complete flow: Upload → Build → Cart → Checkout → Order
- [ ] Complete flow: Generate → Build → Cart → Checkout → Order
- [ ] Complete flow: Story → Illustrations → Storybook → Checkout
- [ ] Session persists across all flows

### Tests: 40+ (E2E focus)

---

## Workstream D — Fulfilment

**Dependencies**: Wave I complete (needs orders to exist)

**Can run parallel with**: E

**Owner**: Backend developer

### Scope

Order routing to fulfilment providers, tracking.

### Tasks

#### D.1 — Printful Integration
- [ ] Order routing logic
- [ ] `createPrintfulOrder` function
- [ ] Printful webhook handler
- [ ] Status mapping (Printful → internal)

#### D.2 — Blurb Integration
- [ ] PDF generation for storybooks
- [ ] `createBlurbOrder` function
- [ ] Blurb webhook handler
- [ ] Status mapping

#### D.3 — Order Tracking
- [ ] Order tracking page (`/orders/$orderId`)
- [ ] Token-based access
- [ ] Status timeline UI
- [ ] Tracking number display
- [ ] Carrier link

#### D.4 — Notifications
- [ ] Shipping notification email
- [ ] Delivery confirmation email

#### D.5 — Support
- [ ] Problem reporting UI
- [ ] Support ticket creation

### Deliverables

| Route | Function |
|-------|----------|
| `/orders/$orderId` | Order tracking |
| `/api/webhooks/printful` | Printful status updates |
| `/api/webhooks/blurb` | Blurb status updates |

### Exit Criteria

- [ ] Orders route to correct provider
- [ ] Webhooks update order status
- [ ] Tracking page shows accurate info
- [ ] Emails sent on status changes

### Tests: 60+

---

## Workstream E — Polish & QA

**Dependencies**: Wave I complete

**Can run parallel with**: D

**Owner**: QA / Frontend developer

### Scope

Mobile, accessibility, performance, security.

### Tasks

#### E.1 — Mobile QA
- [ ] Responsive audit (all pages)
- [ ] Touch interaction testing
- [ ] Builder mobile UX
- [ ] Checkout mobile UX

#### E.2 — Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Colour contrast
- [ ] Focus indicators
- [ ] ARIA labels

#### E.3 — Performance
- [ ] Lighthouse audit (target >90)
- [ ] Core Web Vitals
- [ ] Image optimisation
- [ ] Bundle size audit
- [ ] Lazy loading

#### E.4 — Security
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Input validation
- [ ] Rate limit effectiveness
- [ ] Webhook signature verification

#### E.5 — Content & Legal
- [ ] Legal page content (final copy)
- [ ] Error message copy
- [ ] Loading state copy
- [ ] Email template copy

### Exit Criteria

- [ ] Lighthouse >90
- [ ] No critical accessibility issues
- [ ] No security vulnerabilities
- [ ] All copy reviewed

### Tests: 30+ (audit-focused)

---

## Wave II — E2E Testing

**Dependencies**: Workstreams D, E complete

**Owner**: Full team

**Specification**: See `13-e2e-testing.md` for full details

Comprehensive end-to-end testing of all user journeys using Playwright.

### Test Categories

#### II.1 — Critical User Journeys (P0)
Must pass before any release:
- [ ] Upload → Build → Cart → Checkout → Order (with quality warnings)
- [ ] Generate → Build → Cart → Checkout → Order (with credits)
- [ ] Story → Illustrations → Storybook → Checkout → Order
- [ ] Payment success/failure/3DS scenarios
- [ ] Guest-to-account conversion flow

#### II.2 — Authentication Tests (P1)
- [ ] Email/password registration
- [ ] Login/logout flows
- [ ] Session migration (guest → user)
- [ ] Protected route access

#### II.3 — Asset Pipeline Tests (P1)
- [ ] Image upload (formats, sizes, quality)
- [ ] AI generation (credits, polling, errors)
- [ ] Story generation
- [ ] Rate limiting behaviour

#### II.4 — Builder Tests (P1)
- [ ] Canvas interactions (drag, scale, rotate)
- [ ] Mobile touch gestures
- [ ] Variant selection
- [ ] Mockup generation
- [ ] Quality warnings display

#### II.5 — Commerce Tests (P1)
- [ ] Cart CRUD operations
- [ ] Checkout validation
- [ ] Stripe integration
- [ ] Order creation

#### II.6 — Mobile Tests (P2)
- [ ] Responsive layouts
- [ ] Touch interactions
- [ ] Mobile checkout UX

#### II.7 — Accessibility Tests (P2)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] WCAG 2.1 AA compliance

### Browser Coverage

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✓ | ✓ (Pixel 5) |
| Firefox | ✓ | — |
| Safari | ✓ | ✓ (iPhone 13) |
| — | — | iPad Pro |

### Exit Criteria

- [ ] All P0 (Critical) tests pass on Chromium, Firefox, WebKit
- [ ] All P0 tests pass on mobile viewports
- [ ] All P1 tests pass on Chromium
- [ ] No critical accessibility violations
- [ ] Test execution time < 15 minutes
- [ ] Flaky test rate < 2%

### Tests: 93 (see 13-e2e-testing.md for breakdown)

---

## Wave III — Human Validation & Polish

**Dependencies**: Wave II complete

**Owner**: Product owner + Developer

Human walkthrough of the complete application to identify UI/UX issues, refine copy, and polish the experience before verification.

### Tasks

#### III.1 — Manual Flow Walkthrough
- [ ] Complete upload → build → cart → checkout flow
- [ ] Complete generate → build → cart → checkout flow
- [ ] Complete storybook creation flow
- [ ] Test all product types (mug, apparel, print, storybook)
- [ ] Test guest and authenticated flows
- [ ] Test on mobile devices

#### III.2 — UI Refinements
- [ ] Visual consistency audit
- [ ] Spacing and alignment fixes
- [ ] Loading state improvements
- [ ] Error state improvements
- [ ] Empty state improvements
- [ ] Animation and transition polish

#### III.3 — Copy & Content
- [ ] Review all user-facing text
- [ ] Error message clarity
- [ ] Button and CTA text
- [ ] Help text and tooltips
- [ ] Email template content

#### III.4 — Edge Cases
- [ ] Network error handling
- [ ] Session timeout handling
- [ ] Payment failure recovery
- [ ] Browser back/forward behaviour
- [ ] Refresh behaviour during flows

### Exit Criteria

- [ ] All flows completed without confusion
- [ ] UI feels polished and consistent
- [ ] Copy is clear and helpful
- [ ] Edge cases handled gracefully
- [ ] Product owner sign-off

---

# Layer 3 — Verification

**Dependencies**: Wave III complete

**Owner**: Full team + stakeholders

Final verification before production deployment.

### Tasks

#### V.1 — User Acceptance Testing (UAT)
- [ ] Stakeholder walkthrough of all flows
- [ ] Real user testing (5+ participants)
- [ ] Feedback collection and triage
- [ ] Critical bug fixes

#### V.2 — Regression Testing
- [ ] Full E2E suite green across all browsers
- [ ] Unit test suite green (target: 420+ tests)
- [ ] Performance regression check

#### V.3 — Final QA Checklist
- [ ] All copy reviewed and approved
- [ ] Legal content signed off
- [ ] Error messages user-friendly
- [ ] Loading states present everywhere
- [ ] Empty states handled gracefully
- [ ] 404/500 pages functional

#### V.4 — Security Audit
- [ ] Penetration testing (basic)
- [ ] Dependency vulnerability scan
- [ ] Environment variables secured
- [ ] No secrets in codebase
- [ ] Rate limits effective

### Exit Criteria

- [ ] UAT sign-off from stakeholders
- [ ] All critical/high bugs fixed
- [ ] No security vulnerabilities
- [ ] Documentation complete

---

# Layer 4 — Deployment

**Dependencies**: Layer 3 complete

**Owner**: DevOps / Full team

Production deployment and monitoring setup.

### Tasks

#### P.1 — Infrastructure
- [ ] Production database provisioned
- [ ] Environment variables configured
- [ ] Domain and SSL setup
- [ ] CDN configuration

#### P.2 — Monitoring
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Alert thresholds configured

#### P.3 — Deployment
- [ ] CI/CD pipeline for production
- [ ] Blue-green or canary deployment
- [ ] Database migrations tested
- [ ] Rollback procedure documented

#### P.4 — Launch Checklist
- [ ] Stripe live mode enabled
- [ ] Email provider verified
- [ ] Fulfilment API keys (Printful, Blurb) production
- [ ] Analytics tracking (privacy-compliant)
- [ ] Cookie consent banner

### Exit Criteria

- [ ] Production environment stable
- [ ] Monitoring alerts configured
- [ ] Launch checklist complete
- [ ] Team on-call rotation set

---

# Parallel Execution Timeline

```
Week 1-2:   ████████████████████████████████████████████
            Wave 0 — Foundation (ALL TEAM)

Week 3-5:   ████████████████  ████████████████  ████████████████
            Workstream A      Workstream B      Workstream C
            Asset Pipeline    Product Builder   Commerce Stack
            (Dev 1)           (Dev 2)           (Dev 3)

Week 6:     ████████████████████████████████████████████
            Wave I — Integration (ALL TEAM)

Week 7-8:   ████████████████████████  ████████████████████████
            Workstream D              Workstream E
            Fulfilment                Polish & QA
            (Dev 1 + Dev 3)           (Dev 2 + QA)

Week 9:     ████████████████████████████████████████████
            Wave II — E2E Testing (ALL TEAM)
            Playwright tests, cross-browser, mobile

Week 10:    ████████████████████████████████████████████
            Layer 3 — Verification (ALL TEAM)
            UAT, bug fixes, security audit

Week 11:    ████████████████████████████████████████████
            Layer 4 — Deployment (ALL TEAM)
            Production setup, monitoring, launch
```

---

# Workstream Dependencies Matrix

| Workstream | Depends On | Blocks |
|------------|------------|--------|
| Wave 0 | — | A, B, C |
| A (Assets) | Wave 0 | Wave I |
| B (Builder) | Wave 0 | Wave I |
| C (Commerce) | Wave 0 | Wave I |
| Wave I | A, B, C | D, E |
| D (Fulfilment) | Wave I | Wave II |
| E (Polish) | Wave I | Wave II |
| Wave II (E2E) | D, E | Wave III |
| Wave III (Human Polish) | Wave II | Layer 3 |
| Layer 3 (Verification) | Wave III | Layer 4 |
| Layer 4 (Deployment) | Layer 3 | — |

---

# Sync Points

Teams must sync at these checkpoints:

| Checkpoint | When | Purpose |
|------------|------|---------|
| SP1 | End of Wave 0 | Verify foundations, agree on interfaces |
| SP2 | Mid A/B/C | Demo progress, resolve blockers |
| SP3 | End of A/B/C | Pre-integration review |
| SP4 | End of Wave I | Full flow demo |
| SP5 | End of D/E | Pre-E2E testing review |
| SP6 | End of Wave II | E2E results review, bug triage |
| SP7 | End of Layer 3 | UAT sign-off, go/no-go decision |
| SP8 | Post-Launch | Launch retrospective |

---

# Interface Contracts

To enable parallel work, these interfaces must be agreed in Wave 0:

### Asset Interface
```typescript
interface Asset {
  id: string;
  storageUrl: string;
  width: number;
  height: number;
  source: 'UPLOAD' | 'GENERATED';
}
```

### Configuration Interface
```typescript
interface ProductConfiguration {
  id: string;
  productId: string;
  variantId: string;
  assetId: string;
  customisation: {
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  };
  mockupUrl: string;
}
```

### Cart Item Interface
```typescript
interface CartItem {
  id: string;
  configurationId: string;
  quantity: number;
  unitPricePence: number;
}
```

### Order Interface
```typescript
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  trackingToken: string;
}
```

---

# Test Targets by Workstream

### Unit & Integration Tests (Vitest)

| Workstream | Unit | Integration | Total |
|------------|------|-------------|-------|
| Wave 0 | 30 | 15 | 45 |
| A (Assets) | 50 | 25 | 75 |
| B (Builder) | 40 | 25 | 65 |
| C (Commerce) | 50 | 30 | 80 |
| Wave I | 10 | 15 | 25 |
| D (Fulfilment) | 30 | 25 | 55 |
| E (Polish) | 10 | 10 | 20 |
| **Subtotal** | **220** | **145** | **365** |

### E2E Tests (Playwright) — Wave II

| Category | Tests | Priority |
|----------|-------|----------|
| Critical User Journeys | 15 | P0 |
| Authentication | 12 | P1 |
| Asset Pipeline | 15 | P1 |
| Product Builder | 18 | P1 |
| Commerce | 15 | P1 |
| Mobile | 8 | P2 |
| Accessibility | 10 | P2 |
| **Subtotal** | **93** | — |

### Grand Total: 458 tests

See `13-e2e-testing.md` for full E2E test specification.

---

# Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Interface mismatch | Define contracts in Wave 0, enforce with TypeScript |
| Integration delays | Daily standups during Wave I, pair programming |
| Single point of failure | Document everything, no knowledge silos |
| Scope creep | Strict out-of-scope enforcement |
| AI costs | Credit system limits exposure; monitor daily |

---

# Environment Variables Required

```bash
# Database
DATABASE_URL=xxx
DIRECT_URL=xxx

# Authentication
SESSION_SECRET=xxx
APP_URL=xxx

# Payments
STRIPE_SECRET_KEY=xxx
STRIPE_PUBLISHABLE_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# AI Providers
AI_IMAGE_PROVIDER=replicate
REPLICATE_API_TOKEN=xxx
OPENAI_API_KEY=xxx

# Fulfilment
PRINTFUL_API_KEY=xxx
PRINTFUL_WEBHOOK_SECRET=xxx
BLURB_API_KEY=xxx
BLURB_WEBHOOK_SECRET=xxx

# Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx

# Email
EMAIL_FROM=noreply@aiprintly.co.uk
RESEND_API_KEY=xxx

# Monitoring
SENTRY_DSN=xxx
```

---

# Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Users complete creation | >60% of started |
| Conversion (create → purchase) | >5% |
| Order fulfilment success | >95% |
| Customer satisfaction | >4/5 |
| Refund rate | <5% |
| Page load time | <3s |
| Lighthouse score | >90 |

---

*Last updated: 2026-01-20*
