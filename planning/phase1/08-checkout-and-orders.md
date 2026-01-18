# Checkout and Orders (Phase 1)

Specifications for cart management, Stripe checkout, order processing, and tracking.

---

## Overview

This document covers:
1. Cart management (session-based)
2. Quality validation before checkout
3. Stripe Checkout integration
4. Order creation and fulfilment dispatch
5. Email notifications
6. Order tracking
7. Refund and support flows

---

## Cart Management

### Cart Structure

```typescript
interface Cart {
  sessionId: string;
  items: CartItem[];
  subtotalPence: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: string;
  configurationId: string;
  configuration: {
    product: Product;
    variant: ProductVariant;
    asset: Asset;
    mockupUrl: string;
    customisation: Customisation;
  };
  quantity: number;
  unitPricePence: number;
  totalPricePence: number;
}
```

### Cart Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cart` | GET | Get current cart |
| `/api/cart/items` | POST | Add item |
| `/api/cart/items/$id` | PATCH | Update quantity |
| `/api/cart/items/$id` | DELETE | Remove item |
| `/api/cart` | DELETE | Clear cart |

### Cart Validation

Before adding to cart:

```typescript
async function validateCartAddition(
  configurationId: string
): Promise<ValidationResult> {
  const config = await getConfiguration(configurationId);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check product availability
  if (!config.product.isActive) {
    errors.push('This product is no longer available.');
  }

  // Check variant stock
  if (config.variant.stockStatus === 'OUT_OF_STOCK') {
    errors.push('This size/colour is currently out of stock.');
  }

  // Check image quality (DPI)
  const dpi = calculateEffectiveDPI(config.asset, config.customisation);
  if (dpi < 150) {
    errors.push('Image quality is too low for printing. Please use a higher resolution image.');
  } else if (dpi < 200) {
    warnings.push('Image may appear slightly pixelated when printed.');
  }

  // Check print area boundaries
  const boundaryCheck = checkPrintBoundaries(config);
  if (boundaryCheck.textMayCrop) {
    warnings.push('Parts of your design may be cropped during printing.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requiresConfirmation: warnings.length > 0,
  };
}
```

### Quality Warnings UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Quality Warning                                             │
│                                                                 │
│  Your image may appear slightly pixelated when printed.         │
│                                                                 │
│  Would you like to:                                             │
│  • [Try a different image] - Upload higher resolution           │
│  • [Continue anyway] - I understand the quality may vary        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pre-Checkout Validation

### Content Quality Firewall

Run validation before allowing checkout:

```typescript
interface ContentValidation {
  imageQuality: {
    dpiSufficient: boolean;
    noArtefacts: boolean;
    aspectRatioMatch: boolean;
  };
  contentSafety: {
    nsfwDetected: boolean;
    copyrightConcern: boolean;
    brandDetected: boolean;
  };
  printReadiness: {
    withinBleeds: boolean;
    safeZoneClear: boolean;
  };
}

async function validateCartForCheckout(
  cart: Cart
): Promise<CheckoutValidation> {
  const issues: Issue[] = [];

  for (const item of cart.items) {
    // DPI check
    const dpi = calculateEffectiveDPI(item.configuration);
    if (dpi < 150) {
      issues.push({
        itemId: item.id,
        type: 'blocking',
        message: `"${item.configuration.product.name}" image quality is too low for printing.`,
        action: 'Replace image or choose smaller product',
      });
    }

    // Bleed zone check
    const printCheck = checkPrintBoundaries(item.configuration);
    if (printCheck.outOfBounds) {
      issues.push({
        itemId: item.id,
        type: 'warning',
        message: `Parts of your design on "${item.configuration.product.name}" may be cropped.`,
        action: 'Adjust position or acknowledge',
      });
    }

    // Content safety (basic)
    if (item.configuration.asset.metadata?.flagged) {
      issues.push({
        itemId: item.id,
        type: 'review',
        message: 'This image has been flagged for review.',
        action: 'Contact support if you believe this is an error',
      });
    }
  }

  return {
    canProceed: !issues.some(i => i.type === 'blocking'),
    issues,
  };
}
```

---

## Checkout Flow

### Guest-to-Account Gate

Require account creation at checkout (not earlier).

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE YOUR ACCOUNT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   To complete your order, please create an account.             │
│   This allows you to track your order and contact us            │
│   if needed.                                                    │
│                                                                 │
│   Email: [________________________]                             │
│   Password: [________________________]                          │
│   Confirm: [________________________]                           │
│                                                                 │
│   □ Send me updates about new products (optional)               │
│                                                                 │
│   [Create Account & Continue to Payment]                        │
│                                                                 │
│   ───────────── or ─────────────                                │
│                                                                 │
│   Already have an account? [Log in]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stripe Checkout Integration

Use Stripe Checkout (hosted) for PCI compliance.

```typescript
// POST /api/checkout/create-session
async function createCheckoutSession(
  cart: Cart,
  user: User,
  shippingAddress: Address
): Promise<{ sessionId: string; url: string }> {
  // Calculate shipping
  const shipping = await calculateShipping(cart.items, shippingAddress.postcode);

  // Create line items
  const lineItems = cart.items.map(item => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.configuration.product.name,
        description: item.configuration.variant.name,
        images: [item.configuration.mockupUrl],
        metadata: {
          configurationId: item.configurationId,
        },
      },
      unit_amount: item.unitPricePence,
    },
    quantity: item.quantity,
  }));

  // Add shipping as line item
  lineItems.push({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: 'Shipping',
        description: `${shipping.method} (${shipping.estimatedDays} business days)`,
      },
      unit_amount: shipping.ratePence,
    },
    quantity: 1,
  });

  // Create Stripe session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: user.email,
    shipping_address_collection: {
      allowed_countries: ['GB'], // UK only for Phase 1
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shipping.ratePence, currency: 'gbp' },
          display_name: shipping.method,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: shipping.minDays },
            maximum: { unit: 'business_day', value: shipping.maxDays },
          },
        },
      },
    ],
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout/cancelled`,
    metadata: {
      sessionId: cart.sessionId,
      userId: user.id,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}
```

### Delivery Estimate Display

Show clear delivery windows before checkout.

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Delivery Estimate                                           │
│                                                                 │
│  Standard Delivery: £4.99                                       │
│  Estimated arrival: 22-26 January 2025                          │
│                                                                 │
│  ℹ️ Delivery times may vary. You'll receive tracking            │
│     information once your order ships.                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Webhook Handling

### Stripe Webhook Events

```typescript
// POST /api/webhooks/stripe
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;
    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
  }
}
```

### Order Creation

```typescript
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { sessionId, userId } = session.metadata!;

  // Get cart
  const cart = await getCart(sessionId);

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      sessionId,
      userId,
      status: 'PAID',
      subtotalPence: cart.subtotalPence,
      shippingPence: session.shipping_cost?.amount_subtotal || 0,
      totalPence: session.amount_total!,
      currency: 'GBP',
      shippingAddress: session.shipping_details?.address,
      customerEmail: session.customer_email!,
      customerName: session.shipping_details?.name || '',
      stripePaymentIntentId: session.payment_intent as string,
      stripeCheckoutSessionId: session.id,
      trackingToken: generateTrackingToken(),
    },
  });

  // Create order items
  for (const item of cart.items) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        configurationId: item.configurationId,
        productName: item.configuration.product.name,
        variantName: item.configuration.variant.name,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        totalPricePence: item.totalPricePence,
        fulfilmentProvider: item.configuration.product.provider,
        fulfilmentStatus: 'PENDING',
      },
    });
  }

  // Clear cart
  await clearCart(sessionId);

  // Route to fulfilment providers
  await routeOrderToProviders(order);

  // Send confirmation email
  await sendOrderConfirmationEmail(order);
}
```

### Order Number Generation

```typescript
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sequence = getNextSequence(); // From database
  return `AIP-${year}-${sequence.toString().padStart(4, '0')}`;
}

function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex');
}
```

---

## Email Notifications

### Order Confirmation

```typescript
interface OrderConfirmationEmail {
  to: string;
  subject: string;
  order: {
    orderNumber: string;
    items: OrderItemSummary[];
    subtotal: string;
    shipping: string;
    total: string;
    shippingAddress: Address;
    estimatedDelivery: string;
    trackingUrl: string;
  };
}

async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const items = await getOrderItems(order.id);

  await sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed - ${order.orderNumber}`,
    template: 'order-confirmation',
    data: {
      orderNumber: order.orderNumber,
      items: items.map(item => ({
        name: item.productName,
        variant: item.variantName,
        quantity: item.quantity,
        price: formatCurrency(item.totalPricePence),
        mockupUrl: item.configuration.mockupUrl,
      })),
      subtotal: formatCurrency(order.subtotalPence),
      shipping: formatCurrency(order.shippingPence),
      total: formatCurrency(order.totalPence),
      shippingAddress: order.shippingAddress,
      estimatedDelivery: calculateEstimatedDelivery(items),
      trackingUrl: `${APP_URL}/orders/${order.id}?token=${order.trackingToken}`,
    },
  });
}
```

### Shipping Notification

```typescript
async function sendShippingNotificationEmail(
  order: Order,
  item: OrderItem
): Promise<void> {
  await sendEmail({
    to: order.customerEmail,
    subject: `Your order has shipped - ${order.orderNumber}`,
    template: 'order-shipped',
    data: {
      orderNumber: order.orderNumber,
      itemName: item.productName,
      trackingNumber: item.trackingNumber,
      trackingUrl: item.trackingUrl,
      carrier: getCarrierName(item.trackingNumber),
      estimatedDelivery: calculateDeliveryFromTracking(item),
      orderTrackingUrl: `${APP_URL}/orders/${order.id}?token=${order.trackingToken}`,
    },
  });
}
```

### Delivery Confirmation

```typescript
async function sendDeliveryConfirmationEmail(order: Order): Promise<void> {
  await sendEmail({
    to: order.customerEmail,
    subject: `Your order has been delivered - ${order.orderNumber}`,
    template: 'order-delivered',
    data: {
      orderNumber: order.orderNumber,
      helpUrl: `${APP_URL}/orders/${order.id}?token=${order.trackingToken}#help`,
      supportEmail: 'support@aiprintly.co.uk',
    },
  });
}
```

---

## Order Tracking

### Public Tracking Page

Accessible via token without login.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER TRACKING                               │
│                    Order #AIP-2025-0001                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Status Timeline                                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   ✓ Order placed           18 Jan 2025, 10:30          │   │
│   │   │                                                     │   │
│   │   ✓ Payment confirmed      18 Jan 2025, 10:31          │   │
│   │   │                                                     │   │
│   │   ✓ In production          18 Jan 2025, 14:00          │   │
│   │   │                                                     │   │
│   │   ○ Shipped                                             │   │
│   │   │                                                     │   │
│   │   ○ Delivered                                           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Items                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ [Mockup]  Custom Mug                           £14.99   │   │
│   │           Status: In production                         │   │
│   │           Estimated ship: 20-21 Jan 2025               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Shipping to:                                                  │
│   John Smith                                                    │
│   123 High Street                                               │
│   London SW1A 1AA                                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Need help?                                                    │
│   [Report a problem] [Contact support]                          │
│                                                                 │
│   support@aiprintly.co.uk                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Order Status API

```typescript
// GET /api/orders/$orderId
async function getOrderDetails(
  orderId: string,
  token: string
): Promise<OrderDetails> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          configuration: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      },
    },
  });

  // Verify token
  if (order?.trackingToken !== token) {
    throw new UnauthorizedError('Invalid tracking token');
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    timeline: buildTimeline(order),
    items: order.items.map(formatOrderItem),
    shippingAddress: order.shippingAddress,
    totals: {
      subtotal: order.subtotalPence,
      shipping: order.shippingPence,
      total: order.totalPence,
    },
  };
}

function buildTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      status: 'Order placed',
      timestamp: order.createdAt,
      completed: true,
    },
    {
      status: 'Payment confirmed',
      timestamp: order.status !== 'PENDING' ? order.updatedAt : null,
      completed: order.status !== 'PENDING',
    },
    {
      status: 'In production',
      timestamp: order.status === 'PROCESSING' ? order.updatedAt : null,
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'Shipped',
      timestamp: order.status === 'SHIPPED' ? order.updatedAt : null,
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'Delivered',
      timestamp: order.status === 'DELIVERED' ? order.updatedAt : null,
      completed: order.status === 'DELIVERED',
    },
  ];

  return events;
}
```

---

## Refund and Support

### Problem Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│                    REPORT A PROBLEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   What's the issue?                                             │
│                                                                 │
│   ○ Item arrived damaged                                        │
│   ○ Wrong item received                                         │
│   ○ Print quality issue (blurry, faded, misaligned)            │
│   ○ Item never arrived                                          │
│   ○ Other                                                       │
│                                                                 │
│   Please describe the problem:                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Upload photos (optional):                                     │
│   [Choose files]                                                │
│                                                                 │
│   [Submit Report]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Refund Policy

Clear, predefined refund rules:

| Issue | Resolution | Timeframe |
|-------|------------|-----------|
| Damaged in transit | Full refund or replacement | Within 14 days |
| Wrong item | Full refund or replacement | Within 14 days |
| Print quality defect | Full refund or replacement | Within 14 days |
| Item not delivered | Full refund | After 21 days |
| Change of mind | No refund (custom products) | N/A |

### Support Ticket Creation

```typescript
interface SupportTicket {
  id: string;
  orderId: string;
  orderItemId?: string;
  type: 'damage' | 'wrong_item' | 'quality' | 'delivery' | 'other';
  description: string;
  attachments: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function createSupportTicket(
  orderId: string,
  data: SupportTicketInput
): Promise<SupportTicket> {
  const ticket = await prisma.supportTicket.create({
    data: {
      orderId,
      orderItemId: data.itemId,
      type: data.type,
      description: data.description,
      attachments: data.attachmentUrls,
      status: 'open',
    },
  });

  // Notify support team
  await notifySupportTeam(ticket);

  // Send acknowledgement email
  await sendSupportAcknowledgementEmail(ticket);

  return ticket;
}
```

### Auto-Refund Paths

Some issues can be auto-approved:

```typescript
async function evaluateRefundRequest(
  ticket: SupportTicket
): Promise<RefundDecision> {
  const order = await getOrder(ticket.orderId);

  // Auto-approve conditions
  if (
    ticket.type === 'damage' &&
    ticket.attachments.length > 0 &&
    isWithinRefundWindow(order)
  ) {
    return {
      autoApproved: true,
      action: 'full_refund',
      reason: 'Damaged item with photo evidence',
    };
  }

  if (
    ticket.type === 'delivery' &&
    isOverdue(order, 21) // 21 days past estimate
  ) {
    return {
      autoApproved: true,
      action: 'full_refund',
      reason: 'Item not delivered within expected timeframe',
    };
  }

  // Requires manual review
  return {
    autoApproved: false,
    action: 'manual_review',
    reason: 'Requires support team review',
  };
}
```

---

## Packaging Instructions

Special handling for fragile items.

```typescript
interface PackagingInstructions {
  provider: 'PRINTFUL' | 'BLURB';
  productCategory: string;
  instructions: string[];
  fragile: boolean;
}

function getPackagingInstructions(item: OrderItem): PackagingInstructions {
  if (item.configuration.product.category === 'MUG') {
    return {
      provider: 'PRINTFUL',
      productCategory: 'MUG',
      instructions: [
        'Use bubble wrap around item',
        'Add fragile sticker to outer packaging',
        'Use sturdy box with padding',
      ],
      fragile: true,
    };
  }

  // ... other categories

  return {
    provider: item.configuration.product.provider,
    productCategory: item.configuration.product.category,
    instructions: [],
    fragile: false,
  };
}
```

---

## Privacy and Data

### Photo Deletion Policy

Clear user-facing policy:

```
Your uploaded images are:
- Stored securely during the creation process
- Retained for 30 days after order completion (for support purposes)
- Automatically deleted after 30 days
- Never shared with third parties except for printing

You can request immediate deletion of your data at any time.
[Delete My Data]
```

### Data Retention

```typescript
// Scheduled job: Daily cleanup
async function cleanupExpiredAssets(): Promise<void> {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Find assets from completed orders older than 30 days
  const expiredAssets = await prisma.asset.findMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      configurations: {
        every: {
          orderItems: {
            every: {
              order: {
                status: { in: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
              },
            },
          },
        },
      },
    },
  });

  for (const asset of expiredAssets) {
    // Delete from R2
    await deleteFromR2(asset.storageKey);

    // Delete record
    await prisma.asset.delete({ where: { id: asset.id } });
  }
}
```

### GDPR Compliance

```typescript
// Delete all user data on request
async function deleteUserData(userId: string): Promise<void> {
  // Delete assets
  const assets = await prisma.asset.findMany({ where: { userId } });
  for (const asset of assets) {
    await deleteFromR2(asset.storageKey);
  }
  await prisma.asset.deleteMany({ where: { userId } });

  // Anonymise orders (keep for accounting)
  await prisma.order.updateMany({
    where: { userId },
    data: {
      customerEmail: 'deleted@aiprintly.co.uk',
      customerName: 'Deleted User',
      shippingAddress: null,
    },
  });

  // Delete user
  await prisma.user.delete({ where: { id: userId } });
}
```

---

## Error Pages

### Checkout Cancelled

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Payment Cancelled                                             │
│                                                                 │
│   Your payment was not completed. Don't worry - your            │
│   cart has been saved.                                          │
│                                                                 │
│   [Return to Cart] [Continue Shopping]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Failed

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Payment Failed                                                │
│                                                                 │
│   We couldn't process your payment. This might be because:      │
│   • Your card was declined                                      │
│   • There were insufficient funds                               │
│   • Your card details were incorrect                            │
│                                                                 │
│   Please try again with a different payment method.             │
│                                                                 │
│   [Try Again] [Contact Support]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Last updated: 2025-01-18*
