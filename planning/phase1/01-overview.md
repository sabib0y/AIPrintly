# Phase 1 Overview

AIPrintly Phase 1 is the **MVP launch** that validates the core value proposition: users can generate or upload content and turn it into real, shippable products.

## Core Deliverables

- Landing page with product showcase
- Image upload functionality
- AI image generation (multiple styles/themes)
- AI story generation (for storybooks)
- Product builder with live preview
- Shopping cart
- Stripe checkout
- Order confirmation and tracking
- Printful integration (mugs, apparel, prints)
- Blurb integration (storybooks)

## User Journey Overview

```
User arrives at landing page
    │
    ├── Browse product categories
    │
    └── Start creating
            │
            ├── Upload image
            │       │
            │       └── Image processed and stored
            │
            └── Generate with AI
                    │
                    ├── Select style/theme
                    ├── Enter prompt or upload reference
                    └── AI generates image(s)
            │
            ▼
    Select product type
            │
            ├── Mug / Apparel
            ├── Print / Poster / Canvas
            └── Storybook
            │
            ▼
    Customise product
            │
            ├── Position/scale image
            ├── Select options (size, colour, frame)
            └── Preview mockup
            │
            ▼
    Add to cart
            │
            ▼
    Checkout (Stripe)
            │
            ├── Create account (if guest)
            ├── Enter shipping address (UK only)
            └── Payment
            │
            ▼
    Order confirmed
            │
            ├── Sent to fulfilment (Printful/Blurb)
            └── Tracking updates via email
```

## Product Categories

### 1. Mugs & Drinkware
- Standard 11oz mug
- 15oz mug
- Travel mug
- **Fulfilment**: Printful

### 2. Apparel
- T-shirts (unisex, fitted)
- Hoodies
- Kids clothing
- **Fulfilment**: Printful

### 3. Art Prints & Posters
- Photo prints (various sizes)
- Posters
- Canvas prints
- Framed prints
- **Fulfilment**: Printful

### 4. Storybooks
- Softcover picture book
- Hardcover picture book
- Custom page count (8-40 pages)
- **Fulfilment**: Blurb

## AI Generation Capabilities

### Image Generation
- **Styles**: Fantasy, Cartoon, Watercolour, Pop Art, Realistic, Anime
- **Use cases**: Portraits, family photos, pets, landscapes, abstract
- **Output**: High-resolution (2048x2048 minimum for print)

### Story Generation
- **Input**: Child's name, age, interests, photo (optional)
- **Output**: 8-20 page story with prompts for illustrations
- **Themes**: Adventure, magic, friendship, learning

## Pricing Model (Phase 1)

- **AI Generation**: Included in product price (no separate charge)
- **Products**: Priced per item with margin over fulfilment cost
- **Shipping**: Calculated at checkout via fulfilment partner rates

Example pricing:
| Product | Base Cost | Selling Price | Margin |
|---------|-----------|---------------|--------|
| 11oz Mug | £6.50 | £14.99 | £8.49 |
| T-shirt | £8.00 | £19.99 | £11.99 |
| A3 Poster | £4.50 | £12.99 | £8.49 |
| Storybook (soft) | £12.00 | £24.99 | £12.99 |

## Guiding Principles

1. **Magical Experience**: Every interaction should feel delightful
2. **Mobile-First**: Designed for phones, works everywhere
3. **Trust & Transparency**: Clear pricing, delivery times, refund policy
4. **Quality Over Quantity**: Fewer products, done well
5. **Accessible**: Simple enough for non-technical users

## Success Metrics (MVP)

- Users complete at least one product creation
- Conversion rate from creation to purchase > 5%
- Order fulfilment success rate > 95%
- Customer satisfaction score > 4/5
- Refund rate < 5%

## Explicitly Out of Scope (Phase 1)

- User profiles and order history viewing
- Saved designs / design library
- Subscriptions or credits
- International shipping
- Bulk ordering
- Gift cards
- Affiliate/referral programme
