/**
 * AvatarSelector Component
 *
 * Interactive avatar customisation UI with live preview.
 * GDPR-compliant alternative to photo uploads for storybook characters.
 */

import { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { AvatarPreview } from '~/components/storybook/AvatarPreview';
import type { AvatarConfig } from '~/components/storybook/types';
import {
  SKIN_TONES,
  HAIR_COLOURS,
  HAIR_STYLES,
  DEFAULT_AVATAR_CONFIG,
} from '~/components/storybook/types';

export interface AvatarSelectorProps {
  /** Current avatar configuration */
  value: AvatarConfig;
  /** Callback when configuration changes */
  onChange: (config: AvatarConfig) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AvatarSelector provides an interactive UI for customising avatars.
 *
 * Features:
 * - Gender/body type selection
 * - Skin tone picker (inclusive palette)
 * - Hair colour picker
 * - Hair style options (gender-specific)
 * - Live preview
 * - Mobile-friendly touch targets
 * - WCAG AA compliant
 *
 * @example
 * ```tsx
 * const [avatar, setAvatar] = useState(DEFAULT_AVATAR_CONFIG);
 *
 * <AvatarSelector value={avatar} onChange={setAvatar} />
 * ```
 */
export function AvatarSelector({ value, onChange, className }: AvatarSelectorProps) {
  // Get available hair styles for current gender
  const availableHairStyles = HAIR_STYLES[value.gender];

  // Handle gender change and adjust hair style if needed
  const handleGenderChange = (gender: AvatarConfig['gender']) => {
    const newAvailableStyles = HAIR_STYLES[gender];
    const isCurrentStyleAvailable = newAvailableStyles.some(
      (style) => style.value === value.hairStyle
    );

    onChange({
      ...value,
      gender,
      // Default to first available style if current style not available
      hairStyle: isCurrentStyleAvailable ? value.hairStyle : newAvailableStyles[0].value,
    });
  };

  return (
    <Card
      className={cn('w-full', className)}
      role="region"
      aria-label="Avatar customisation"
    >
      <CardHeader>
        <CardTitle>Customise Your Character</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live Preview */}
        <div className="flex justify-center">
          <AvatarPreview config={value} className="h-32 w-32" />
        </div>

        {/* Gender Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Gender / Body Type</Label>
          <div className="flex gap-2">
            <GenderButton
              label="Boy"
              gender="boy"
              selected={value.gender === 'boy'}
              onClick={() => handleGenderChange('boy')}
            />
            <GenderButton
              label="Girl"
              gender="girl"
              selected={value.gender === 'girl'}
              onClick={() => handleGenderChange('girl')}
            />
            <GenderButton
              label="Neutral"
              gender="neutral"
              selected={value.gender === 'neutral'}
              onClick={() => handleGenderChange('neutral')}
            />
          </div>
        </div>

        {/* Skin Tone Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Skin Tone</Label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((tone) => (
              <ColourSwatch
                key={tone.value}
                colour={tone.value}
                label={`Skin tone: ${tone.label}`}
                selected={value.skinTone === tone.value}
                onClick={() => onChange({ ...value, skinTone: tone.value })}
              />
            ))}
          </div>
        </div>

        {/* Hair Colour Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Hair Colour</Label>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLOURS.map((colour) => (
              <ColourSwatch
                key={colour.value}
                colour={colour.value}
                label={`Hair colour: ${colour.label}`}
                selected={value.hairColour === colour.value}
                onClick={() => onChange({ ...value, hairColour: colour.value })}
                fun={colour.fun}
              />
            ))}
          </div>
        </div>

        {/* Hair Style Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Hair Style</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableHairStyles.map((style) => (
              <Button
                key={style.value}
                type="button"
                variant={value.hairStyle === style.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...value, hairStyle: style.value })}
                data-selected={value.hairStyle === style.value}
                className="transition-all duration-200"
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Gender selection button
 */
interface GenderButtonProps {
  label: string;
  gender: AvatarConfig['gender'];
  selected: boolean;
  onClick: () => void;
}

function GenderButton({ label, gender, selected, onClick }: GenderButtonProps) {
  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      size="default"
      onClick={onClick}
      data-selected={selected}
      aria-label={label}
      className="flex-1 transition-all duration-200"
    >
      <span className="mr-2">{getGenderIcon(gender)}</span>
      {label}
    </Button>
  );
}

/**
 * Colour swatch button
 */
interface ColourSwatchProps {
  colour: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  fun?: boolean;
}

function ColourSwatch({ colour, label, selected, onClick, fun }: ColourSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-selected={selected}
      className={cn(
        'group relative h-10 w-10 rounded-full border-2 transition-all duration-200',
        'hover:scale-110 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
        selected
          ? 'border-sky-600 shadow-lg ring-2 ring-sky-600 ring-offset-2'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
      )}
    >
      <div
        data-swatch
        className="h-full w-full rounded-full"
        style={{ backgroundColor: colour }}
      />
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckIcon className="h-5 w-5 text-white drop-shadow-md" />
        </div>
      )}
      {fun && (
        <div className="absolute -right-1 -top-1">
          <SparkleIcon className="h-4 w-4 text-amber-400" />
        </div>
      )}
    </button>
  );
}

/**
 * Get gender icon emoji
 */
function getGenderIcon(gender: AvatarConfig['gender']): string {
  switch (gender) {
    case 'boy':
      return '👦';
    case 'girl':
      return '👧';
    case 'neutral':
      return '🧒';
    default:
      return '🧒';
  }
}

/**
 * Check icon for selected state
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Sparkle icon for fun colours
 */
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default AvatarSelector;
