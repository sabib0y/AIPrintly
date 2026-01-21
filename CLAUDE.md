# AIPrintly - Project-Specific Claude Instructions

## Project Overview

**AIPrintly** is an AI-powered merchandise creation and fulfilment platform (Phase 1 MVP). Users can create custom print products by uploading images or using AI generation, with fulfilment through Printful (mugs, apparel, prints) and Blurb (storybooks), and payments via Stripe.

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React Router 7.12.0 (Full-stack React) |
| Language | TypeScript 5.9 (strict mode) |
| UI | React 19 + TailwindCSS 4 + Radix UI |
| Database | PostgreSQL (Supabase) via Prisma 6 |
| Build Tool | Vite 7 |
| Testing | Vitest + Testing Library + JSDOM |
| Validation | Zod |
| Icons | Lucide React |

## Project Structure

```
app/
├── components/
│   ├── ui/           # Reusable UI components (button, card, input, etc.)
│   ├── layout/       # Layout components (Header, Footer, Navigation)
│   └── error-boundary.tsx
├── routes/           # Page routes and API handlers
├── services/         # Server-side services (auth, session, prisma)
├── lib/              # Utility functions
└── test/             # Test setup and utilities

__tests__/            # Test files (mirrors app structure)
prisma/               # Database schema
planning/phase1/      # Phase documentation and specs
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run start            # Run production server
npm run typecheck        # TypeScript validation

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migrations
npm run db:studio        # Open Prisma Studio UI

# Testing
npm run test             # Run Vitest
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## Testing Requirements

- **Coverage Threshold**: 80% for lines, functions, branches, statements
- **Test Location**: `__tests__/` directory mirroring `app/` structure
- **Pattern**: `*.test.ts` or `*.test.tsx`
- **Run Specific Tests**: `npm run test -- path/to/specific/test`

### Test File Naming Convention
```
app/components/ui/button.tsx → __tests__/components/ui/button.test.tsx
app/services/auth.server.ts  → __tests__/services/auth.server.test.ts
app/routes/cart.tsx          → __tests__/routes/cart.test.tsx
```

## Code Patterns & Conventions

### Imports
```typescript
// External packages first
import { useState } from 'react';
import { json, redirect } from 'react-router';

// Internal modules with ~ alias
import { Button } from '~/components/ui/button';
import { requireAuth } from '~/services/auth.server';
import { cn } from '~/lib/utils';
```

### Component Structure
```typescript
// Functional components with TypeScript interfaces
interface ComponentProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export function Component({ variant = 'default', children }: ComponentProps) {
  // Implementation
}
```

### Route Structure (React Router 7)
```typescript
// Loader for data fetching
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

// Action for mutations
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // Handle form submission
  return redirect('/success');
}

// Component with typed loader data
export default function RoutePage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return <div>{/* UI */}</div>;
}
```

### Server-Side Code
```typescript
// Files ending in .server.ts are server-only
// app/services/auth.server.ts
export async function requireAuth(request: Request) {
  const session = await getSession(request);
  if (!session.userId) {
    throw redirect('/login');
  }
  return session;
}
```

## UI Component Library

### Available Components (Radix UI-based)
- `Button` - Primary action buttons with variants
- `Card`, `CardHeader`, `CardContent`, `CardFooter` - Content containers
- `Input` - Form inputs
- `Label` - Form labels
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` - Dropdown selects
- `Dialog`, `DialogTrigger`, `DialogContent` - Modal dialogs
- `DropdownMenu` - Dropdown menus
- `Toast` - Notifications
- `Avatar` - User avatars
- `Form` components - Form handling

### Styling with TailwindCSS
```typescript
import { cn } from '~/lib/utils';

// Use cn() for conditional classes
<div className={cn(
  'base-classes',
  variant === 'primary' && 'primary-classes',
  className
)} />
```

## Database (Prisma)

### Key Models
- **User** - Authentication and accounts
- **Session** - Cart persistence, guest support
- **Asset** - Image uploads with storage tiers (HOT/WARM/COLD)
- **GenerationJob** - AI generation tracking
- **Product** / **ProductVariant** - Product catalogue
- **ProductConfiguration** - User customisations
- **StorybookProject** - Storybook products
- **CartItem** - Shopping cart items
- **Order** / **OrderItem** - Completed orders
- **UserCredits** / **CreditTransaction** - AI credit system

### Prisma Client Usage
```typescript
import { prisma } from '~/services/prisma.server';

// Always use in server-side code only
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { credits: true }
});
```

## Environment Variables

Required in `.env`:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Application
APP_URL="http://localhost:5173"
NODE_ENV="development"
SESSION_SECRET="your-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI Providers
REPLICATE_API_TOKEN="..."
AI_IMAGE_PROVIDER="replicate"

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="..."

# Fulfilment
PRINTFUL_API_KEY="..."
BLURB_API_KEY="..."
```

## Key Architectural Decisions

1. **React Router 7** - Full-stack framework with loaders/actions
2. **Server-side services** - Auth, session, database isolated in `app/services/`
3. **Radix UI** - Accessible, unstyled components as base
4. **Prisma** - Type-safe database access
5. **Session-based carts** - Guest checkout support
6. **Storage tiers** - HOT/WARM/COLD asset retention
7. **Credit system** - AI generation rate limiting

## Phase 1 MVP Scope

### In Scope
- Landing page with product categories
- Product browser (mugs, t-shirts, prints, storybooks)
- Creation hub (upload or AI generate)
- Product builder/customisation
- Shopping cart
- Stripe checkout
- User authentication
- Order tracking
- Printful/Blurb fulfilment

### Out of Scope (Phase 2+)
- Social features
- Subscription model
- Advanced analytics
- Mobile app
- Multi-language support

## Session Context — Read These First

At the start of each session, read these files to understand current progress:

1. **`planning/phase1/progress-log.md`** — Chronological engineering log with what's been done
2. **`planning/phase1/10-roadmap.md`** — Master roadmap with workstream status
3. **`.dashboard/state.json`** — Machine-readable project state (tasks, tests, notes)

Use `/wake` command for a quick session briefing, `/track` to update progress, `/sleep` to wrap up.

## Planning Documents

Reference these in `planning/phase1/`:
- `01-overview.md` - MVP deliverables
- `02-sitemap.md` - Site structure
- `03-data-model.md` - Database design
- `04-user-flows.md` - User journeys
- `05-ai-generation.md` - AI generation specs
- `06-fulfilment-integration.md` - Printful/Blurb integration
- `07-product-builder.md` - Product customisation
- `08-checkout-and-orders.md` - Payment and orders
- `10-roadmap.md` - Master roadmap with parallel workstreams

## Error Handling

```typescript
// In loaders/actions
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  throw json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
```

## Commit Message Format

```
feat: add product builder canvas component
fix: resolve cart quantity update issue
refactor: extract pricing logic to utility
test: add integration tests for checkout flow
docs: update API documentation
chore: upgrade dependencies
```

## Quick Reference

- **Path alias**: `~/*` → `./app/*`
- **Dark mode**: Supported via TailwindCSS
- **Form validation**: Zod schemas
- **Icons**: Lucide React (e.g., `<ShoppingCart />`)
- **Class merging**: `cn()` from `~/lib/utils`
