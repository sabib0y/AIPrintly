# Avatar Selector Component Usage Guide

## Overview

The Avatar Selector provides a GDPR-compliant alternative to photo uploads for storybook character customisation. Instead of uploading children's photos, users can create custom illustrated avatars with various appearance options.

## Components

### 1. AvatarPreview

Renders an SVG-based avatar with composable parts.

```tsx
import { AvatarPreview } from '~/components/storybook/AvatarPreview';

<AvatarPreview
  config={{
    gender: 'girl',
    skinTone: '#D08B5B',
    hairColour: '#8B4513',
    hairStyle: 'ponytail'
  }}
  className="w-32 h-32"
/>
```

### 2. AvatarSelector

Interactive customisation UI with live preview.

```tsx
import { useState } from 'react';
import { AvatarSelector } from '~/components/storybook/AvatarSelector';
import { DEFAULT_AVATAR_CONFIG } from '~/components/storybook/types';

function CharacterCreator() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_CONFIG);

  return (
    <AvatarSelector
      value={avatar}
      onChange={setAvatar}
    />
  );
}
```

## Available Options

### Gender / Body Type
- **Boy**: Blue clothing
- **Girl**: Pink clothing
- **Neutral**: Purple clothing

### Skin Tones (6 options)
- Light (`#FFDBB4`)
- Light Medium (`#EDB98A`)
- Medium (`#D08B5B`) - Default
- Medium Dark (`#AE5D29`)
- Dark (`#694D3D`)
- Very Dark (`#3C2415`)

### Hair Colours (8 options)
- Blonde (`#F5DEB3`)
- Brown (`#8B4513`) - Default
- Black (`#1C1C1C`)
- Red (`#B22222`)
- Auburn (`#A0522D`)
- Grey (`#808080`)
- Blue (`#4169E1`) - Fun option ✨
- Pink (`#FF69B4`) - Fun option ✨

### Hair Styles (Gender-specific)

**Boy:**
- Short, Medium, Curly, Long

**Girl:**
- Short, Medium, Long, Curly, Ponytail, Braids

**Neutral:**
- Short, Medium, Long, Curly

## Integration with Storybook Builder

The avatar configuration should be stored in the `StorybookProject.pages` JSON field for each character.

### Example: Storing Avatar in Database

```typescript
// When creating a storybook page
import type { AvatarConfig } from '~/components/storybook/types';

interface PageContent {
  characterAvatar?: AvatarConfig;
  text?: string;
  imageUrl?: string;
}

const pageContent: PageContent = {
  characterAvatar: {
    gender: 'girl',
    skinTone: '#D08B5B',
    hairColour: '#8B4513',
    hairStyle: 'ponytail'
  },
  text: 'Once upon a time...'
};

// Store in Prisma
await prisma.storybookProject.update({
  where: { id: projectId },
  data: {
    pages: {
      // Update pages JSON with character avatar
      ...existingPages,
      [pageId]: pageContent
    }
  }
});
```

### Example: Toggle Between Photo and Avatar

```tsx
import { useState } from 'react';
import { AvatarSelector } from '~/components/storybook/AvatarSelector';
import { DEFAULT_AVATAR_CONFIG } from '~/components/storybook/types';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';

function CharacterInput() {
  const [mode, setMode] = useState<'avatar' | 'photo'>('avatar');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_CONFIG);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="link"
          onClick={() => setMode(mode === 'avatar' ? 'photo' : 'avatar')}
        >
          {mode === 'avatar' ? 'Use photo instead' : 'Use avatar instead'}
        </Button>
      </div>

      {mode === 'avatar' ? (
        <AvatarSelector value={avatar} onChange={setAvatar} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="photo">Upload Photo</Label>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
        </div>
      )}
    </div>
  );
}
```

## AI Generation Integration

When sending avatar configuration to AI generation services:

```typescript
import type { AvatarConfig } from '~/components/storybook/types';

function generateAvatarPrompt(config: AvatarConfig): string {
  const { gender, skinTone, hairColour, hairStyle } = config;

  const genderDescriptor = {
    boy: 'young boy',
    girl: 'young girl',
    neutral: 'young child'
  }[gender];

  const hairStyleDescriptor = {
    short: 'short hair',
    medium: 'medium-length hair',
    long: 'long hair',
    curly: 'curly hair',
    ponytail: 'hair in a ponytail',
    braids: 'braided hair'
  }[hairStyle];

  return `Illustration of a ${genderDescriptor} with ${hairStyleDescriptor}, children's book style, friendly and colourful, high quality digital art`;
}

// Usage
const prompt = generateAvatarPrompt(avatar);
// Send prompt to AI generation service (Replicate, etc.)
```

## Accessibility Features

- All interactive elements have proper ARIA labels
- Keyboard navigation support
- Touch targets meet minimum size requirements (44x44px)
- Colour contrast meets WCAG AA standards
- Focus indicators are clearly visible
- Screen reader announcements for selection changes

## Testing

Comprehensive test coverage (53 tests):
- Rendering and layout
- User interactions
- Colour selection
- Hair style availability per gender
- Accessibility requirements
- Edge cases

Run tests:
```bash
npm run test -- __tests__/components/storybook/Avatar
```

## Future Enhancements

1. **Additional Options**:
   - Accessories (glasses, hats)
   - Different facial expressions
   - Clothing colours/styles

2. **Export Features**:
   - Export avatar as PNG/SVG
   - Download avatar configuration as JSON

3. **Preset Avatars**:
   - Quick-select popular combinations
   - Character templates

4. **Animation**:
   - Animated transitions when changing options
   - Subtle avatar animations (blinking, etc.)

## API Reference

### Types

```typescript
interface AvatarConfig {
  gender: 'boy' | 'girl' | 'neutral';
  skinTone: string; // Hex colour
  hairColour: string; // Hex colour
  hairStyle: 'short' | 'medium' | 'long' | 'curly' | 'ponytail' | 'braids';
}
```

### Constants

```typescript
import {
  DEFAULT_AVATAR_CONFIG,
  SKIN_TONES,
  HAIR_COLOURS,
  HAIR_STYLES
} from '~/components/storybook/types';
```

## Support

For issues or questions about the avatar selector components, please refer to:
- Component source: `app/components/storybook/AvatarSelector.tsx`
- Test files: `__tests__/components/storybook/Avatar*.test.tsx`
- Type definitions: `app/components/storybook/types.ts`
