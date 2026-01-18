# Fulfilment Integration (Phase 1)

Specifications for integrating with Printful (merch, prints) and Blurb (storybooks) for order fulfilment.

---

## Overview

AIPrintly uses third-party fulfilment providers to manufacture and ship products:

| Provider | Products | UK Fulfilment | API |
|----------|----------|---------------|-----|
| **Printful** | Mugs, apparel, prints, posters, canvas | Yes | REST API v2 |
| **Blurb** | Storybooks (softcover, hardcover) | Yes | REST API |

---

## Printful Integration

### API Overview

- **Base URL**: `https://api.printful.com`
- **Authentication**: Bearer token (API key)
- **Rate limit**: 120 requests/minute
- **Documentation**: https://developers.printful.com

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/store/products` | GET | List available products |
| `/products/{id}` | GET | Product details with variants |
| `/mockup-generator/create-task/{id}` | POST | Generate product mockups |
| `/mockup-generator/task` | GET | Check mockup status |
| `/orders` | POST | Create order |
| `/orders/{id}` | GET | Order status |
| `/shipping/rates` | POST | Calculate shipping |

### Product Sync

Sync Printful catalogue to local database on deployment/startup.

```typescript
interface PrintfulProduct {
  id: number;
  type: string;
  brand: string;
  model: string;
  title: string;
  description: string;
  variants: PrintfulVariant[];
  files: PrintfulFile[];
}

interface PrintfulVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  price: string; // "12.50"
  availability_status: string;
}

// Sync to local Product/ProductVariant tables
async function syncPrintfulProducts() {
  const products = await printful.get('/store/products');

  for (const product of products.result) {
    await prisma.product.upsert({
      where: { externalId: String(product.id) },
      create: {
        externalId: String(product.id),
        provider: 'PRINTFUL',
        category: mapCategory(product.type),
        name: product.title,
        description: product.description,
        basePricePence: toPence(product.retail_price),
        sellingPricePence: calculateSellingPrice(product),
        isActive: true,
        metadata: { printAreas: product.files },
      },
      update: { /* ... */ },
    });
  }
}
```

### Mockup Generation

Generate product previews showing user's design on the product.

```typescript
interface MockupRequest {
  productId: number;
  variantIds: number[];
  files: {
    type: string; // "front", "back", etc.
    url: string; // URL to user's design image
    position: {
      area_width: number;
      area_height: number;
      width: number;
      height: number;
      top: number;
      left: number;
    };
  }[];
  format: 'jpg' | 'png';
}

async function generateMockup(request: MockupRequest): Promise<string> {
  // Create mockup task
  const task = await printful.post(
    `/mockup-generator/create-task/${request.productId}`,
    {
      variant_ids: request.variantIds,
      files: request.files,
      format: request.format,
    }
  );

  // Poll for completion
  const result = await pollMockupTask(task.task_key);

  // Return mockup URL
  return result.mockups[0].mockup_url;
}
```

### Order Creation

Submit order to Printful after payment.

```typescript
interface PrintfulOrderRequest {
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code?: string;
    country_code: string; // "GB"
    zip: string;
    phone?: string;
    email: string;
  };
  items: {
    variant_id: number;
    quantity: number;
    files: {
      type: string;
      url: string;
      filename: string;
    }[];
  }[];
  retail_costs?: {
    currency: string;
    subtotal: string;
    shipping: string;
    tax: string;
  };
}

async function createPrintfulOrder(
  order: Order,
  items: OrderItem[]
): Promise<string> {
  const printfulOrder = await printful.post('/orders', {
    recipient: {
      name: order.shippingAddress.name,
      address1: order.shippingAddress.line1,
      address2: order.shippingAddress.line2,
      city: order.shippingAddress.city,
      country_code: 'GB',
      zip: order.shippingAddress.postcode,
      phone: order.shippingAddress.phone,
      email: order.customerEmail,
    },
    items: items.map(item => ({
      variant_id: Number(item.configuration.variant.externalId),
      quantity: item.quantity,
      files: [{
        type: 'default',
        url: item.configuration.asset.storageUrl,
        filename: 'design.png',
      }],
    })),
  });

  return printfulOrder.result.id;
}
```

### Shipping Rates

Calculate shipping during checkout.

```typescript
interface ShippingRateRequest {
  recipient: {
    country_code: string;
    zip: string;
  };
  items: {
    variant_id: number;
    quantity: number;
  }[];
}

async function getShippingRates(
  items: CartItem[],
  postcode: string
): Promise<ShippingRate[]> {
  const response = await printful.post('/shipping/rates', {
    recipient: {
      country_code: 'GB',
      zip: postcode,
    },
    items: items.map(item => ({
      variant_id: Number(item.configuration.variant.externalId),
      quantity: item.quantity,
    })),
  });

  return response.result.map(rate => ({
    id: rate.id,
    name: rate.name,
    rate: toPence(rate.rate),
    currency: rate.currency,
    minDeliveryDays: rate.minDeliveryDays,
    maxDeliveryDays: rate.maxDeliveryDays,
  }));
}
```

### Webhooks

Handle Printful status updates.

```typescript
// POST /api/webhooks/printful
const PRINTFUL_WEBHOOK_EVENTS = [
  'package_shipped',
  'package_returned',
  'order_created',
  'order_updated',
  'order_failed',
  'order_canceled',
];

interface PrintfulWebhook {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order: {
      id: number;
      external_id: string;
      status: string;
      shipping: string;
      shipments: {
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        ship_date: string;
      }[];
    };
  };
}

async function handlePrintfulWebhook(payload: PrintfulWebhook) {
  // Log event
  await prisma.fulfilmentEvent.create({
    data: {
      provider: 'PRINTFUL',
      eventType: payload.type,
      payload: payload,
    },
  });

  switch (payload.type) {
    case 'package_shipped':
      await handlePackageShipped(payload);
      break;
    case 'order_failed':
      await handleOrderFailed(payload);
      break;
    // ... other events
  }
}

async function handlePackageShipped(payload: PrintfulWebhook) {
  const shipment = payload.data.order.shipments[0];

  // Update order item
  await prisma.orderItem.update({
    where: { fulfilmentOrderId: String(payload.data.order.id) },
    data: {
      fulfilmentStatus: 'FULFILLED',
      trackingNumber: shipment.tracking_number,
      trackingUrl: shipment.tracking_url,
    },
  });

  // Update order status if all items shipped
  await updateOrderStatus(payload.data.order.external_id);

  // Send shipping notification email
  await sendShippingNotification(payload.data.order.external_id);
}
```

---

## Blurb Integration

### API Overview

- **Base URL**: `https://api.blurb.com/v1`
- **Authentication**: OAuth 2.0 / API key
- **Documentation**: https://developer.blurb.com

### Book Specifications

| Spec | Options |
|------|---------|
| Format | 8×8" square |
| Cover | Softcover, Hardcover |
| Paper | Standard (100gsm), Premium (150gsm) |
| Pages | 20-100 (in increments of 2) |
| Binding | Perfect bound (soft), Case bound (hard) |

### PDF Generation

Generate print-ready PDF from storybook project.

```typescript
interface BlurbBookSpec {
  title: string;
  format: '8x8';
  binding: 'softcover' | 'hardcover';
  paperType: 'standard' | 'premium';
  pages: {
    pageNumber: number;
    type: 'cover' | 'content' | 'back';
    imageUrl: string;
    text?: string;
    layout: 'full-bleed' | 'with-text' | 'text-only';
  }[];
}

async function generateBookPdf(project: StorybookProject): Promise<string> {
  // Use PDFKit or similar to generate PDF
  const doc = new PDFDocument({
    size: [576, 576], // 8" at 72 DPI
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
  });

  for (const page of project.pages) {
    if (page.pageNumber > 1) doc.addPage();

    // Add image
    if (page.assetId) {
      const imageBuffer = await downloadImage(page.assetId);
      doc.image(imageBuffer, 0, 0, { width: 576, height: 576 });
    }

    // Add text overlay
    if (page.text) {
      doc.fontSize(24)
         .fillColor('black')
         .text(page.text, 36, 480, {
           width: 504,
           align: 'center',
         });
    }
  }

  // Upload to R2
  const pdfBuffer = await doc.end();
  const pdfUrl = await uploadToR2(pdfBuffer, `books/${project.id}.pdf`);

  return pdfUrl;
}
```

### Order Creation

Submit book order to Blurb.

```typescript
interface BlurbOrderRequest {
  book: {
    pdf_url: string;
    title: string;
    binding: string;
    paper_type: string;
    quantity: number;
  };
  shipping: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping_method: 'standard' | 'express';
}

async function createBlurbOrder(
  order: Order,
  item: OrderItem,
  project: StorybookProject
): Promise<string> {
  // Ensure PDF is generated
  if (!project.pdfUrl) {
    project.pdfUrl = await generateBookPdf(project);
    await prisma.storybookProject.update({
      where: { id: project.id },
      data: { pdfUrl: project.pdfUrl },
    });
  }

  const blurbOrder = await blurb.post('/orders', {
    book: {
      pdf_url: project.pdfUrl,
      title: project.title,
      binding: item.configuration.variant.name.toLowerCase(),
      paper_type: 'standard',
      quantity: item.quantity,
    },
    shipping: {
      name: order.shippingAddress.name,
      address1: order.shippingAddress.line1,
      address2: order.shippingAddress.line2,
      city: order.shippingAddress.city,
      postcode: order.shippingAddress.postcode,
      country: 'GB',
      email: order.customerEmail,
      phone: order.shippingAddress.phone,
    },
    shipping_method: 'standard',
  });

  return blurbOrder.order_id;
}
```

### Webhooks

Handle Blurb status updates.

```typescript
// POST /api/webhooks/blurb
interface BlurbWebhook {
  event: string;
  order_id: string;
  status: string;
  tracking?: {
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  };
  timestamp: string;
}

async function handleBlurbWebhook(payload: BlurbWebhook) {
  await prisma.fulfilmentEvent.create({
    data: {
      provider: 'BLURB',
      eventType: payload.event,
      payload: payload,
    },
  });

  switch (payload.event) {
    case 'order.shipped':
      await handleBlurbShipped(payload);
      break;
    case 'order.delivered':
      await handleBlurbDelivered(payload);
      break;
    case 'order.failed':
      await handleBlurbFailed(payload);
      break;
  }
}
```

---

## Order Routing

Route order items to appropriate fulfilment provider.

```typescript
async function routeOrderToProviders(order: Order): Promise<void> {
  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: {
      configuration: {
        include: {
          product: true,
          variant: true,
          asset: true,
          storybookProject: true,
        },
      },
    },
  });

  // Group by provider
  const printfulItems = items.filter(
    i => i.configuration.product.provider === 'PRINTFUL'
  );
  const blurbItems = items.filter(
    i => i.configuration.product.provider === 'BLURB'
  );

  // Create Printful order(s)
  if (printfulItems.length > 0) {
    const printfulOrderId = await createPrintfulOrder(order, printfulItems);

    await prisma.orderItem.updateMany({
      where: { id: { in: printfulItems.map(i => i.id) } },
      data: {
        fulfilmentOrderId: printfulOrderId,
        fulfilmentStatus: 'SENT',
      },
    });
  }

  // Create Blurb order(s) - one per book
  for (const item of blurbItems) {
    const blurbOrderId = await createBlurbOrder(
      order,
      item,
      item.configuration.storybookProject!
    );

    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        fulfilmentOrderId: blurbOrderId,
        fulfilmentStatus: 'SENT',
      },
    });
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PROCESSING' },
  });
}
```

---

## Shipping Rate Aggregation

Combine shipping from multiple providers.

```typescript
interface AggregatedShipping {
  items: {
    provider: string;
    rate: number;
    deliveryDays: { min: number; max: number };
  }[];
  total: number;
  estimatedDelivery: { min: number; max: number };
}

async function calculateTotalShipping(
  cartItems: CartItem[],
  postcode: string
): Promise<AggregatedShipping> {
  // Separate by provider
  const printfulItems = cartItems.filter(
    i => i.configuration.product.provider === 'PRINTFUL'
  );
  const blurbItems = cartItems.filter(
    i => i.configuration.product.provider === 'BLURB'
  );

  const rates: AggregatedShipping['items'] = [];

  // Get Printful shipping
  if (printfulItems.length > 0) {
    const printfulRates = await getShippingRates(printfulItems, postcode);
    const cheapest = printfulRates[0]; // Assume sorted by price
    rates.push({
      provider: 'PRINTFUL',
      rate: cheapest.rate,
      deliveryDays: {
        min: cheapest.minDeliveryDays,
        max: cheapest.maxDeliveryDays,
      },
    });
  }

  // Get Blurb shipping (per book)
  for (const item of blurbItems) {
    const blurbRate = await getBlurbShippingRate(item, postcode);
    rates.push({
      provider: 'BLURB',
      rate: blurbRate.rate,
      deliveryDays: blurbRate.deliveryDays,
    });
  }

  // Aggregate
  const total = rates.reduce((sum, r) => sum + r.rate, 0);
  const maxDelivery = Math.max(...rates.map(r => r.deliveryDays.max));
  const minDelivery = Math.min(...rates.map(r => r.deliveryDays.min));

  return {
    items: rates,
    total,
    estimatedDelivery: { min: minDelivery, max: maxDelivery },
  };
}
```

---

## Status Synchronisation

Map provider statuses to our internal status.

### Printful Status Mapping

| Printful Status | Internal Status |
|-----------------|-----------------|
| `draft` | PENDING |
| `pending` | SENT |
| `failed` | FAILED |
| `canceled` | CANCELLED |
| `in_process` | SENT |
| `fulfilled` | FULFILLED |
| `partially_fulfilled` | SENT |

### Blurb Status Mapping

| Blurb Status | Internal Status |
|--------------|-----------------|
| `pending` | PENDING |
| `processing` | SENT |
| `printing` | SENT |
| `shipped` | FULFILLED |
| `delivered` | FULFILLED |
| `failed` | FAILED |

---

## Error Handling

### Retry Strategy

```typescript
const fulfilmentRetryConfig = {
  maxAttempts: 3,
  initialDelay: 5000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  retryableErrors: [
    'RATE_LIMITED',
    'TIMEOUT',
    'PROVIDER_UNAVAILABLE',
    'NETWORK_ERROR',
  ],
};
```

### Failure Handling

When fulfilment fails:

1. Log failure event to `fulfilment_events`
2. Update `order_item.fulfilment_status` to `FAILED`
3. Send alert to admin
4. Do NOT automatically refund (manual review required)
5. Customer support to contact customer

### Manual Intervention Queue

```typescript
interface FulfilmentAlert {
  orderId: string;
  itemId: string;
  provider: string;
  error: string;
  attemptCount: number;
  createdAt: Date;
  status: 'pending' | 'resolved' | 'escalated';
}
```

---

## Environment Variables

```bash
# Printful
PRINTFUL_API_KEY=xxx
PRINTFUL_WEBHOOK_SECRET=xxx

# Blurb
BLURB_API_KEY=xxx
BLURB_WEBHOOK_SECRET=xxx
```

---

## Webhook Security

Verify webhook authenticity.

```typescript
// Printful uses HMAC signature
function verifyPrintfulWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Blurb uses bearer token verification
function verifyBlurbWebhook(
  authHeader: string,
  expectedToken: string
): boolean {
  const token = authHeader.replace('Bearer ', '');
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}
```

---

## Testing

### Mock Providers

For development/testing, use mock providers.

```typescript
class MockPrintfulProvider implements FulfilmentProvider {
  async createOrder(order: Order): Promise<string> {
    return `MOCK-PF-${Date.now()}`;
  }

  async getStatus(orderId: string): Promise<FulfilmentStatus> {
    return 'FULFILLED'; // Always succeed
  }
}

// Set via environment
FULFILMENT_MODE=mock // or "live"
```

### Webhook Testing

Use ngrok or similar for local webhook testing:

```bash
ngrok http 3000
# Configure webhook URL in Printful dashboard
```

---

## Cost Tracking

Track fulfilment costs for margin analysis.

```typescript
interface FulfilmentCost {
  orderId: string;
  itemId: string;
  provider: string;
  productCost: number;
  shippingCost: number;
  totalCost: number;
  sellingPrice: number;
  margin: number;
  currency: string;
  recordedAt: Date;
}
```

---

*Last updated: 2025-01-18*
