# AI Generation (Phase 1)

Specifications for AI image and story generation, including cost control, credit system, and provider abstraction.

---

## Overview

AI generation is a core feature of AIPrintly, enabling users to create unique images and stories for their products. This document covers:

1. Provider-agnostic architecture
2. Image generation specifications
3. Story generation specifications
4. Credit system for cost control
5. Rate limiting and abuse prevention
6. Error handling and retries

---

## Credit System

### Rationale

AI generation incurs real API costs. To prevent abuse and control costs, we implement a lightweight credit system for MVP.

### Credit Allowances

| User Type | Initial Credits | Refresh |
|-----------|-----------------|---------|
| Guest (session-based) | 3 credits | None |
| Registered user | 10 credits | None (MVP) |
| Paid user (future) | Subscription-based | Monthly |

### Credit Costs

| Action | Credits |
|--------|---------|
| Generate single image | 1 credit |
| Generate image batch (4 variants) | 2 credits |
| Generate story outline | 1 credit |
| Generate story illustrations (per page) | 1 credit |
| Full storybook (12 pages + cover) | 15 credits |

### Credit Flow

```
User initiates generation
        │
        ▼
┌───────────────────────────────────────┐
│   Check credit balance                │
│   SELECT credits FROM user_credits    │
│   WHERE session_id = ? OR user_id = ? │
└───────────────────────────────────────┘
        │
        ├── Insufficient credits
        │       │
        │       ▼
        │   ┌───────────────────────────┐
        │   │   Credit Gate UI          │
        │   │                           │
        │   │   "You've used all your   │
        │   │    free generations"      │
        │   │                           │
        │   │   Guest: [Create Account] │
        │   │   User:  [Get More] (TBD) │
        │   └───────────────────────────┘
        │
        └── Sufficient credits
                │
                ▼
        Reserve credits (optimistic deduct)
                │
                ▼
        Execute generation
                │
                ├── Success ──► Confirm deduction
                │
                └── Failure ──► Refund credits
```

### Credit Data Model

Add to `03-data-model.md`:

```prisma
model UserCredits {
  id          String   @id @default(uuid())
  sessionId   String?  @unique @map("session_id")
  userId      String?  @unique @map("user_id")
  balance     Int      @default(3)
  totalUsed   Int      @default(0) @map("total_used")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  session     Session? @relation(fields: [sessionId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])

  @@map("user_credits")
}

model CreditTransaction {
  id            String   @id @default(uuid())
  userCreditsId String   @map("user_credits_id")
  amount        Int      // Negative for deduction, positive for addition
  reason        String   // "generation", "signup_bonus", "refund", "purchase"
  jobId         String?  @map("job_id") // FK to generation_jobs
  createdAt     DateTime @default(now()) @map("created_at")

  userCredits   UserCredits @relation(fields: [userCreditsId], references: [id])

  @@index([userCreditsId])
  @@map("credit_transactions")
}
```

### Credit Migration (Guest to User)

When guest creates account:
1. Check if user already has credits record
2. If not, migrate guest credits to user
3. Add signup bonus (+7 credits for registered users)
4. Log transaction with reason "signup_bonus"

---

## Provider-Agnostic Architecture

### Design Principles

1. **Interface-first**: All providers implement the same interface
2. **Config-driven**: Provider selection via environment variable
3. **Hot-swappable**: Change providers without code changes
4. **Cost-aware**: Track per-provider costs for optimisation

### Provider Interface

```typescript
interface AIImageProvider {
  name: string;
  costPerGeneration: number; // Pence

  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
  checkJobStatus(jobId: string): Promise<JobStatus>;
  estimateCost(params: ImageGenerationParams): number;
}

interface AITextProvider {
  name: string;
  costPerToken: number; // Pence per 1000 tokens

  generateStory(params: StoryGenerationParams): Promise<StoryGenerationResult>;
  estimateCost(params: StoryGenerationParams): number;
}

interface ImageGenerationParams {
  prompt: string;
  style: StylePreset;
  width: number;
  height: number;
  numVariations: number;
  negativePrompt?: string;
  referenceImageUrl?: string;
}

interface StoryGenerationParams {
  childName: string;
  childAge?: number;
  theme: StoryTheme;
  interests?: string[];
  pageCount: number;
  referenceImageUrl?: string;
}
```

### Supported Providers

| Provider | Type | Estimated Cost | Notes |
|----------|------|----------------|-------|
| **Replicate (SDXL)** | Image | ~£0.02/image | Primary, good quality |
| **OpenAI DALL-E 3** | Image | ~£0.04/image | Higher quality, more expensive |
| **Stability AI** | Image | ~£0.02/image | Alternative to Replicate |
| **Hugging Face** | Image | ~£0.01/image | Budget option, variable quality |
| **OpenAI GPT-4** | Text | ~£0.03/1K tokens | Primary for stories |
| **Claude** | Text | ~£0.03/1K tokens | Alternative for stories |

### Provider Selection

```typescript
// Environment configuration
AI_IMAGE_PROVIDER=replicate  // or "openai", "stability", "huggingface"
AI_TEXT_PROVIDER=openai      // or "claude"

// Provider factory
function getImageProvider(): AIImageProvider {
  switch (process.env.AI_IMAGE_PROVIDER) {
    case 'replicate':
      return new ReplicateSDXLProvider();
    case 'openai':
      return new OpenAIDallEProvider();
    case 'stability':
      return new StabilityAIProvider();
    case 'huggingface':
      return new HuggingFaceProvider();
    default:
      return new ReplicateSDXLProvider();
  }
}
```

---

## Image Generation

### Style Presets

| Style | Prompt Modifier | Best For |
|-------|-----------------|----------|
| Fantasy | "fantasy art, magical lighting, ethereal" | Storybooks, prints |
| Cartoon | "cartoon style, bold outlines, vibrant colours" | Mugs, kids apparel |
| Watercolour | "watercolour painting, soft edges, artistic" | Prints, canvas |
| Pop Art | "pop art, bold colours, graphic style" | Apparel, posters |
| Realistic | "photorealistic, highly detailed, 8k" | Photo prints |
| Anime | "anime style, detailed eyes, Japanese animation" | Apparel, posters |

### Generation Parameters

```typescript
const defaultParams = {
  width: 2048,
  height: 2048,
  numVariations: 4,
  negativePrompt: "blurry, low quality, distorted, watermark, signature",
  guidanceScale: 7.5,
  numInferenceSteps: 50,
};
```

### Quality Requirements

- Minimum resolution: 2048×2048 pixels
- Format: PNG (lossless) for storage, WebP for preview
- Colour space: sRGB
- No visible artefacts or distortions
- Suitable for print at 300 DPI (6.8" at minimum)

### Prompt Engineering

System prompt template:

```
You are generating images for print-on-demand products.
The image must be:
- High resolution and print-quality
- Centred composition suitable for product placement
- Free of text, watermarks, or signatures
- {style} style

User request: {userPrompt}
```

### Generation Workflow

```
┌───────────────────────────────────────────────────────────────┐
│                    IMAGE GENERATION PIPELINE                  │
└───────────────────────────────────────────────────────────────┘

1. VALIDATION
   └── Check credits available
   └── Sanitise prompt (remove prohibited content)
   └── Apply style preset modifiers

2. JOB CREATION
   └── Create GenerationJob record (status: PENDING)
   └── Reserve credits (deduct from balance)
   └── Log CreditTransaction

3. PROVIDER DISPATCH
   └── Select provider based on config
   └── Submit to provider API
   └── Store provider_job_id

4. POLLING (if async)
   └── Poll provider status every 2 seconds
   └── Update job status (PROCESSING)
   └── Timeout after 120 seconds

5. COMPLETION
   └── Download generated images
   └── Upload to R2 storage
   └── Create Asset records
   └── Update job status (COMPLETED)
   └── Confirm credit deduction

6. ERROR HANDLING
   └── On failure: refund credits
   └── Log error message
   └── Update job status (FAILED)
   └── Notify user
```

---

## Story Generation

### Story Structure

A story consists of:
- Title
- Cover page (image + title)
- Content pages (8-40 pages)
- Optional dedication page

### Generation Pipeline

```
┌───────────────────────────────────────────────────────────────┐
│                    STORY GENERATION PIPELINE                  │
└───────────────────────────────────────────────────────────────┘

1. STORY OUTLINE (1 credit)
   └── Generate plot structure with GPT-4
   └── Output: title, page texts, illustration prompts
   └── User can edit/approve

2. ILLUSTRATION GENERATION (1 credit per page)
   └── Queue illustration jobs
   └── Generate cover first (priority)
   └── Batch remaining pages (parallel, max 4 concurrent)
   └── User can regenerate individual pages

3. ASSEMBLY
   └── Combine text + illustrations
   └── Generate preview PDF
   └── Ready for storybook builder
```

### Story Prompt Template

```
You are a children's book author creating a personalised story.

Child's name: {childName}
Child's age: {childAge}
Theme: {theme}
Interests: {interests}
Page count: {pageCount}

Create a {pageCount}-page story with:
1. An engaging title
2. Age-appropriate language
3. A clear beginning, middle, and end
4. A positive, uplifting message
5. Opportunities for colourful illustrations

For each page, provide:
- Page text (2-4 sentences, simple vocabulary)
- Illustration prompt (detailed, for AI image generation)

Output as JSON:
{
  "title": "...",
  "pages": [
    {
      "pageNumber": 1,
      "type": "cover",
      "text": "...",
      "illustrationPrompt": "..."
    },
    ...
  ]
}
```

### Story Themes

| Theme | Age Range | Description |
|-------|-----------|-------------|
| Adventure | 3-8 | Exploration, discovery, bravery |
| Magic | 4-10 | Wizards, spells, enchanted worlds |
| Friendship | 3-7 | Making friends, cooperation |
| Learning | 3-6 | Counting, colours, ABCs |
| Animals | 2-6 | Animal friends, nature |
| Space | 5-10 | Astronauts, planets, exploration |

---

## Rate Limiting and Abuse Prevention

### Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Per session | 10 requests | 1 minute |
| Per IP address | 30 requests | 1 minute |
| Per user (authenticated) | 20 requests | 1 minute |
| Concurrent jobs per session | 3 | N/A |

### Abuse Detection

1. **Rapid-fire detection**: Block if >5 requests in 10 seconds
2. **Script detection**: Check for browser fingerprint, require CAPTCHA on suspicious patterns
3. **Content abuse**: Filter prompts for prohibited content
4. **Account farming**: Limit new account credits for 24 hours

### Implementation

```typescript
// Rate limiter middleware
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => req.session?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please wait before generating more images',
      retryAfter: 60,
    });
  },
});

// Concurrent job limiter
async function checkConcurrentJobs(sessionId: string): Promise<boolean> {
  const activeJobs = await prisma.generationJob.count({
    where: {
      sessionId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });
  return activeJobs < 3;
}
```

### Prohibited Content

Block prompts containing:
- Violence, gore, weapons
- Adult/sexual content
- Hate speech, discrimination
- Real people (celebrities, politicians)
- Copyrighted characters
- Illegal activities

```typescript
const prohibitedPatterns = [
  /\b(violence|gore|blood|weapon|gun|knife)\b/i,
  /\b(nude|naked|sexual|nsfw|porn)\b/i,
  /\b(hate|racist|nazi|terrorist)\b/i,
  // ... more patterns
];

function isProhibitedPrompt(prompt: string): boolean {
  return prohibitedPatterns.some(pattern => pattern.test(prompt));
}
```

---

## Cost Tracking

### Per-Job Cost Logging

```typescript
interface GenerationCost {
  jobId: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  imageCount: number;
  estimatedCostPence: number;
  actualCostPence?: number; // From provider billing
  timestamp: Date;
}
```

### Cost Monitoring

Track and alert on:
- Daily spend exceeding threshold (e.g., £50/day)
- Unusual spike in generation volume
- Provider cost changes

### Cost Optimisation Strategies

1. **Quality tiers**: Offer "quick" (fewer steps) vs "quality" (full steps)
2. **Caching**: Cache common style+prompt combinations
3. **Provider routing**: Route to cheaper providers for non-premium users
4. **Batch efficiency**: Batch similar requests where possible

---

## Error Handling

### Retry Strategy

```typescript
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'RATE_LIMITED',
    'TIMEOUT',
    'PROVIDER_UNAVAILABLE',
  ],
};
```

### Error Messages

| Error | User Message | Action |
|-------|--------------|--------|
| Rate limited | "We're a bit busy. Please try again in a moment." | Auto-retry |
| Content blocked | "This prompt isn't allowed. Please try something different." | Edit prompt |
| Generation failed | "Something went wrong. Your credit has been refunded." | Refund + retry |
| Provider down | "Service temporarily unavailable. Please try later." | Show status page |

### Fallback Providers

If primary provider fails, attempt fallback:

```typescript
const providerFallbackChain = ['replicate', 'stability', 'huggingface'];

async function generateWithFallback(params: ImageGenerationParams) {
  for (const providerName of providerFallbackChain) {
    try {
      const provider = getProvider(providerName);
      return await provider.generateImage(params);
    } catch (error) {
      if (isLastProvider(providerName)) throw error;
      console.warn(`Provider ${providerName} failed, trying next`);
    }
  }
}
```

---

## API Endpoints

### POST /api/generate/image

Request:
```json
{
  "prompt": "A magical unicorn in a forest",
  "style": "fantasy",
  "referenceImageUrl": null
}
```

Response:
```json
{
  "jobId": "uuid",
  "status": "PENDING",
  "estimatedTime": 30,
  "creditsDeducted": 2,
  "remainingCredits": 8
}
```

### GET /api/generate/image/:jobId

Response (in progress):
```json
{
  "jobId": "uuid",
  "status": "PROCESSING",
  "progress": 0.6
}
```

Response (completed):
```json
{
  "jobId": "uuid",
  "status": "COMPLETED",
  "results": [
    {
      "assetId": "uuid",
      "previewUrl": "https://...",
      "fullUrl": "https://..."
    }
  ]
}
```

### GET /api/credits

Response:
```json
{
  "balance": 8,
  "totalUsed": 2,
  "transactions": [
    {
      "amount": -2,
      "reason": "generation",
      "createdAt": "2025-01-18T10:00:00Z"
    }
  ]
}
```

---

## Future Considerations

### Phase 2+

- Credit purchase via Stripe
- Subscription tiers with monthly credits
- Rollover credits
- Bulk generation discounts
- API access for power users

### Provider Exploration

Continue evaluating:
- **Banana.dev**: Cost-effective GPU hosting
- **RunPod**: Serverless GPU
- **Nano Banana**: Lightweight inference
- **Self-hosted**: SDXL on own infrastructure for high volume

---

*Last updated: 2025-01-18*
