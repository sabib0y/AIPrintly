# Out of Scope (Phase 1)

Explicit exclusions for Phase 1 MVP to maintain focus and delivery speed.

---

## Purpose

This document clearly defines what is **not** included in Phase 1. These features may be considered for future phases but are explicitly excluded from the MVP scope.

---

## User Accounts & Profiles

### Excluded

- **User profiles** — No profile page, avatar, bio, or public profile
- **Order history** — No "My Orders" page (use email links for tracking)
- **Saved designs** — No "My Designs" or "Favourites" functionality
- **Design library** — No ability to save, organise, or revisit past creations
- **Social login** — No Google, Apple, or Facebook authentication (email/password only)
- **Account settings** — No password change, email change, or notification preferences

### Included

- Basic account creation (email + password)
- Magic link login
- Session-based cart/asset persistence
- Order tracking via token link

---

## Payments & Pricing

### Excluded

- **Subscriptions** — No recurring billing or membership tiers
- **Credits purchase** — No ability to buy additional AI credits (Phase 1 has free allowance only)
- **Gift cards** — No gift card purchase or redemption
- **Multiple payment methods** — Stripe cards only (no PayPal, Klarna, Apple Pay)
- **Discount codes** — No promo codes or coupon system
- **Bulk pricing** — No volume discounts
- **Currency selection** — GBP only

### Included

- One-time purchases via Stripe Checkout
- Free AI generation credits (limited)
- Fixed product pricing

---

## Shipping & Delivery

### Excluded

- **International shipping** — UK only in Phase 1
- **Multiple shipping addresses** — One address per order
- **Gift wrapping** — No gift wrap option
- **Gift messages** — No custom gift notes
- **Click & collect** — No collection points
- **Scheduled delivery** — No delivery date selection
- **Split shipments** — Orders ship complete or not at all

### Included

- UK mainland delivery
- Standard and express shipping options
- Order tracking with carrier links

---

## Product Features

### Excluded

- **Bulk ordering** — No quantity discounts or B2B ordering
- **Product bundles** — No pre-configured bundles or sets
- **Custom text** — No text overlay on products (image only)
- **Multiple images per product** — Single image placement only
- **Background removal** — No automatic background removal tool
- **Image editing** — No crop, filter, or enhancement tools (upload as-is)
- **Product recommendations** — No "You might also like" suggestions

### Included

- Four product categories: Mugs, Apparel, Prints, Storybooks
- Single image upload or AI generation
- Position, scale, rotate customisation
- Variant selection (size, colour)

---

## AI Features

### Excluded

- **Voice prompts** — No speech-to-text for prompts
- **Image-to-image editing** — No inpainting or outpainting
- **Style transfer** — No "apply this style to my photo"
- **Face swap** — No face replacement features
- **Photo enhancement** — No AI upscaling or restoration
- **Batch generation** — No generating multiple unrelated images at once
- **Custom model training** — No fine-tuning on user images

### Included

- Text-to-image generation with style presets
- Story generation with illustration prompts
- 4 variations per image generation
- Story text editing

---

## Storybook Features

### Excluded

- **Advanced story editing** — No full WYSIWYG editor
- **Custom fonts** — Standard font only
- **Multiple characters** — Single protagonist stories
- **Page reordering** — Fixed page sequence
- **Illustration styles per page** — Consistent style throughout
- **Audio narration** — No read-aloud feature
- **Interactive elements** — No clickable or animated pages

### Included

- AI story generation
- AI illustration generation
- Basic text editing per page
- Image replacement per page
- Preview flip-through

---

## Marketing & Growth

### Excluded

- **Affiliate programme** — No referral commissions
- **Referral rewards** — No credits for referring friends
- **Loyalty points** — No points accumulation system
- **Wishlist** — No save-for-later functionality
- **Share to social** — No direct social media sharing
- **Reviews & ratings** — No product reviews
- **User-generated content** — No customer gallery or showcase

### Included

- Email marketing opt-in at checkout
- Basic SEO and meta tags

---

## Admin & Operations

### Excluded

- **Admin dashboard** — No internal admin panel (use Printful/Blurb/Stripe dashboards)
- **Analytics dashboard** — Use third-party analytics (Plausible, Mixpanel)
- **Inventory management** — Printful manages stock
- **Supplier management** — Fixed supplier integrations
- **Content moderation** — Basic automated filters only
- **A/B testing** — No built-in experimentation

### Included

- Webhook handling for order updates
- Basic error logging (Sentry)
- Email notifications

---

## Platform & Technical

### Excluded

- **Mobile app** — Web only (mobile-responsive)
- **Offline mode** — No offline functionality
- **Push notifications** — Email only
- **Real-time chat support** — Email support only
- **Multi-language** — English only
- **Accessibility audit** — Basic accessibility, no formal WCAG audit
- **API for third parties** — No public API

### Included

- Responsive web design
- SEO-friendly pages
- Basic accessibility (semantic HTML, keyboard nav)

---

## Legal & Compliance

### Excluded

- **COPPA compliance** — No specific under-13 protections
- **Cookie consent banner** — Basic policy page only (Phase 1.5 consideration)
- **GDPR data export** — No automated data export (manual on request)
- **Terms version tracking** — No consent versioning
- **Age verification** — No age gates

### Included

- Privacy policy
- Terms and conditions
- Cookie policy
- Basic GDPR data deletion on request

---

## Content Quality (Deferred Enhancements)

The following were identified as pain point mitigations but are deferred to Phase 1.5:

### Excluded from Phase 1.0

- **AI upscaling** — No automatic image enhancement
- **NSFW detection** — Basic keyword filtering only
- **Copyright/brand detection** — No logo matching
- **Artefact detection** — No AI quality scoring (e.g., 6-finger hands)
- **Live chat support** — Email only

### Included in Phase 1.0

- DPI/resolution warnings
- Print boundary warnings
- Basic content filtering
- Quality confirmation prompts

---

## Summary Table

| Category | In Scope | Out of Scope |
|----------|----------|--------------|
| Auth | Email/password, magic link | Social login, profiles |
| Payments | Stripe, GBP, one-time | Subscriptions, gift cards |
| Shipping | UK only | International, gift wrap |
| Products | 4 categories, single image | Bundles, custom text |
| AI | Text-to-image, stories | Image editing, voice |
| Storybooks | Basic editor | WYSIWYG, audio |
| Marketing | Email opt-in | Affiliates, reviews |
| Admin | Webhooks, logging | Dashboard, analytics |
| Platform | Web, responsive | Mobile app, offline |

---

## Phase 2+ Considerations

These features are candidates for future phases:

### High Priority (Phase 2)

- Order history page
- Saved designs
- Credit purchase
- Cookie consent banner
- Basic admin dashboard

### Medium Priority (Phase 3+)

- International shipping
- Social login
- Discount codes
- Product recommendations
- AI upscaling

### Low Priority (Future)

- Mobile app
- Subscriptions
- Affiliate programme
- Multi-language support
- B2B/bulk ordering

---

*Last updated: 2025-01-18*
