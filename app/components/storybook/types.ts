/**
 * Storybook Component Types
 *
 * Type definitions for storybook-related components
 */

/**
 * Avatar customisation configuration
 * Used for GDPR-compliant character representation in storybooks
 */
export interface AvatarConfig {
  /** Gender/body type presentation */
  gender: 'boy' | 'girl' | 'neutral';
  /** Skin tone as hex colour */
  skinTone: string;
  /** Hair colour as hex colour */
  hairColour: string;
  /** Hair style option */
  hairStyle: 'short' | 'medium' | 'long' | 'curly' | 'ponytail' | 'braids';
}

/**
 * Predefined skin tone palette (inclusive spectrum)
 */
export const SKIN_TONES = [
  { label: 'Light', value: '#FFDBB4' },
  { label: 'Light Medium', value: '#EDB98A' },
  { label: 'Medium', value: '#D08B5B' },
  { label: 'Medium Dark', value: '#AE5D29' },
  { label: 'Dark', value: '#694D3D' },
  { label: 'Very Dark', value: '#3C2415' },
] as const;

/**
 * Predefined hair colour palette
 */
export const HAIR_COLOURS = [
  { label: 'Blonde', value: '#F5DEB3' },
  { label: 'Brown', value: '#8B4513' },
  { label: 'Black', value: '#1C1C1C' },
  { label: 'Red', value: '#B22222' },
  { label: 'Auburn', value: '#A0522D' },
  { label: 'Grey', value: '#808080' },
  { label: 'Blue', value: '#4169E1', fun: true },
  { label: 'Pink', value: '#FF69B4', fun: true },
] as const;

/**
 * Hair style options by gender
 */
export const HAIR_STYLES = {
  boy: [
    { label: 'Short', value: 'short' as const },
    { label: 'Medium', value: 'medium' as const },
    { label: 'Curly', value: 'curly' as const },
    { label: 'Long', value: 'long' as const },
  ],
  girl: [
    { label: 'Short', value: 'short' as const },
    { label: 'Medium', value: 'medium' as const },
    { label: 'Long', value: 'long' as const },
    { label: 'Curly', value: 'curly' as const },
    { label: 'Ponytail', value: 'ponytail' as const },
    { label: 'Braids', value: 'braids' as const },
  ],
  neutral: [
    { label: 'Short', value: 'short' as const },
    { label: 'Medium', value: 'medium' as const },
    { label: 'Long', value: 'long' as const },
    { label: 'Curly', value: 'curly' as const },
  ],
} as const;

/**
 * Default avatar configuration
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  gender: 'neutral',
  skinTone: SKIN_TONES[2].value, // Medium
  hairColour: HAIR_COLOURS[1].value, // Brown
  hairStyle: 'short',
};
