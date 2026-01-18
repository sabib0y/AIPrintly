# Tech Stack Recommendation (Phase 1)

Full technology choices and justification for AIPrintly MVP.

---

## Summary

| Category | Choice | Alternatives Considered |
|----------|--------|------------------------|
| Framework | Remix (React Router v7) | Next.js, SvelteKit |
| Language | TypeScript | JavaScript |
| Styling | Tailwind CSS v4 | CSS Modules, styled-components |
| Database | PostgreSQL (Supabase) | PlanetScale, Neon |
| ORM | Prisma | Drizzle, Kysely |
| Payments | Stripe Checkout | PayPal, Square |
| Storage | Cloudflare R2 | AWS S3, Supabase Storage |
| AI Images | Replicate (SDXL) | OpenAI DALL-E, Stability AI |
| AI Text | OpenAI GPT-4 | Claude, Mistral |
| Email | Resend | SendGrid, Postmark |
| Deployment | Fly.io | Cloudflare Pages, Vercel |

---

## Framework: Remix

### Why Remix over Next.js

| Aspect | Remix | Next.js |
|--------|-------|---------|
| Routing | File-based, nested layouts | File-based, app router complexity |
| Data loading | Loaders/Actions (server-only) | Server Components + Client |
| Forms | Progressive enhancement native | Requires client JS for forms |
| Streaming | Native support | Server Components |
| Edge deployment | First-class Cloudflare support | Vercel-optimised |
| Learning curve | Simpler mental model | Growing complexity |

### Key Advantages for AIPrintly

1. **Nested Routing**: Builder flows benefit from shared layouts
   ```
   /build
   ├── /build/mug (inherits builder layout)
   ├── /build/apparel
   └── /build/storybook
   ```

2. **Loaders/Actions**: Server-side data without client waterfalls
   ```typescript
   // Route loader - runs on server
   export async function loader({ request }: LoaderFunctionArgs) {
     const session = await getSession(request);
     const cart = await getCart(session.id);
     return json({ cart });
   }

   // Route action - handles form submissions
   export async function action({ request }: ActionFunctionArgs) {
     const formData = await request.formData();
     await addToCart(formData.get('configurationId'));
     return redirect('/cart');
   }
   ```

3. **Progressive Enhancement**: Forms work without JavaScript
   - Critical for checkout reliability
   - Better accessibility
   - Works on slow connections

4. **Session Handling**: Built-in cookie session management
   ```typescript
   import { createCookieSessionStorage } from '@remix-run/node';

   export const sessionStorage = createCookieSessionStorage({
     cookie: {
       name: 'aiprintly_session',
       httpOnly: true,
       secure: true,
       sameSite: 'lax',
       maxAge: 60 * 60 * 24 * 7, // 7 days
     },
   });
   ```

5. **Streaming**: Native support for AI generation progress
   ```typescript
   export async function loader() {
     return new Response(
       new ReadableStream({
         async start(controller) {
           for await (const chunk of generateImage()) {
             controller.enqueue(chunk);
           }
           controller.close();
         },
       }),
       { headers: { 'Content-Type': 'text/event-stream' } }
     );
   }
   ```

---

## Database: PostgreSQL (Supabase)

### Why PostgreSQL

- **Relational**: Complex relationships (orders → items → configurations)
- **JSON support**: Flexible for customisation data, page content
- **Proven**: Battle-tested at scale
- **Tooling**: Excellent Prisma support

### Why Supabase over Alternatives

| Aspect | Supabase | Neon | PlanetScale |
|--------|----------|------|-------------|
| Database | PostgreSQL | PostgreSQL | MySQL |
| Pricing | Generous free tier | Usage-based | Connection-based |
| Features | Auth, Storage, Edge Functions | Pure database | Pure database |
| Branching | Coming | Yes | Yes |
| UK region | Yes | Yes | Yes |

**Decision**: Supabase for its generous free tier and built-in features. Can migrate to Neon for branching if needed.

---

## ORM: Prisma

### Why Prisma

1. **Type Safety**: Generated types from schema
   ```typescript
   // Prisma generates types
   const user: User = await prisma.user.findUnique({
     where: { id: userId },
     include: { sessions: true },
   });
   // TypeScript knows user.sessions exists
   ```

2. **Migrations**: Declarative schema changes
   ```prisma
   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     sessions  Session[]
     // Add new field
     credits   UserCredits?
   }
   ```
   ```bash
   prisma migrate dev --name add-credits
   ```

3. **Query Building**: Intuitive API
   ```typescript
   const orders = await prisma.order.findMany({
     where: {
       userId,
       status: { in: ['PAID', 'PROCESSING'] },
       createdAt: { gte: lastMonth },
     },
     orderBy: { createdAt: 'desc' },
     include: {
       items: {
         include: { configuration: true },
       },
     },
   });
   ```

### Alternatives Considered

- **Drizzle**: Lighter weight, closer to SQL. Chose Prisma for better tooling.
- **Kysely**: Type-safe SQL builder. Chose Prisma for schema management.

---

## Styling: Tailwind CSS v4

### Why Tailwind

1. **Utility-first**: Rapid prototyping
   ```tsx
   <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
     Add to Cart
   </button>
   ```

2. **Design System**: Consistent spacing, colours, typography
   ```js
   // tailwind.config.js
   export default {
     theme: {
       extend: {
         colors: {
           brand: {
             50: '#f0f9ff',
             500: '#0ea5e9',
             900: '#0c4a6e',
           },
         },
       },
     },
   };
   ```

3. **v4 Benefits**: CSS variables, cascade layers, better performance

### Component Library

Use **shadcn/ui** for accessible, customisable components:
- Button, Input, Select, Dialog, Toast
- Built on Radix UI primitives
- Full Tailwind styling

---

## File Storage: Cloudflare R2

### Why R2 over S3

| Aspect | Cloudflare R2 | AWS S3 |
|--------|---------------|--------|
| Egress | Free | £0.09/GB |
| Storage | £0.015/GB | £0.023/GB |
| S3 compatible | Yes | Yes |
| CDN | Included | Extra (CloudFront) |
| UK region | Yes | Yes |

**Decision**: R2 for zero egress costs (significant for image-heavy app).

### Implementation

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `https://${R2_PUBLIC_DOMAIN}/${key}`;
}
```

---

## AI Image Generation: Replicate (SDXL)

### Why Replicate

1. **Cost**: ~£0.02/image vs £0.04 for DALL-E 3
2. **Flexibility**: Multiple models (SDXL, Flux, custom)
3. **Quality**: SDXL produces print-quality output
4. **API**: Simple prediction API

### Implementation

```typescript
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

export async function generateImage(
  prompt: string,
  style: string
): Promise<string[]> {
  const output = await replicate.run(
    'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    {
      input: {
        prompt: `${prompt}, ${getStyleModifier(style)}`,
        negative_prompt: 'blurry, low quality, distorted',
        width: 2048,
        height: 2048,
        num_outputs: 4,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      },
    }
  );

  return output as string[];
}
```

### Fallback Providers

Provider priority order:
1. **Replicate (SDXL)**: Primary, cost-effective
2. **OpenAI (DALL-E 3)**: Higher quality fallback
3. **Stability AI**: Alternative backend

```typescript
const providers = [
  new ReplicateProvider(),
  new OpenAIProvider(),
  new StabilityProvider(),
];

async function generateWithFallback(params: GenerationParams) {
  for (const provider of providers) {
    try {
      return await provider.generate(params);
    } catch (error) {
      console.warn(`${provider.name} failed, trying next`);
    }
  }
  throw new Error('All providers failed');
}
```

---

## AI Text Generation: OpenAI GPT-4

### Why GPT-4

1. **Quality**: Best for coherent story generation
2. **JSON mode**: Reliable structured output
3. **Context length**: Handles full story outlines

### Implementation

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function generateStory(params: StoryParams): Promise<Story> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: STORY_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: formatStoryRequest(params),
      },
    ],
    temperature: 0.8,
    max_tokens: 4000,
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

---

## Email: Resend

### Why Resend

1. **Developer experience**: Simple API, React templates
2. **Pricing**: 100 emails/day free, then £0.001/email
3. **Deliverability**: Good reputation
4. **UK servers**: GDPR compliant

### Implementation

```typescript
import { Resend } from 'resend';
import { OrderConfirmationEmail } from './templates/order-confirmation';

const resend = new Resend(RESEND_API_KEY);

export async function sendOrderConfirmation(order: Order): Promise<void> {
  await resend.emails.send({
    from: 'AIPrintly <orders@aiprintly.co.uk>',
    to: order.customerEmail,
    subject: `Order Confirmed - ${order.orderNumber}`,
    react: OrderConfirmationEmail({ order }),
  });
}
```

---

## Deployment: Fly.io

### Why Fly.io

1. **Global edge**: Deploy close to users
2. **Remix support**: First-class integration
3. **Pricing**: Generous free tier, pay-as-you-go
4. **Simplicity**: `fly deploy` workflow

### Alternatives

| Platform | Pros | Cons |
|----------|------|------|
| Fly.io | Fast, global, Docker | Learning curve |
| Vercel | Easy, CI/CD | Vendor lock-in, cost at scale |
| Cloudflare Pages | Edge, cheap | Limited compute |
| Railway | Simple | Less mature |

**Decision**: Fly.io for flexibility and global deployment.

### Configuration

```toml
# fly.toml
app = "aiprintly"
primary_region = "lhr"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

---

## Image Processing: Sharp

### Why Sharp

1. **Performance**: 10-100x faster than alternatives
2. **Features**: Resize, convert, optimise
3. **Memory efficient**: Streams large images
4. **Format support**: JPEG, PNG, WebP, HEIC

### Implementation

```typescript
import sharp from 'sharp';

export async function processUpload(
  buffer: Buffer,
  maxDimension: number = 4096
): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if necessary
  let processed = image;
  if (
    (metadata.width ?? 0) > maxDimension ||
    (metadata.height ?? 0) > maxDimension
  ) {
    processed = image.resize(maxDimension, maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to PNG for consistency
  const outputBuffer = await processed.png().toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMetadata.width!,
    height: outputMetadata.height!,
    format: 'png',
  };
}
```

---

## Testing: Vitest + Playwright

### Unit/Integration: Vitest

```typescript
// __tests__/credits.test.ts
import { describe, it, expect } from 'vitest';
import { deductCredits, refundCredits } from '../lib/credits';

describe('Credit System', () => {
  it('deducts credits for generation', async () => {
    const credits = await getCredits(sessionId);
    await deductCredits(sessionId, 2, 'generation');
    const updated = await getCredits(sessionId);
    expect(updated.balance).toBe(credits.balance - 2);
  });

  it('refunds credits on failure', async () => {
    const credits = await getCredits(sessionId);
    await deductCredits(sessionId, 2, 'generation');
    await refundCredits(sessionId, 2, 'refund');
    const updated = await getCredits(sessionId);
    expect(updated.balance).toBe(credits.balance);
  });
});
```

### E2E: Playwright

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await page.goto('/create/upload');
  await page.setInputFiles('input[type="file"]', 'test-image.png');
  await page.click('text=Continue');

  await page.click('text=Mug');
  await page.click('text=Add to Cart');

  await page.goto('/cart');
  await page.click('text=Checkout');

  // Fill registration
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('text=Create Account');

  // Stripe redirect handled by test fixtures
  await expect(page).toHaveURL(/checkout\/success/);
});
```

---

## Monitoring & Observability

### Error Tracking: Sentry

```typescript
import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export function captureError(error: Error, context?: object): void {
  Sentry.captureException(error, { extra: context });
}
```

### Analytics: Plausible

Privacy-friendly, GDPR compliant.

```html
<script defer data-domain="aiprintly.co.uk" src="https://plausible.io/js/script.js"></script>
```

### Uptime: Better Uptime

- Health check endpoint monitoring
- Incident alerting
- Status page

---

## Security Considerations

### Environment Variables

- All secrets in `.env` (never committed)
- Fly.io secrets management
- Rotation strategy for API keys

### Input Validation

```typescript
import { z } from 'zod';

const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    f => f.size <= 25 * 1024 * 1024,
    'File must be under 25MB'
  ),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  shippingAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i),
    country: z.literal('GB'),
  }),
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many generation requests',
});
```

---

## Cost Estimates (Monthly)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Supabase | 500MB, 2GB transfer | £0 (MVP) |
| Cloudflare R2 | 10GB storage | £0 (MVP) |
| Fly.io | 3 shared VMs | £0 (MVP) |
| Replicate | Pay-as-you-go | £50-100 |
| OpenAI | Pay-as-you-go | £20-50 |
| Resend | 100/day free | £0 (MVP) |
| Sentry | 5K errors/month | £0 |
| Plausible | — | £9/month |

**Total estimated**: £80-160/month at MVP scale

---

*Last updated: 2025-01-18*
