/**
 * AvatarPreview Component
 *
 * SVG-based avatar display with composable parts for character customisation.
 * Renders a simplified illustrated character based on the provided configuration.
 */

import { cn } from '~/lib/utils';
import type { AvatarConfig } from '~/components/storybook/types';
import { DEFAULT_AVATAR_CONFIG } from '~/components/storybook/types';

export interface AvatarPreviewProps {
  /** Avatar configuration */
  config?: AvatarConfig;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AvatarPreview renders an SVG-based avatar character.
 *
 * Features:
 * - Composable SVG parts (head, hair, body)
 * - Responsive sizing
 * - Smooth colour transitions
 * - WCAG AA compliant
 *
 * @example
 * ```tsx
 * <AvatarPreview
 *   config={{
 *     gender: 'girl',
 *     skinTone: '#D08B5B',
 *     hairColour: '#8B4513',
 *     hairStyle: 'ponytail'
 *   }}
 *   className="w-32 h-32"
 * />
 * ```
 */
export function AvatarPreview({ config = DEFAULT_AVATAR_CONFIG, className }: AvatarPreviewProps) {
  const { gender, skinTone, hairColour, hairStyle } = config;

  return (
    <div className={cn('w-full transition-all duration-300', className)}>
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Avatar preview"
        className="h-full w-full"
      >
        <defs>
          {/* Subtle shadow filter for depth */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Body */}
        <BodyShape gender={gender} skinTone={skinTone} />

        {/* Face */}
        <circle
          data-part="face"
          cx="100"
          cy="80"
          r="45"
          fill={skinTone}
          filter="url(#shadow)"
        />

        {/* Hair */}
        <HairShape style={hairStyle} colour={hairColour} gender={gender} />

        {/* Eyes */}
        <g data-part="eye">
          <ellipse cx="85" cy="75" rx="4" ry="6" fill="#1C1C1C" />
          <ellipse cx="115" cy="75" rx="4" ry="6" fill="#1C1C1C" />
          {/* Eye shine */}
          <circle cx="86" cy="73" r="1.5" fill="white" opacity="0.8" />
          <circle cx="116" cy="73" r="1.5" fill="white" opacity="0.8" />
        </g>

        {/* Nose */}
        <path
          d="M 100 85 Q 98 88 100 90"
          stroke={adjustBrightness(skinTone, -20)}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth - subtle smile */}
        <path
          d="M 90 95 Q 100 100 110 95"
          stroke={adjustBrightness(skinTone, -30)}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Body shape component
 */
interface BodyShapeProps {
  gender: AvatarConfig['gender'];
  skinTone: string;
}

function BodyShape({ gender, skinTone }: BodyShapeProps) {
  // Simple neck and shoulders
  return (
    <g data-part="body" data-gender={gender}>
      {/* Neck */}
      <rect
        x="88"
        y="115"
        width="24"
        height="15"
        fill={skinTone}
        rx="4"
      />
      {/* Shoulders */}
      <ellipse
        cx="100"
        cy="145"
        rx="55"
        ry="30"
        fill={getBodyColour(gender)}
        filter="url(#shadow)"
      />
    </g>
  );
}

/**
 * Hair shape component
 */
interface HairShapeProps {
  style: AvatarConfig['hairStyle'];
  colour: string;
  gender: AvatarConfig['gender'];
}

function HairShape({ style, colour, gender }: HairShapeProps) {
  const hairProps = {
    'data-part': 'hair',
    'data-style': style,
    fill: colour,
    filter: 'url(#shadow)',
  };

  switch (style) {
    case 'short':
      return (
        <path
          {...hairProps}
          d="M 55 70 Q 55 35 100 35 Q 145 35 145 70 L 140 75 Q 140 45 100 45 Q 60 45 60 75 Z"
        />
      );

    case 'medium':
      return (
        <path
          {...hairProps}
          d="M 50 70 Q 50 30 100 30 Q 150 30 150 70 L 148 85 Q 148 40 100 40 Q 52 40 52 85 Z"
        />
      );

    case 'long':
      return (
        <g {...hairProps}>
          {/* Top of head */}
          <path d="M 45 70 Q 45 25 100 25 Q 155 25 155 70" />
          {/* Long flowing sides */}
          <path d="M 45 70 Q 40 100 45 130" />
          <path d="M 155 70 Q 160 100 155 130" />
          {/* Back */}
          <ellipse cx="100" cy="100" rx="58" ry="40" opacity="0.9" />
        </g>
      );

    case 'curly':
      return (
        <g {...hairProps}>
          {/* Curly texture using multiple circles */}
          <circle cx="70" cy="50" r="15" />
          <circle cx="90" cy="45" r="15" />
          <circle cx="110" cy="45" r="15" />
          <circle cx="130" cy="50" r="15" />
          <circle cx="60" cy="70" r="12" />
          <circle cx="140" cy="70" r="12" />
          <ellipse cx="100" cy="55" rx="35" ry="25" />
        </g>
      );

    case 'ponytail':
      return (
        <g {...hairProps}>
          {/* Front/top */}
          <path d="M 50 70 Q 50 30 100 30 Q 150 30 150 70 L 148 80 Q 148 40 100 40 Q 52 40 52 80 Z" />
          {/* Ponytail at back */}
          <ellipse cx="100" cy="40" rx="20" ry="8" opacity="0.8" />
          <path d="M 95 45 Q 95 65 90 85" strokeWidth="15" stroke={colour} fill="none" />
        </g>
      );

    case 'braids':
      return (
        <g {...hairProps}>
          {/* Top */}
          <path d="M 50 70 Q 50 30 100 30 Q 150 30 150 70" />
          {/* Left braid */}
          <g opacity="0.95">
            <path d="M 55 75 L 45 105" strokeWidth="10" stroke={colour} fill="none" />
            <circle cx="45" cy="85" r="5" />
            <circle cx="45" cy="95" r="5" />
            <circle cx="45" cy="105" r="5" />
          </g>
          {/* Right braid */}
          <g opacity="0.95">
            <path d="M 145 75 L 155 105" strokeWidth="10" stroke={colour} fill="none" />
            <circle cx="155" cy="85" r="5" />
            <circle cx="155" cy="95" r="5" />
            <circle cx="155" cy="105" r="5" />
          </g>
        </g>
      );

    default:
      return null;
  }
}

/**
 * Get body/clothing colour based on gender preference
 */
function getBodyColour(gender: AvatarConfig['gender']): string {
  switch (gender) {
    case 'boy':
      return '#4A90E2'; // Blue
    case 'girl':
      return '#E24A90'; // Pink
    case 'neutral':
      return '#9B59B6'; // Purple
    default:
      return '#9B59B6';
  }
}

/**
 * Adjust hex colour brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # if present
  const colour = hex.replace('#', '');

  // Convert to RGB
  const num = parseInt(colour, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));

  // Convert back to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default AvatarPreview;
