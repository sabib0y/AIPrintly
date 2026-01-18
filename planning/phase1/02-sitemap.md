# Phase 1 Sitemap

Complete route structure for AIPrintly using Remix file-based routing.

---

## Public Pages

### Marketing & Browse

- `/` — Landing page (hero, product showcase, CTA)
- `/products` — Product category listing
- `/products/mugs` — Mugs and drinkware
- `/products/apparel` — T-shirts, hoodies, kids clothing
- `/products/prints` — Art prints, posters, canvas, framed
- `/products/storybooks` — Storybook overview and examples

### Legal

- `/privacy` — Privacy policy
- `/terms` — Terms and conditions
- `/cookies` — Cookie policy
- `/returns` — Returns and refunds policy
- `/delivery` — Delivery information (UK only)

---

## Creation Flow

### Entry Points

- `/create` — Creation hub (choose upload or generate)
- `/create/upload` — Image upload page

### AI Generation

- `/create/generate` — Generation hub (choose image or story)
- `/create/generate/image` — AI image generation wizard
- `/create/generate/story` — AI story generation wizard

---

## Product Builder

### Builder Routes

- `/build` — Builder entry (redirects based on asset type)
- `/build/mug` — Mug customisation (position, preview)
- `/build/apparel` — Apparel customisation (size, colour, position)
- `/build/print` — Print customisation (size, frame, finish)
- `/build/storybook` — Storybook builder (page editor, preview)

---

## Cart & Checkout

- `/cart` — Shopping cart
- `/checkout` — Checkout flow (Stripe redirect)
- `/checkout/success` — Post-payment success page
- `/checkout/cancelled` — Payment cancelled/abandoned

---

## Order Tracking

- `/orders/$orderId` — Public order tracking (token-based access)

**Note**: Order tracking is accessible via a unique token in the URL or email link. No authentication required for viewing order status.

---

## Authentication

- `/login` — Email capture for magic link
- `/login/verify` — Magic link verification (redirects to `/account`)
- `/register` — Registration form (email + password)
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset form (with token)
- `/logout` — Logout action (clears session)

---

## Account (Authenticated)

- `/account` — Account overview (minimal in Phase 1)

**Note**: Full account features (order history, saved designs) are out of scope for Phase 1. Account page exists primarily for checkout flow completion.

---

## System Pages

- `/not-found` — 404 page (custom)
- `/error` — 500 error page (custom)

---

## Resource Routes (API-like)

These routes return JSON or perform actions without rendering a page.

### Asset Management

- `POST /api/assets/upload` — Upload image, return asset ID
- `GET /api/assets/$assetId` — Get asset metadata
- `DELETE /api/assets/$assetId` — Delete asset

### AI Generation

- `POST /api/generate/image` — Start image generation job
- `GET /api/generate/image/$jobId` — Poll generation status
- `POST /api/generate/story` — Start story generation job
- `GET /api/generate/story/$jobId` — Poll generation status

### Product Configuration

- `POST /api/configurations` — Create product configuration
- `GET /api/configurations/$configId` — Get configuration
- `PATCH /api/configurations/$configId` — Update configuration
- `DELETE /api/configurations/$configId` — Delete configuration

### Mockups

- `POST /api/mockups/generate` — Generate product mockup
- `GET /api/mockups/$mockupId` — Get mockup image

### Cart

- `GET /api/cart` — Get current cart
- `POST /api/cart/items` — Add item to cart
- `PATCH /api/cart/items/$itemId` — Update cart item quantity
- `DELETE /api/cart/items/$itemId` — Remove item from cart
- `DELETE /api/cart` — Clear cart

### Checkout

- `POST /api/checkout/create-session` — Create Stripe Checkout session
- `POST /api/webhooks/stripe` — Stripe webhook handler

### Orders

- `GET /api/orders/$orderId` — Get order details (with token)
- `POST /api/webhooks/printful` — Printful fulfilment webhook
- `POST /api/webhooks/blurb` — Blurb fulfilment webhook

### Authentication

- `POST /api/auth/login` — Send magic link
- `POST /api/auth/verify` — Verify magic link token
- `POST /api/auth/register` — Create account
- `POST /api/auth/forgot-password` — Send password reset
- `POST /api/auth/reset-password` — Reset password
- `POST /api/auth/logout` — Logout

---

## Remix File Structure

```
app/
├── routes/
│   ├── _index.tsx                      # /
│   ├── products._index.tsx             # /products
│   ├── products.mugs.tsx               # /products/mugs
│   ├── products.apparel.tsx            # /products/apparel
│   ├── products.prints.tsx             # /products/prints
│   ├── products.storybooks.tsx         # /products/storybooks
│   │
│   ├── create._index.tsx               # /create
│   ├── create.upload.tsx               # /create/upload
│   ├── create.generate._index.tsx      # /create/generate
│   ├── create.generate.image.tsx       # /create/generate/image
│   ├── create.generate.story.tsx       # /create/generate/story
│   │
│   ├── build._index.tsx                # /build
│   ├── build.mug.tsx                   # /build/mug
│   ├── build.apparel.tsx               # /build/apparel
│   ├── build.print.tsx                 # /build/print
│   ├── build.storybook.tsx             # /build/storybook
│   │
│   ├── cart.tsx                        # /cart
│   ├── checkout._index.tsx             # /checkout
│   ├── checkout.success.tsx            # /checkout/success
│   ├── checkout.cancelled.tsx          # /checkout/cancelled
│   │
│   ├── orders.$orderId.tsx             # /orders/$orderId
│   │
│   ├── login._index.tsx                # /login
│   ├── login.verify.tsx                # /login/verify
│   ├── register.tsx                    # /register
│   ├── forgot-password.tsx             # /forgot-password
│   ├── reset-password.tsx              # /reset-password
│   ├── logout.tsx                      # /logout
│   │
│   ├── account.tsx                     # /account
│   │
│   ├── privacy.tsx                     # /privacy
│   ├── terms.tsx                       # /terms
│   ├── cookies.tsx                     # /cookies
│   ├── returns.tsx                     # /returns
│   ├── delivery.tsx                    # /delivery
│   │
│   └── api/
│       ├── assets.upload.tsx           # POST /api/assets/upload
│       ├── assets.$assetId.tsx         # GET/DELETE /api/assets/$assetId
│       ├── generate.image.tsx          # POST /api/generate/image
│       ├── generate.image.$jobId.tsx   # GET /api/generate/image/$jobId
│       ├── generate.story.tsx          # POST /api/generate/story
│       ├── generate.story.$jobId.tsx   # GET /api/generate/story/$jobId
│       ├── configurations._index.tsx   # POST /api/configurations
│       ├── configurations.$configId.tsx # GET/PATCH/DELETE
│       ├── mockups.generate.tsx        # POST /api/mockups/generate
│       ├── mockups.$mockupId.tsx       # GET /api/mockups/$mockupId
│       ├── cart._index.tsx             # GET/DELETE /api/cart
│       ├── cart.items.tsx              # POST /api/cart/items
│       ├── cart.items.$itemId.tsx      # PATCH/DELETE
│       ├── checkout.create-session.tsx # POST
│       ├── webhooks.stripe.tsx         # POST
│       ├── webhooks.printful.tsx       # POST
│       ├── webhooks.blurb.tsx          # POST
│       ├── orders.$orderId.tsx         # GET
│       ├── auth.login.tsx              # POST
│       ├── auth.verify.tsx             # POST
│       ├── auth.register.tsx           # POST
│       ├── auth.forgot-password.tsx    # POST
│       ├── auth.reset-password.tsx     # POST
│       └── auth.logout.tsx             # POST
```

---

## Route Layouts

### Root Layout (`app/root.tsx`)

- Global styles (Tailwind)
- Header with navigation
- Footer with legal links
- Toast notifications
- Session provider

### Marketing Layout

Shared layout for public pages with consistent header/footer.

### Builder Layout (`app/routes/build.tsx`)

Parent route for all builder pages:
- Sidebar with asset preview
- Main content area
- Progress indicator
- "Add to Cart" floating action

### Account Layout (`app/routes/account.tsx`)

Authenticated layout (minimal for Phase 1).

---

## Access Control Summary

| Route Pattern | Access |
|---------------|--------|
| `/` to `/products/*` | Public |
| `/create/*` | Public (guest session created) |
| `/build/*` | Public (guest session created) |
| `/cart` | Public (session-based) |
| `/checkout/*` | Public → Account required at payment |
| `/orders/$orderId` | Public (token in URL or cookie) |
| `/login`, `/register` | Public |
| `/account` | Authenticated only |
| `/api/*` | Mixed (see individual routes) |

---

## Session Handling

- **Guest Sessions**: Created automatically on first interaction with `/create` or `/cart`
- **Session Migration**: Guest cart/assets transferred to account on registration
- **Cookie**: `aiprintly_session` (HttpOnly, Secure, SameSite=Lax)
- **Duration**: 7 days rolling, extended on activity

---

*Last updated: 2025-01-18*
