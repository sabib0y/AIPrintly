# User Flows (Phase 1)

Detailed user journey flows for AIPrintly MVP with ASCII diagrams.

---

## Flow 1: Image Upload

User uploads their own image for product customisation.

```
┌─────────────────────────────────────────────────────────────────┐
│                        IMAGE UPLOAD FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User visits /create/upload
        │
        ▼
┌───────────────────┐
│   Upload Widget   │
│  (drag & drop)    │
└───────────────────┘
        │
        ▼
    [Select file]
        │
        ├── File too large (>25MB) ──► Show error, suggest resize
        │
        ├── Invalid format ──► Show error, list accepted formats
        │
        └── Valid file
                │
                ▼
        ┌───────────────────┐
        │   Client-side     │
        │   validation      │
        │   - dimensions    │
        │   - format check  │
        └───────────────────┘
                │
                ▼
        POST /api/assets/upload
                │
                ▼
        ┌───────────────────┐
        │   Server-side     │
        │   processing      │
        │   - Sharp resize  │
        │   - R2 upload     │
        │   - Create Asset  │
        └───────────────────┘
                │
                ▼
        Return asset ID + preview URL
                │
                ▼
        ┌───────────────────┐
        │   Show preview    │
        │   + quality hints │
        │   + "Continue"    │
        └───────────────────┘
                │
                ▼
        Redirect to /build?asset={id}
```

### Accepted Formats

- JPEG, PNG, WebP, HEIC
- Minimum 1000×1000px recommended
- Maximum 25MB file size

### Quality Hints

Display helpful feedback based on image analysis:
- "Great quality! Perfect for large prints."
- "This image may appear pixelated on large products. Consider smaller items."
- "Low resolution detected. Best suited for mugs or small prints."

---

## Flow 2: AI Image Generation

User generates a custom image using AI.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI IMAGE GENERATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

User visits /create/generate/image
        │
        ▼
┌───────────────────┐
│   Style Picker    │
│  - Fantasy        │
│  - Cartoon        │
│  - Watercolour    │
│  - Pop Art        │
│  - Realistic      │
│  - Anime          │
└───────────────────┘
        │
        ▼
    [Select style]
        │
        ▼
┌───────────────────┐
│   Prompt Input    │
│   - Text prompt   │
│   - Reference     │
│     upload (opt)  │
└───────────────────┘
        │
        ▼
    [Click "Generate"]
        │
        ▼
POST /api/generate/image
        │
        ▼
┌───────────────────┐
│   Create job      │
│   status: PENDING │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Loading state   │
│   with progress   │
│   (~15-30 secs)   │
└───────────────────┘
        │
        ├── Poll GET /api/generate/image/{jobId}
        │
        ├── status: PROCESSING ──► Continue polling
        │
        ├── status: FAILED ──► Show error + retry option
        │
        └── status: COMPLETED
                │
                ▼
        ┌───────────────────┐
        │   Show 4 results  │
        │   (grid view)     │
        └───────────────────┘
                │
                ├── [Regenerate] ──► New job
                │
                └── [Select image]
                        │
                        ▼
                Create Asset from selection
                        │
                        ▼
                Redirect to /build?asset={id}
```

### Style Presets

| Style | Description | Prompt Modifier |
|-------|-------------|-----------------|
| Fantasy | Magical, ethereal scenes | "fantasy art style, magical lighting" |
| Cartoon | Fun, animated look | "cartoon style, bold outlines" |
| Watercolour | Soft, artistic feel | "watercolour painting, soft edges" |
| Pop Art | Bold, vibrant colours | "pop art style, bold colours" |
| Realistic | Photo-like quality | "photorealistic, detailed" |
| Anime | Japanese animation style | "anime style, detailed eyes" |

### Generation Parameters

- Output: 4 variations per generation
- Resolution: 2048×2048 (suitable for print)
- Provider: Replicate (SDXL) or OpenAI DALL-E 3

---

## Flow 3: AI Story Generation

User creates a personalised storybook with AI-generated text and illustrations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI STORY GENERATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

User visits /create/generate/story
        │
        ▼
┌───────────────────────────────────────┐
│   Story Setup Form                    │
│   - Child's name (required)           │
│   - Child's age (optional)            │
│   - Theme selection                   │
│   - Interests/hobbies (optional)      │
│   - Reference photo (optional)        │
└───────────────────────────────────────┘
        │
        ▼
    [Click "Create Story"]
        │
        ▼
POST /api/generate/story
        │
        ▼
┌───────────────────────────────────────┐
│   GPT-4 generates:                    │
│   - Story outline (8-20 pages)        │
│   - Text for each page                │
│   - Illustration prompts per page     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│   Story Preview                       │
│   (text only, no illustrations yet)   │
│                                       │
│   [Edit] [Regenerate] [Continue]      │
└───────────────────────────────────────┘
        │
        ├── [Edit] ──► Inline text editing
        │
        ├── [Regenerate] ──► New story
        │
        └── [Continue to Illustrations]
                │
                ▼
        ┌───────────────────────────────┐
        │   Generate illustrations      │
        │   (one per page, queued)      │
        │   ~30 secs per image          │
        └───────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────┐
        │   Full storybook preview      │
        │   with text + images          │
        │                               │
        │   [Edit pages] [Continue]     │
        └───────────────────────────────┘
                │
                ▼
        Redirect to /build/storybook?project={id}
```

### Story Themes

| Theme | Description |
|-------|-------------|
| Adventure | Exploration, quests, discovery |
| Magic | Wizards, spells, enchanted worlds |
| Friendship | Making friends, teamwork |
| Learning | Educational, life lessons |
| Animals | Animal friends, nature |
| Space | Astronauts, planets, aliens |

### Story Structure

```json
{
  "title": "Emma's Magical Adventure",
  "pages": [
    {
      "pageNumber": 1,
      "type": "cover",
      "text": "Emma's Magical Adventure",
      "illustrationPrompt": "A young girl with brown hair standing at the entrance of an enchanted forest, magical sparkles in the air"
    },
    {
      "pageNumber": 2,
      "type": "content",
      "text": "Once upon a time, in a cosy little house...",
      "illustrationPrompt": "Cozy cottage interior with warm lighting, a child looking out the window at a magical forest"
    }
  ]
}
```

---

## Flow 4: Product Builder (Mug/Apparel/Print)

User customises a product with their asset.

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCT BUILDER FLOW                       │
└─────────────────────────────────────────────────────────────────┘

User arrives at /build?asset={id}
        │
        ▼
┌───────────────────────────────────────┐
│   Product Selection                   │
│   - Mugs                              │
│   - Apparel                           │
│   - Prints                            │
│   - Storybooks                        │
└───────────────────────────────────────┘
        │
        ▼
    [Select product category]
        │
        ├── Mug ──► /build/mug?asset={id}
        │
        ├── Apparel ──► /build/apparel?asset={id}
        │
        └── Print ──► /build/print?asset={id}

                │
                ▼
        ┌───────────────────────────────┐
        │   Variant Selection           │
        │   - Size (apparel/print)      │
        │   - Colour (apparel/mug)      │
        │   - Style (frame/finish)      │
        └───────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────┐
        │   Customisation Canvas        │
        │   ┌─────────────────────┐     │
        │   │                     │     │
        │   │   [Image Preview]   │     │
        │   │   • Drag to move    │     │
        │   │   • Pinch to zoom   │     │
        │   │   • Rotate handle   │     │
        │   │                     │     │
        │   └─────────────────────┘     │
        │                               │
        │   Controls:                   │
        │   [Zoom -] [Zoom +] [Reset]   │
        │   [Rotate] [Flip]             │
        └───────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────┐
        │   Live Mockup Preview         │
        │   (generated via Printful     │
        │    or client-side render)     │
        └───────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────┐
        │   Price Display               │
        │   "£14.99 + £3.99 shipping"   │
        │                               │
        │   [Add to Cart]               │
        └───────────────────────────────┘
                │
                ▼
        POST /api/configurations
                │
                ▼
        POST /api/cart/items
                │
                ▼
        Show success toast
        Option: [Continue Shopping] [View Cart]
```

### Customisation Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| position.x | Horizontal centre (0-1) | 0.5 |
| position.y | Vertical centre (0-1) | 0.5 |
| scale | Zoom level (0.5-2.0) | 1.0 |
| rotation | Degrees (-180 to 180) | 0 |
| printArea | Front, back, wrap | "front" |

---

## Flow 5: Storybook Builder

User assembles and customises their storybook.

```
┌─────────────────────────────────────────────────────────────────┐
│                     STORYBOOK BUILDER FLOW                      │
└─────────────────────────────────────────────────────────────────┘

User arrives at /build/storybook?project={id}
        │
        ▼
┌───────────────────────────────────────┐
│   Page Thumbnail Strip                │
│   [1] [2] [3] [4] ... [n]             │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│   Page Editor                         │
│   ┌─────────────────────────────────┐ │
│   │                                 │ │
│   │   [Illustration]                │ │
│   │                                 │ │
│   │   ─────────────────────         │ │
│   │                                 │ │
│   │   "Story text goes here..."     │ │
│   │   [Edit text]                   │ │
│   │                                 │ │
│   └─────────────────────────────────┘ │
│                                       │
│   [Replace Image] [Edit Text]         │
│   [Regenerate Illustration]           │
└───────────────────────────────────────┘
        │
        ├── [Replace Image] ──► Upload or generate new
        │
        ├── [Edit Text] ──► Inline editor
        │
        └── [Regenerate] ──► New AI illustration
                │
                ▼
        ┌───────────────────────────────┐
        │   Book Options                │
        │   - Cover type (soft/hard)    │
        │   - Page count confirmed      │
        │   - Dedication page (opt)     │
        └───────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────┐
│   Full Book Preview           │
        │   (flip-through view)         │
        │                               │
        │   Price: £24.99 + shipping    │
        │                               │
        │   [Add to Cart]               │
        └───────────────────────────────┘
                │
                ▼
        Generate PDF for Blurb
                │
                ▼
        POST /api/configurations
                │
                ▼
        POST /api/cart/items
```

### Storybook Specifications

| Option | Values |
|--------|--------|
| Cover | Softcover, Hardcover |
| Size | 8×8" (square) |
| Pages | 8, 12, 16, 20, 24, 32, 40 |
| Paper | Standard (100gsm), Premium (150gsm) |

---

## Flow 6: Cart and Checkout

User completes their purchase.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CART AND CHECKOUT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

User visits /cart
        │
        ▼
┌───────────────────────────────────────┐
│   Cart Summary                        │
│   ┌─────────────────────────────────┐ │
│   │ [Mockup] Product Name    £14.99 │ │
│   │          Size: L, Black         │ │
│   │          Qty: [1] [Remove]      │ │
│   ├─────────────────────────────────┤ │
│   │ [Mockup] Art Print       £12.99 │ │
│   │          A3, Framed             │ │
│   │          Qty: [1] [Remove]      │ │
│   └─────────────────────────────────┘ │
│                                       │
│   Subtotal:      £27.98               │
│   Shipping:      £4.99                │
│   ─────────────────────               │
│   Total:         £32.97               │
│                                       │
│   [Continue Shopping] [Checkout]      │
└───────────────────────────────────────┘
        │
        ▼
    [Click Checkout]
        │
        ├── Guest user?
        │       │
        │       ▼
        │   ┌───────────────────────────┐
        │   │   Account Gate            │
        │   │   "Create account to      │
        │   │    complete purchase"     │
        │   │                           │
        │   │   [Email] [Password]      │
        │   │   [Create Account]        │
        │   │                           │
        │   │   Already have account?   │
        │   │   [Log in]                │
        │   └───────────────────────────┘
        │               │
        │               ▼
        │       Create user account
        │       Link session to user
        │               │
        └───────────────┴───────────────
                        │
                        ▼
        POST /api/checkout/create-session
                        │
                        ▼
        Redirect to Stripe Checkout
                        │
                        ├── Payment cancelled ──► /checkout/cancelled
                        │
                        └── Payment successful ──► Stripe webhook
                                        │
                                        ▼
                                ┌───────────────────┐
                                │ Webhook handler   │
                                │ - Create Order    │
                                │ - Clear cart      │
                                │ - Send to Printful│
                                │ - Send to Blurb   │
                                │ - Send email      │
                                └───────────────────┘
                                        │
                                        ▼
                                /checkout/success
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │   Order Confirmation      │
                        │   Order #AIP-2025-0001    │
                        │                           │
                        │   Thank you! A confirm-   │
                        │   ation email is on its   │
                        │   way.                    │
                        │                           │
                        │   [Track Order]           │
                        └───────────────────────────┘
```

### Checkout Data Collected

- Email address
- Shipping address (UK only)
- Phone number (optional, for delivery)
- Marketing opt-in checkbox

### Shipping Calculation

Shipping rates fetched from Printful/Blurb APIs at checkout:
- Standard delivery: £3.99-£5.99 (5-7 business days)
- Express delivery: £7.99-£9.99 (2-3 business days)

---

## Flow 7: Order Tracking

Customer tracks their order status.

```
┌─────────────────────────────────────────────────────────────────┐
│                       ORDER TRACKING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

User receives order confirmation email
        │
        ├── Click "Track Order" link
        │   (includes tracking token)
        │
        └── Or visit /orders/{orderId}?token={xxx}
                │
                ▼
┌───────────────────────────────────────┐
│   Order Status Page                   │
│   Order #AIP-2025-0001                │
│                                       │
│   ┌─────────────────────────────────┐ │
│   │ Status Timeline                 │ │
│   │                                 │ │
│   │ ✓ Order placed    18 Jan 10:30  │ │
│   │ ✓ Payment received 18 Jan 10:31 │ │
│   │ ✓ In production   18 Jan 14:00  │ │
│   │ ○ Shipped                       │ │
│   │ ○ Delivered                     │ │
│   └─────────────────────────────────┘ │
│                                       │
│   Items:                              │
│   ┌─────────────────────────────────┐ │
│   │ [Mockup] Custom Mug      £14.99 │ │
│   │          Status: In production  │ │
│   │          Est. ship: 20 Jan      │ │
│   └─────────────────────────────────┘ │
│                                       │
│   Need help? support@aiprintly.co.uk  │
└───────────────────────────────────────┘
        │
        ▼
    (Order ships)
        │
        ▼
User receives shipping notification email
        │
        ▼
┌───────────────────────────────────────┐
│   Updated Order Status                │
│                                       │
│   ✓ Order placed    18 Jan 10:30     │
│   ✓ Payment received 18 Jan 10:31    │
│   ✓ In production   18 Jan 14:00     │
│   ✓ Shipped         20 Jan 09:00     │
│   ○ Delivered                        │
│                                       │
│   Tracking: RM1234567890GB            │
│   [Track with Royal Mail]             │
└───────────────────────────────────────┘
```

### Status Values

| Status | Description |
|--------|-------------|
| Order placed | Order created, awaiting payment |
| Payment received | Stripe payment successful |
| In production | Sent to Printful/Blurb, being made |
| Shipped | Package dispatched, tracking available |
| Delivered | Confirmed delivery |

### Email Notifications

1. **Order confirmation** — immediately after payment
2. **Shipped notification** — when tracking number available
3. **Delivery confirmation** — if tracking confirms delivery

---

## Flow 8: Guest-to-Account Conversion

Guest user creates an account to keep their creations.

```
┌─────────────────────────────────────────────────────────────────┐
│                   GUEST-TO-ACCOUNT CONVERSION                   │
└─────────────────────────────────────────────────────────────────┘

Guest user has:
- Session with assets
- Cart items
- Product configurations
        │
        ▼
┌───────────────────────────────────────┐
│   Trigger Points:                     │
│   - Checkout (required)               │
│   - "Save my designs" prompt          │
│   - Direct visit to /register         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│   Registration Form                   │
│                                       │
│   Email: [________________]           │
│   Password: [________________]        │
│   Confirm: [________________]         │
│                                       │
│   □ Keep me updated (marketing)       │
│                                       │
│   [Create Account]                    │
│                                       │
│   Or continue with:                   │
│   [Google] [Apple]                    │
└───────────────────────────────────────┘
        │
        ▼
POST /api/auth/register
        │
        ▼
┌───────────────────────────────────────┐
│   Server-side migration:              │
│                                       │
│   1. Create User record               │
│   2. Link Session to User             │
│   3. Update assets.user_id            │
│   4. Update configs.user_id           │
│   5. Send welcome email               │
└───────────────────────────────────────┘
        │
        ▼
Redirect to previous page or /checkout
```

### Migration Checklist

When converting guest to account:

- [ ] User created with email + password hash
- [ ] Session linked (`sessions.user_id` set)
- [ ] All session assets linked (`assets.user_id` set)
- [ ] Cart preserved (already session-based)
- [ ] Welcome email sent
- [ ] Marketing preference stored

### Account Features (Phase 1 Minimal)

- View current orders
- Access order tracking
- Log in / log out
- No saved designs or order history (Phase 2)

---

## Error States

### Common Error Handling

| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Upload fails | "Upload failed. Please try again." | Retry button |
| Generation fails | "Generation failed. Please try a different prompt." | Retry/modify |
| Payment declined | "Payment was declined. Please try another card." | Retry |
| Session expired | "Your session has expired. Please log in again." | Login redirect |
| Product unavailable | "This product is temporarily unavailable." | Suggest alternatives |

### Network Error Handling

- Show toast notification on transient failures
- Automatic retry for idempotent operations (3 attempts)
- Preserve form state on page refresh where possible

---

*Last updated: 2025-01-18*
