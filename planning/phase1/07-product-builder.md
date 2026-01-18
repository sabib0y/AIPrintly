# Product Builder (Phase 1)

Specifications for product customisation, preview, and mockup generation.

---

## Overview

The product builder allows users to:
1. Position their design on products
2. Select variants (size, colour, options)
3. Preview realistic mockups
4. Add configured products to cart

---

## Builder Types

### Standard Builder (Mugs, Apparel, Prints)

Single-asset placement on predefined print areas.

### Storybook Builder

Multi-page editor with text and illustration per page.

---

## Print Area Definitions

### Mug Print Areas

| Product | Print Area | Dimensions | Bleed |
|---------|------------|------------|-------|
| 11oz Mug | Wrap | 820×340px | 20px |
| 15oz Mug | Wrap | 920×380px | 20px |
| Travel Mug | Wrap | 1024×600px | 20px |

### Apparel Print Areas

| Position | Dimensions | Safe Area |
|----------|------------|-----------|
| Front | 4500×5400px | 3800×4600px |
| Back | 4500×5400px | 3800×4600px |
| Left Chest | 1000×1000px | 800×800px |
| Sleeve | 1800×1800px | 1500×1500px |

### Print/Poster Print Areas

| Size | Dimensions (300 DPI) | Bleed |
|------|----------------------|-------|
| A4 | 2480×3508px | 36px |
| A3 | 3508×4961px | 36px |
| A2 | 4961×7016px | 36px |
| 8×10" | 2400×3000px | 36px |
| 11×14" | 3300×4200px | 36px |

---

## Customisation Canvas

### UI Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT BUILDER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │                                                       │     │
│   │                   CANVAS AREA                         │     │
│   │                                                       │     │
│   │          ┌───────────────────────┐                    │     │
│   │          │                       │                    │     │
│   │          │    [User's Image]     │ ← Draggable        │     │
│   │          │     ⟲ Rotate handle   │                    │     │
│   │          │     ⤢ Scale handle    │                    │     │
│   │          │                       │                    │     │
│   │          └───────────────────────┘                    │     │
│   │                                                       │     │
│   │              Print Area Boundary                      │     │
│   │              (dashed outline)                         │     │
│   │                                                       │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Zoom: [−] ─────●───── [+]   Rotation: [⟲] 0°            │   │
│   │                                                         │   │
│   │ [Reset] [Centre] [Fit to Area]                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Variant Options:                                              │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │ Size: [M ▼] │ │ Colour: [●] │ │ Area: [Front│               │
│   └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Preview Mockup]                          £19.99              │
│                                                                 │
│   [Add to Cart]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Interaction Model

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | Click + drag | Touch + drag |
| Scale | Scroll wheel / corners | Pinch gesture |
| Rotate | Rotate handle / Shift+drag | Two-finger rotate |
| Reset | Double-click | Double-tap |

### Canvas State

```typescript
interface CanvasState {
  assetId: string;
  productId: string;
  variantId: string;
  printArea: string;
  transform: {
    x: number;      // 0-1, centre position
    y: number;      // 0-1, centre position
    scale: number;  // 0.1-3.0
    rotation: number; // -180 to 180 degrees
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Transform Constraints

```typescript
const constraints = {
  scale: { min: 0.1, max: 3.0 },
  rotation: { min: -180, max: 180 },
  position: {
    // Allow image to partially extend beyond print area
    minOverlap: 0.2, // 20% must remain visible
  },
};

function constrainTransform(
  transform: Transform,
  imageSize: Size,
  printArea: Size
): Transform {
  // Ensure minimum overlap
  const scaledWidth = imageSize.width * transform.scale;
  const scaledHeight = imageSize.height * transform.scale;

  const minX = (printArea.width * constraints.position.minOverlap) / scaledWidth;
  const maxX = 1 - minX;
  const minY = (printArea.height * constraints.position.minOverlap) / scaledHeight;
  const maxY = 1 - minY;

  return {
    ...transform,
    x: Math.max(minX, Math.min(maxX, transform.x)),
    y: Math.max(minY, Math.min(maxY, transform.y)),
    scale: Math.max(constraints.scale.min, Math.min(constraints.scale.max, transform.scale)),
    rotation: ((transform.rotation % 360) + 360) % 360 - 180,
  };
}
```

---

## Mockup Generation

### Client-Side Preview

Real-time preview using Canvas API for instant feedback.

```typescript
async function renderClientPreview(
  canvas: HTMLCanvasElement,
  productImage: HTMLImageElement,
  userDesign: HTMLImageElement,
  transform: Transform,
  printArea: PrintArea
): Promise<void> {
  const ctx = canvas.getContext('2d')!;

  // Draw product base
  ctx.drawImage(productImage, 0, 0);

  // Apply print area clip
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    printArea.x,
    printArea.y,
    printArea.width,
    printArea.height
  );
  ctx.clip();

  // Apply transform
  ctx.translate(
    printArea.x + printArea.width * transform.x,
    printArea.y + printArea.height * transform.y
  );
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.scale, transform.scale);

  // Draw user design centred
  ctx.drawImage(
    userDesign,
    -userDesign.width / 2,
    -userDesign.height / 2
  );

  ctx.restore();
}
```

### Server-Side Mockup (Printful)

High-quality mockups for cart and checkout.

```typescript
async function generatePrintfulMockup(
  productId: string,
  variantId: string,
  designUrl: string,
  transform: Transform
): Promise<string> {
  // Get print area spec
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  const printArea = product.metadata.printAreas[0];

  // Calculate position in Printful coordinates
  const position = {
    area_width: printArea.width,
    area_height: printArea.height,
    width: Math.round(printArea.width * transform.scale),
    height: Math.round(printArea.height * transform.scale),
    top: Math.round(printArea.height * transform.y - (printArea.height * transform.scale) / 2),
    left: Math.round(printArea.width * transform.x - (printArea.width * transform.scale) / 2),
  };

  // Request mockup from Printful
  const task = await printful.post(
    `/mockup-generator/create-task/${product.externalId}`,
    {
      variant_ids: [Number(variantId)],
      files: [{
        type: 'front', // or derived from printArea
        url: designUrl,
        position,
      }],
      format: 'png',
    }
  );

  // Poll for result
  const result = await pollMockupTask(task.task_key);
  return result.mockups[0].mockup_url;
}
```

### Mockup Caching

Cache mockups to reduce API calls.

```typescript
function getMockupCacheKey(
  productId: string,
  variantId: string,
  assetId: string,
  transform: Transform
): string {
  // Round transform values for cache stability
  const roundedTransform = {
    x: Math.round(transform.x * 100) / 100,
    y: Math.round(transform.y * 100) / 100,
    scale: Math.round(transform.scale * 100) / 100,
    rotation: Math.round(transform.rotation),
  };

  return `mockup:${productId}:${variantId}:${assetId}:${JSON.stringify(roundedTransform)}`;
}

async function getCachedMockup(key: string): Promise<string | null> {
  // Check R2/Redis cache
  return await cache.get(key);
}

async function cacheMockup(key: string, url: string): Promise<void> {
  // Cache for 24 hours
  await cache.set(key, url, { expiresIn: 86400 });
}
```

---

## Storybook Builder

### Page Editor

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORYBOOK BUILDER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Page Thumbnails:                                              │
│   [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]  [+]                   │
│    ↑                                                            │
│   current                                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │                                                       │     │
│   │                                                       │     │
│   │               [Illustration]                          │     │
│   │                                                       │     │
│   │                                                       │     │
│   │   ─────────────────────────────────────────────────   │     │
│   │                                                       │     │
│   │   "Once upon a time, in a magical forest,             │     │
│   │    there lived a brave little fox named Emma..."      │     │
│   │                                                       │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ [Replace Image] [Edit Text] [Regenerate] [Delete Page]  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Book Options:                                                 │
│   Cover: [Softcover ▼]    Pages: 12                            │
│                                                                 │
│   [Preview Book]                               £24.99           │
│                                                                 │
│   [Add to Cart]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page State

```typescript
interface StorybookPage {
  pageNumber: number;
  type: 'cover' | 'content' | 'back';
  layout: 'full-bleed' | 'image-top' | 'image-bottom' | 'text-only';
  assetId?: string;
  text?: string;
  textStyle?: {
    fontFamily: string;
    fontSize: number;
    colour: string;
    alignment: 'left' | 'centre' | 'right';
  };
}

interface StorybookState {
  title: string;
  coverType: 'softcover' | 'hardcover';
  pages: StorybookPage[];
  currentPage: number;
  childName: string;
  theme: string;
}
```

### Page Layouts

| Layout | Image Area | Text Area |
|--------|------------|-----------|
| Full Bleed | 100% | Overlay at bottom 20% |
| Image Top | 70% | Bottom 30% |
| Image Bottom | 70% | Top 30% |
| Text Only | 0% | 100% |

### Book Preview

Flip-through preview using CSS 3D transforms or library.

```typescript
interface BookPreviewProps {
  pages: StorybookPage[];
  currentSpread: number; // 0-indexed spread number
  onPageTurn: (direction: 'next' | 'prev') => void;
}

function BookPreview({ pages, currentSpread, onPageTurn }: BookPreviewProps) {
  // Group pages into spreads (left + right)
  const spreads = chunkArray(pages, 2);

  return (
    <div className="book-container">
      {spreads.map((spread, i) => (
        <div
          key={i}
          className={cn(
            'spread',
            i === currentSpread && 'active',
            i < currentSpread && 'turned'
          )}
        >
          <div className="page left">{renderPage(spread[0])}</div>
          <div className="page right">{renderPage(spread[1])}</div>
        </div>
      ))}
      <button onClick={() => onPageTurn('prev')}>Previous</button>
      <button onClick={() => onPageTurn('next')}>Next</button>
    </div>
  );
}
```

---

## Mobile Optimisation

### Touch Gestures

```typescript
import { useGesture } from '@use-gesture/react';

function useMobileCanvas(onTransformChange: (t: Transform) => void) {
  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      onTransformChange(t => ({
        ...t,
        x: t.x + x / canvasWidth,
        y: t.y + y / canvasHeight,
      }));
    },
    onPinch: ({ offset: [scale, angle] }) => {
      onTransformChange(t => ({
        ...t,
        scale: t.scale * scale,
        rotation: t.rotation + angle,
      }));
    },
  });

  return bind;
}
```

### Responsive Layout

- Mobile: Full-width canvas, controls below
- Tablet: Side-by-side canvas and controls
- Desktop: Large canvas with floating controls

```typescript
const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
};
```

---

## Variant Selection

### Size Selector

```typescript
interface SizeOption {
  id: string;
  name: string;
  label: string; // "S", "M", "L", "XL"
  available: boolean;
}

function SizeSelector({
  options,
  selected,
  onSelect,
}: {
  options: SizeOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="size-grid">
      {options.map(opt => (
        <button
          key={opt.id}
          className={cn(
            'size-btn',
            selected === opt.id && 'selected',
            !opt.available && 'unavailable'
          )}
          onClick={() => opt.available && onSelect(opt.id)}
          disabled={!opt.available}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

### Colour Selector

```typescript
interface ColourOption {
  id: string;
  name: string;
  hex: string;
  available: boolean;
}

function ColourSelector({
  options,
  selected,
  onSelect,
}: {
  options: ColourOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="colour-swatches">
      {options.map(opt => (
        <button
          key={opt.id}
          className={cn(
            'swatch',
            selected === opt.id && 'selected',
            !opt.available && 'unavailable'
          )}
          style={{ backgroundColor: opt.hex }}
          onClick={() => opt.available && onSelect(opt.id)}
          disabled={!opt.available}
          title={opt.name}
        >
          {selected === opt.id && <CheckIcon />}
        </button>
      ))}
    </div>
  );
}
```

---

## Price Display

Show dynamic pricing based on variant selection.

```typescript
interface PriceDisplayProps {
  basePrice: number;
  shippingEstimate: number;
  currency: string;
}

function PriceDisplay({ basePrice, shippingEstimate, currency }: PriceDisplayProps) {
  return (
    <div className="price-display">
      <div className="product-price">
        {formatCurrency(basePrice, currency)}
      </div>
      <div className="shipping-estimate">
        + {formatCurrency(shippingEstimate, currency)} shipping
      </div>
    </div>
  );
}

function formatCurrency(pence: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(pence / 100);
}
```

---

## Quality Warnings

Alert users when design quality may be insufficient.

```typescript
interface QualityWarning {
  type: 'resolution' | 'aspect' | 'cropping';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

function checkDesignQuality(
  asset: Asset,
  printArea: PrintArea,
  transform: Transform
): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  // Check resolution
  const effectiveWidth = asset.width * transform.scale;
  const effectiveHeight = asset.height * transform.scale;
  const requiredWidth = printArea.width;
  const requiredHeight = printArea.height;

  const dpi = Math.min(
    (effectiveWidth / requiredWidth) * 300,
    (effectiveHeight / requiredHeight) * 300
  );

  if (dpi < 150) {
    warnings.push({
      type: 'resolution',
      severity: 'error',
      message: 'Image quality is too low for printing. Please use a higher resolution image.',
    });
  } else if (dpi < 200) {
    warnings.push({
      type: 'resolution',
      severity: 'warning',
      message: 'Image may appear slightly pixelated when printed.',
    });
  }

  // Check aspect ratio mismatch
  const assetRatio = asset.width / asset.height;
  const areaRatio = printArea.width / printArea.height;

  if (Math.abs(assetRatio - areaRatio) > 0.5) {
    warnings.push({
      type: 'aspect',
      severity: 'info',
      message: 'Your image shape differs from the print area. Some areas may be cropped.',
    });
  }

  return warnings;
}
```

---

## Add to Cart Flow

```typescript
async function addToCart(canvasState: CanvasState): Promise<void> {
  // 1. Create/update product configuration
  const configuration = await api.post('/api/configurations', {
    productId: canvasState.productId,
    variantId: canvasState.variantId,
    assetId: canvasState.assetId,
    customisation: {
      position: { x: canvasState.transform.x, y: canvasState.transform.y },
      scale: canvasState.transform.scale,
      rotation: canvasState.transform.rotation,
      printArea: canvasState.printArea,
    },
  });

  // 2. Generate high-quality mockup for cart display
  const mockupUrl = await generateMockup(configuration.id);

  // 3. Update configuration with mockup
  await api.patch(`/api/configurations/${configuration.id}`, {
    mockupUrl,
  });

  // 4. Add to cart
  await api.post('/api/cart/items', {
    configurationId: configuration.id,
    quantity: 1,
  });

  // 5. Show success toast
  toast.success('Added to cart!');
}
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow keys | Move design (5px increments) |
| Shift + Arrows | Move design (1px increments) |
| +/- | Zoom in/out |
| R | Rotate 15° clockwise |
| Shift + R | Rotate 15° anticlockwise |
| Escape | Reset transform |
| Tab | Navigate controls |

### Screen Reader Support

```tsx
<div
  role="application"
  aria-label="Product design canvas"
  aria-describedby="canvas-instructions"
>
  <div id="canvas-instructions" className="sr-only">
    Use arrow keys to move your design, plus and minus to zoom,
    R to rotate. Press Escape to reset.
  </div>
  {/* Canvas content */}
</div>
```

---

*Last updated: 2025-01-18*
