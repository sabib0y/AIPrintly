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
| 2. Build (Workstreams A-E) | 🔜 Not started |
| 3. Verification | 🔜 Not started |
| 4. Deployment | 🔜 Not started |

**Overall Progress**: ~10% (planning complete)

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
                    │  Connect workstreams + E2E flows    │
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
            Layer 3 — Verification (ALL TEAM)

Week 10:    ████████████████████████████████████████████
            Layer 4 — Deployment (ALL TEAM)
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
| D (Fulfilment) | Wave I | — |
| E (Polish) | Wave I | — |

---

# Sync Points

Teams must sync at these checkpoints:

| Checkpoint | When | Purpose |
|------------|------|---------|
| SP1 | End of Wave 0 | Verify foundations, agree on interfaces |
| SP2 | Mid A/B/C | Demo progress, resolve blockers |
| SP3 | End of A/B/C | Pre-integration review |
| SP4 | End of Wave I | Full flow demo |
| SP5 | End of D/E | Pre-verification review |

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

| Workstream | Unit | Integration | E2E | Total |
|------------|------|-------------|-----|-------|
| Wave 0 | 30 | 15 | 5 | 50 |
| A (Assets) | 50 | 25 | 5 | 80 |
| B (Builder) | 40 | 25 | 5 | 70 |
| C (Commerce) | 50 | 30 | 10 | 90 |
| Wave I | 10 | 15 | 15 | 40 |
| D (Fulfilment) | 30 | 25 | 5 | 60 |
| E (Polish) | 10 | 10 | 10 | 30 |
| **Total** | **220** | **145** | **55** | **420** |

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

*Last updated: 2025-01-18*
