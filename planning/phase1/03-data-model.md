# Data Model (Phase 1)

Database schema for AIPrintly MVP using PostgreSQL and Prisma ORM.

---

## Tables

### users

User accounts for authentication (customers only in Phase 1).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email | string | Unique, lowercased |
| password_hash | string | Nullable (for magic link users) |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes**: `email` (unique)

---

### sessions

Guest and authenticated sessions for cart persistence and asset ownership.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id (nullable for guests) |
| session_token | string | Unique, hashed |
| expires_at | timestamp | Rolling 7-day expiry |
| created_at | timestamp | |

**Indexes**: `session_token` (unique), `user_id`

**Note**: Sessions support both guest users (user_id = null) and authenticated users. On account creation, guest session is linked to the new user.

---

### auth_tokens

Magic link and password reset tokens.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id (nullable for password reset pre-signup) |
| email | string | Target email |
| token_hash | string | SHA-256 hash |
| type | enum | `MAGIC_LINK` or `PASSWORD_RESET` |
| expires_at | timestamp | 15 minutes from creation |
| used_at | timestamp | Null if unused |
| created_at | timestamp | |

**Indexes**: `token_hash` (unique)

---

### assets

Uploaded or generated images stored in R2/S3.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → sessions.id |
| user_id | uuid | FK → users.id (nullable, set on migration) |
| source | enum | `UPLOAD` or `GENERATED` |
| storage_key | string | R2/S3 object key |
| storage_url | string | Public or signed URL |
| mime_type | string | e.g., `image/png` |
| width | integer | Pixels |
| height | integer | Pixels |
| file_size | integer | Bytes |
| metadata | jsonb | Original filename, generation params, etc. |
| created_at | timestamp | |

**Indexes**: `session_id`, `user_id`

---

### generation_jobs

Tracks AI generation jobs (images and stories).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → sessions.id |
| type | enum | `IMAGE` or `STORY` |
| status | enum | See status values below |
| provider | string | e.g., `replicate`, `openai` |
| provider_job_id | string | External job reference |
| input_params | jsonb | Prompt, style, etc. |
| output | jsonb | Generated content or URLs |
| error_message | string | Nullable, set on failure |
| started_at | timestamp | |
| completed_at | timestamp | Nullable |
| created_at | timestamp | |

**Status values**: `PENDING` → `PROCESSING` → `COMPLETED` or `FAILED`

**Indexes**: `session_id`, `status`, `provider_job_id`

---

### products

Product catalogue (seeded from Printful/Blurb sync).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| external_id | string | Printful/Blurb product ID |
| provider | enum | `PRINTFUL` or `BLURB` |
| category | enum | `MUG`, `APPAREL`, `PRINT`, `STORYBOOK` |
| name | string | Display name |
| description | string | |
| base_price_pence | integer | Fulfilment cost in pence |
| selling_price_pence | integer | Our price in pence |
| is_active | boolean | Available for sale |
| metadata | jsonb | Print areas, dimensions, etc. |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes**: `external_id` (unique), `category`, `is_active`

---

### product_variants

Size, colour, and other options per product.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| product_id | uuid | FK → products.id |
| external_id | string | Printful/Blurb variant ID |
| name | string | e.g., "Black / Large" |
| size | string | Nullable (e.g., "L", "A3") |
| colour | string | Nullable |
| colour_hex | string | Nullable (for display) |
| base_price_pence | integer | Variant-specific cost |
| selling_price_pence | integer | Our price |
| stock_status | enum | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` |
| metadata | jsonb | Additional attributes |
| created_at | timestamp | |

**Indexes**: `product_id`, `external_id`

---

### product_configurations

User's customisation of a product with their asset.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → sessions.id |
| product_id | uuid | FK → products.id |
| variant_id | uuid | FK → product_variants.id |
| asset_id | uuid | FK → assets.id |
| customisation | jsonb | Position, scale, rotation, text |
| mockup_url | string | Generated preview image URL |
| created_at | timestamp | |
| updated_at | timestamp | |

**Customisation JSON structure**:
```json
{
  "position": { "x": 0.5, "y": 0.5 },
  "scale": 1.0,
  "rotation": 0,
  "printArea": "front",
  "text": null
}
```

**Indexes**: `session_id`, `product_id`

---

### storybook_projects

Extended data for storybook products.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| configuration_id | uuid | FK → product_configurations.id (1:1) |
| title | string | Book title |
| child_name | string | Protagonist name |
| child_age | integer | Nullable |
| theme | string | e.g., "adventure", "magic" |
| page_count | integer | 8-40 pages |
| pages | jsonb | Array of page objects |
| cover_asset_id | uuid | FK → assets.id (cover image) |
| pdf_url | string | Generated PDF for Blurb |
| created_at | timestamp | |
| updated_at | timestamp | |

**Pages JSON structure**:
```json
[
  {
    "pageNumber": 1,
    "type": "cover",
    "assetId": "uuid",
    "text": "The Adventure Begins"
  },
  {
    "pageNumber": 2,
    "type": "content",
    "assetId": "uuid",
    "text": "Once upon a time..."
  }
]
```

**Indexes**: `configuration_id` (unique)

---

### cart_items

Session-based shopping cart.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → sessions.id |
| configuration_id | uuid | FK → product_configurations.id |
| quantity | integer | Default 1 |
| unit_price_pence | integer | Price at time of addition |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes**: `session_id`

**Constraint**: Unique on `(session_id, configuration_id)` — prevent duplicates

---

### orders

Completed orders after successful payment.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| order_number | string | Human-readable (e.g., "AIP-2025-0001") |
| session_id | uuid | FK → sessions.id |
| user_id | uuid | FK → users.id (nullable) |
| status | enum | See status values below |
| subtotal_pence | integer | Items total |
| shipping_pence | integer | Shipping cost |
| total_pence | integer | Grand total |
| currency | string | Default "GBP" |
| shipping_address | jsonb | Full address object |
| billing_address | jsonb | Nullable if same as shipping |
| customer_email | string | For order updates |
| customer_name | string | |
| stripe_payment_intent_id | string | |
| stripe_checkout_session_id | string | |
| tracking_token | string | Unique, for public order page |
| notes | string | Customer notes (nullable) |
| created_at | timestamp | |
| updated_at | timestamp | |

**Status values**: `PENDING` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED` or `CANCELLED` or `REFUNDED`

**Indexes**: `order_number` (unique), `tracking_token` (unique), `user_id`, `status`

**Address JSON structure**:
```json
{
  "name": "John Smith",
  "line1": "123 High Street",
  "line2": "Flat 4",
  "city": "London",
  "postcode": "SW1A 1AA",
  "country": "GB",
  "phone": "+44 7700 900000"
}
```

---

### order_items

Line items within an order.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| order_id | uuid | FK → orders.id |
| configuration_id | uuid | FK → product_configurations.id |
| product_name | string | Snapshot at time of order |
| variant_name | string | Snapshot |
| quantity | integer | |
| unit_price_pence | integer | |
| total_price_pence | integer | unit × quantity |
| fulfilment_provider | enum | `PRINTFUL` or `BLURB` |
| fulfilment_order_id | string | External order reference |
| fulfilment_status | enum | `PENDING`, `SENT`, `FULFILLED`, `FAILED` |
| tracking_number | string | Nullable |
| tracking_url | string | Nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes**: `order_id`, `fulfilment_order_id`

---

### fulfilment_events

Webhook events from Printful and Blurb.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| order_item_id | uuid | FK → order_items.id |
| provider | enum | `PRINTFUL` or `BLURB` |
| event_type | string | e.g., `package_shipped` |
| payload | jsonb | Raw webhook payload |
| processed | boolean | Default false |
| created_at | timestamp | |

**Indexes**: `order_item_id`, `processed`

---

### user_credits

Credit balance for AI generation cost control.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → sessions.id (nullable, unique) |
| user_id | uuid | FK → users.id (nullable, unique) |
| balance | integer | Current credits available (default 3 for guests) |
| total_used | integer | Lifetime credits consumed |
| created_at | timestamp | |
| updated_at | timestamp | |

**Constraints**:
- Either `session_id` OR `user_id` must be set (not both null)
- `session_id` unique when not null
- `user_id` unique when not null

**Indexes**: `session_id`, `user_id`

**Notes**:
- Guests get 3 credits on session creation
- Registered users get 10 credits on signup
- Credits migrate from session to user on registration

---

### credit_transactions

Audit log for all credit changes.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_credits_id | uuid | FK → user_credits.id |
| amount | integer | Positive = add, negative = deduct |
| reason | enum | See reason values below |
| job_id | uuid | FK → generation_jobs.id (nullable) |
| metadata | jsonb | Additional context (e.g., provider, cost) |
| created_at | timestamp | |

**Reason values**: `INITIAL_GRANT`, `SIGNUP_BONUS`, `GENERATION`, `REFUND`, `PURCHASE`, `ADMIN_ADJUSTMENT`

**Indexes**: `user_credits_id`, `created_at`

---

## Enums

```prisma
enum AssetSource {
  UPLOAD
  GENERATED
}

enum GenerationJobType {
  IMAGE
  STORY
}

enum GenerationJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum ProductCategory {
  MUG
  APPAREL
  PRINT
  STORYBOOK
}

enum FulfilmentProvider {
  PRINTFUL
  BLURB
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum FulfilmentStatus {
  PENDING
  SENT
  FULFILLED
  FAILED
}

enum AuthTokenType {
  MAGIC_LINK
  PASSWORD_RESET
}

enum CreditTransactionReason {
  INITIAL_GRANT
  SIGNUP_BONUS
  GENERATION
  REFUND
  PURCHASE
  ADMIN_ADJUSTMENT
}
```

---

## Entity Relationships

```text
User (1) ──────────── (n) Session ──────────── (1) UserCredits
  │                        │                          │
  │                        │                          └── (n) CreditTransaction
  │                        │
  │                        ├── (n) Asset
  │                        │
  │                        ├── (n) GenerationJob
  │                        │
  │                        ├── (n) ProductConfiguration ──── (1) StorybookProject
  │                        │           │
  │                        │           └── (n) → (1) Product ──── (n) ProductVariant
  │                        │
  │                        └── (n) CartItem
  │
  ├── (1) UserCredits ──── (n) CreditTransaction
  │
  └── (n) Order
            │
            └── (n) OrderItem ──── (n) FulfilmentEvent
```

**Note**: UserCredits can be linked to either a Session (guest) OR a User (registered), not both.

---

## Data Flow

### Guest User Journey

1. User visits `/create/upload` → Session created
2. Session created → UserCredits created (3 credits, reason: INITIAL_GRANT)
3. User uploads image → Asset created, linked to Session
4. User generates with AI → Credits deducted, GenerationJob created
5. User builds product → ProductConfiguration created
6. User adds to cart → CartItem created
7. User checks out → Redirected to create account
8. User creates account → Session linked to User, assets/configs/credits migrated
9. Payment succeeds → Order created, CartItems cleared

### Credit Migration

When a guest creates an account:

1. Check if user already has UserCredits record
2. If guest has credits remaining:
   - Create/update UserCredits for user
   - Transfer remaining balance from guest credits
   - Log CreditTransaction (reason: SIGNUP_BONUS includes +7 bonus)
3. Delete guest UserCredits record
4. All future transactions link to user credits

### Session Migration

When a guest session is linked to a new user account:

1. `sessions.user_id` is set
2. All `assets.user_id` are set
3. Guest `user_credits` migrated to user (see Credit Migration above)
4. `orders.user_id` is set for any completed orders
5. Session token remains valid (no re-login required)

---

## Soft Deletes

The following tables use soft deletes for audit purposes:

- None in Phase 1 (hard deletes acceptable for MVP)

**Future consideration**: Add `deleted_at` column to `orders`, `assets`.

---

## Prisma Schema Notes

### UUID Generation

```prisma
id String @id @default(uuid())
```

### Timestamps

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

### JSON Fields

```prisma
customisation Json @default("{}")
```

### Indexes

```prisma
@@index([sessionId])
@@unique([sessionId, configurationId])
```

---

## Seeding

Phase 1 requires seeding:

1. **Products**: Sync from Printful API on startup
2. **Product Variants**: Sync from Printful API

No user data seeding required (all created through application flow).

---

*Last updated: 2025-01-18*
