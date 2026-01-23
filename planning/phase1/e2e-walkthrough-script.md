# E2E Walkthrough Script

Manual validation flows for Wave III Human Polish. Each flow should be tested and issues documented.

---

## Route Map

### Public Pages
| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/products` | Product listing (prints + storybooks only) | No |
| `/products/prints` | Print products | No |
| `/products/storybooks` | Storybook products | No |
| `/create` | Creation hub | No |
| `/privacy` | Privacy policy | No |
| `/login` | Login page | No |
| `/register` | Registration page | No |

### Auth-Required Pages
| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/create/upload` | Photo upload with consent | No (guest OK) |
| `/create/generate` | AI image generation | No (uses credits) |
| `/build/:productType` | Product builder (print, storybook) | No |
| `/build/storybook` | Storybook builder | No |
| `/cart` | Shopping cart | No |
| `/checkout` | Checkout (requires auth) | **Yes** |
| `/checkout/success` | Payment success | Yes |
| `/checkout/cancelled` | Payment cancelled | Yes |
| `/credits/purchase` | Buy credit packs | **Yes** |
| `/credits/success` | Credit purchase success | Yes |
| `/account` | Account settings | Yes |
| `/orders/:orderId` | Order tracking | Token-based |

### API Routes (for reference)
- `/api/assets/upload` - Upload images
- `/api/assets/:id/image` - Proxy images (auth required)
- `/api/generate/image` - AI generation
- `/api/generate/story` - Story generation
- `/api/credits` - Credit balance
- `/api/credits/purchase` - Buy credits
- `/api/cart` - Cart operations
- `/api/cart/add` - Add to cart
- `/api/checkout/create-session` - Stripe checkout
- `/api/webhooks/stripe` - Stripe webhooks
- `/api/webhooks/printful` - Printful webhooks
- `/api/webhooks/blurb` - Blurb webhooks

---

## Flow 1: Guest Browse & Discovery

**Goal**: User discovers products without signing up

### Steps
1. [ ] **Landing page** `/`
   - Hero section loads
   - Product categories shown (prints, storybooks only - NO mugs/apparel)
   - CTA buttons work
   - Navigation links work

2. [ ] **Products page** `/products`
   - Products load from database
   - Only prints and storybooks shown
   - Category tabs work (All, Prints, Storybooks)
   - Product cards display correctly
   - "Customise" buttons work

3. [ ] **Category filter** `/products/prints`
   - Filters to prints only
   - `/products/storybooks` filters to storybooks
   - `/products/mugs` should redirect to `/products`
   - `/products/apparel` should redirect to `/products`

4. [ ] **Create hub** `/create`
   - Upload option visible
   - Generate option visible
   - Links work

### Issues Found
- [ ] _Document issues here_

---

## Flow 2: Upload → Build → Cart (Guest)

**Goal**: Guest uploads image, customises product, adds to cart

### Steps
1. [ ] **Upload page** `/create/upload`
   - Consent form appears FIRST
   - Both checkboxes required
   - Privacy policy link works
   - "I Consent & Continue" enables after both checked

2. [ ] **Upload image**
   - Dropzone appears after consent
   - Can drag & drop image
   - Can click to select file
   - Upload progress shown
   - Preview displays after upload
   - "Delete this photo" button works
   - Product selection appears

3. [ ] **Select product type**
   - Print option available
   - Storybook option available
   - Click navigates to builder with asset ID

4. [ ] **Builder page** `/build/print?assetId=xxx`
   - Design loads on canvas
   - Can drag to reposition
   - Can scale (scroll/pinch)
   - Can rotate
   - Print area overlay visible
   - Variant selector works (size)
   - Price updates with variant
   - "Add to Basket" button works

5. [ ] **Cart page** `/cart`
   - Item appears in cart
   - Thumbnail shows design
   - Quantity controls work
   - Remove button works
   - Subtotal correct
   - "Proceed to Checkout" button visible

6. [ ] **Checkout redirect**
   - Clicking checkout redirects to `/login?redirectTo=/checkout`
   - Guest must register/login first

### Issues Found
- [ ] _Document issues here_

---

## Flow 3: AI Generate → Build → Cart (Guest)

**Goal**: Guest generates AI image, customises, adds to cart

### Steps
1. [ ] **Generate page** `/create/generate`
   - Credit balance shown
   - Style presets available
   - Prompt input works
   - Dimension selector works
   - "Generate" button works (if credits > 0)

2. [ ] **Generation process**
   - Loading state shown
   - Progress indicator (if available)
   - Generated image displays
   - Credit deducted
   - Product selection appears

3. [ ] **Out of credits** (if applicable)
   - Gate appears when credits = 0
   - Shows credit pack options
   - "Buy Credits" links to `/credits/purchase`
   - Requires login to purchase

4. [ ] **Continue to builder**
   - Same as Flow 2, steps 4-6

### Issues Found
- [ ] _Document issues here_

---

## Flow 4: Registration & Login

**Goal**: User creates account and logs in

### Steps
1. [ ] **Register page** `/register`
   - Email field validates
   - Password field validates
   - Confirm password matches
   - Form submits successfully
   - Redirects after registration
   - Session migrates (credits, assets)

2. [ ] **Login page** `/login`
   - Email/password login works
   - Error messages show for invalid credentials
   - "Forgot password" link visible (even if not functional)
   - "Register" link works
   - Redirects to `redirectTo` param after login

3. [ ] **Logout**
   - Logout button in header (when logged in)
   - Clears session
   - Redirects to home

### Issues Found
- [ ] _Document issues here_

---

## Flow 5: Authenticated Checkout

**Goal**: Logged-in user completes purchase

### Prerequisites
- User logged in
- Item in cart

### Steps
1. [ ] **Checkout page** `/checkout`
   - Order summary shown
   - Shipping form appears
   - UK address fields
   - Form validates

2. [ ] **Stripe redirect**
   - "Pay with Stripe" button works
   - Redirects to Stripe Checkout
   - Test card: 4242 4242 4242 4242

3. [ ] **Success page** `/checkout/success`
   - Order confirmation shown
   - Order number displayed
   - "Track Order" link works

4. [ ] **Cancelled page** `/checkout/cancelled`
   - Message shown
   - "Return to Cart" link works

### Issues Found
- [ ] _Document issues here_

---

## Flow 6: Credit Purchase

**Goal**: User buys credit pack

### Prerequisites
- User logged in

### Steps
1. [ ] **Credits purchase page** `/credits/purchase`
   - Current balance shown
   - 3 credit packs displayed (100, 250, 700)
   - Prices correct (£4.99, £9.99, £19.99)
   - "Best Value" badge on 700 pack
   - Buy buttons work

2. [ ] **Stripe redirect**
   - Redirects to Stripe Checkout
   - Correct amount shown

3. [ ] **Success page** `/credits/success`
   - New balance shown
   - Credits added correctly
   - "Start Creating" link works

### Issues Found
- [ ] _Document issues here_

---

## Flow 7: Storybook Creation

**Goal**: User creates personalised storybook

### Steps
1. [ ] **Storybook builder** `/build/storybook`
   - Child name input
   - Theme selection (1-3 themes)
   - Page editor works
   - Text editing works
   - Image slots work
   - Preview/flip-through works

2. [ ] **Avatar selector** (if integrated)
   - Gender options
   - Skin tone swatches
   - Hair colour options
   - Hair style options
   - Live preview updates
   - "Use photo instead" toggle

3. [ ] **Add to cart**
   - Configuration saved
   - Storybook in cart with preview

### Issues Found
- [ ] _Document issues here_

---

## Flow 8: Order Tracking

**Goal**: User tracks their order

### Steps
1. [ ] **Order page** `/orders/:orderId`
   - Order details shown
   - Status timeline visible
   - Tracking number (when shipped)
   - Carrier link works
   - Token-based access works (no login required with token)

### Issues Found
- [ ] _Document issues here_

---

## Flow 9: Account & Privacy

**Goal**: User manages account and views privacy info

### Steps
1. [ ] **Account page** `/account`
   - Email displayed
   - Member since date
   - Order history link (if exists)

2. [ ] **Privacy policy** `/privacy`
   - All sections render
   - Table of contents works
   - Anchor links work
   - Children's data section prominent
   - Contact info present

### Issues Found
- [ ] _Document issues here_

---

## Mobile Testing Checklist

Run all flows above on mobile viewport (375px width)

### Key Areas
- [ ] Navigation menu (hamburger)
- [ ] Product cards responsive
- [ ] Builder canvas touch gestures
- [ ] Forms usable on mobile
- [ ] Checkout flow mobile-friendly
- [ ] Text readable without zooming

---

## Issue Tracking Template

For each issue found:

```
### Issue: [Short description]
- **Route**: /path
- **Flow**: Flow X, Step Y
- **Severity**: Critical / High / Medium / Low
- **Description**: What's wrong
- **Expected**: What should happen
- **Screenshot**: (if applicable)
```

---

## Summary Checklist

After walkthrough, tally:

- [ ] Flow 1: Guest Browse — ___ issues
- [ ] Flow 2: Upload → Build → Cart — ___ issues
- [ ] Flow 3: Generate → Build → Cart — ___ issues
- [ ] Flow 4: Registration & Login — ___ issues
- [ ] Flow 5: Authenticated Checkout — ___ issues
- [ ] Flow 6: Credit Purchase — ___ issues
- [ ] Flow 7: Storybook Creation — ___ issues
- [ ] Flow 8: Order Tracking — ___ issues
- [ ] Flow 9: Account & Privacy — ___ issues
- [ ] Mobile Testing — ___ issues

**Total Issues**: ___
- Critical: ___
- High: ___
- Medium: ___
- Low: ___
