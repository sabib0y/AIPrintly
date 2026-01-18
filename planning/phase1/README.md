# AIPrintly — Phase 1 Plan

This folder contains the planning and specification documents for Phase 1 (MVP) of the AIPrintly platform.

## Project Vision

AIPrintly is a UK-first consumer platform where users can:
- Generate unique, themed content using AI (images, stories)
- Upload their own images/artwork
- Transform that content into real, shippable physical products

**Tagline**: *"Imagine it. Create it. Hold it."*

## Key Architecture Decisions

### Authentication Model

- **Guest Sessions**: Users can create and preview without signing up
- **Account Creation**: Required at checkout (email + password or OAuth)
- **Session Persistence**: Guest creations stored in session, migrated to account on signup

### Product Flow Model

```
Content (Upload/Generate)
    └── Asset (stored image/text)
          └── Product Configuration (asset + product type + options)
                └── Cart Item
                      └── Order
                            └── Fulfilment (Printful/Blurb)
```

### Fulfilment Strategy

- **Printful**: Mugs, apparel, photo prints, posters, canvas
- **Blurb**: Storybooks (high-quality book printing)
- Both support UK fulfilment with API integration

### AI Providers

- **Image Generation**: Replicate (Stable Diffusion XL) or OpenAI DALL-E 3
- **Story Generation**: OpenAI GPT-4 or Claude
- Provider-agnostic interface for easy swapping

## Phase 1 Scope

This phase focuses on:

- Public landing and product browsing
- Image upload and AI generation
- Product preview and customisation
- Cart and checkout (Stripe)
- Order tracking
- Printful integration (merch + prints)
- Blurb integration (storybooks)
- UK shipping only

## Out of Scope (Phase 1)

- User accounts with profiles/history (minimal auth only)
- Subscriptions or credits system
- Global shipping
- Mobile app
- User-generated storefronts
- Advanced story editing tools

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | `01-overview.md` | Core deliverables, user journey, guiding principles |
| 02 | `02-sitemap.md` | Complete route/URL structure |
| 03 | `03-data-model.md` | Database schema and relationships |
| 04 | `04-user-flows.md` | Detailed user journey flows |
| 05 | `05-ai-generation.md` | AI image and story generation specs |
| 06 | `06-fulfilment-integration.md` | Printful and Blurb API integration |
| 07 | `07-product-builder.md` | Preview, customisation, mockup generation |
| 08 | `08-checkout-and-orders.md` | Payment, order processing, tracking |
| 09 | `09-out-of-scope.md` | Explicit exclusions for Phase 1 |
| 10 | `10-roadmap.md` | Phased delivery plan with waves |
| 11 | `11-tech-stack-recommendation.md` | Technology choices and justification |

## Tech Stack

- **Framework**: Remix (React Router v7)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Supabase or Neon)
- **ORM**: Prisma
- **Payments**: Stripe Checkout
- **File Storage**: Cloudflare R2 or AWS S3
- **Image Processing**: Sharp + Canvas API
- **AI**: Replicate API (images) + OpenAI API (text)
- **Deployment**: Fly.io or Cloudflare Pages

### Why Remix?

- **Nested routing**: Natural fit for builder flows with shared layouts
- **Loaders/Actions**: Server-side data loading without client waterfalls
- **Progressive enhancement**: Forms work without JS, enhanced with it
- **Edge deployment**: First-class Cloudflare Workers support
- **Session handling**: Built-in cookie session management
- **Streaming**: Native support for streaming responses (good for AI generation)

## Environment Variables (Expected)

```bash
# Database
DATABASE_URL=xxx

# Authentication
SESSION_SECRET=xxx

# Payments
STRIPE_SECRET_KEY=xxx
STRIPE_PUBLISHABLE_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# AI Providers
REPLICATE_API_TOKEN=xxx
OPENAI_API_KEY=xxx

# Fulfilment
PRINTFUL_API_KEY=xxx
BLURB_API_KEY=xxx

# Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx

# App
APP_URL=xxx
```

---

*Last updated: 2025-01-18*
