/**
 * AvatarPreview Component Tests
 *
 * Tests for the avatar preview component that renders SVG-based avatars
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarPreview } from '~/components/storybook/AvatarPreview';
import type { AvatarConfig } from '~/components/storybook/types';

describe('AvatarPreview', () => {
  const defaultConfig: AvatarConfig = {
    gender: 'neutral',
    skinTone: '#D08B5B',
    hairColour: '#8B4513',
    hairStyle: 'short',
  };

  describe('Rendering', () => {
    it('should render an SVG element', () => {
      render(<AvatarPreview config={defaultConfig} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom size through className', () => {
      const { container } = render(
        <AvatarPreview config={defaultConfig} className="w-32 h-32" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-32', 'h-32');
    });

    it('should render with aria-label for accessibility', () => {
      render(<AvatarPreview config={defaultConfig} />);
      const svg = screen.getByLabelText(/avatar/i);
      expect(svg).toBeInTheDocument();
    });

    it('should set role="img" for accessibility', () => {
      render(<AvatarPreview config={defaultConfig} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
    });
  });

  describe('Skin Tone', () => {
    it('should apply skin tone colour to face element', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const faceElement = container.querySelector('[data-part="face"]');
      expect(faceElement).toBeInTheDocument();
      expect(faceElement).toHaveAttribute('fill', defaultConfig.skinTone);
    });

    it('should update skin tone when config changes', () => {
      const { container, rerender } = render(<AvatarPreview config={defaultConfig} />);
      const newConfig = { ...defaultConfig, skinTone: '#FFDBB4' };
      rerender(<AvatarPreview config={newConfig} />);
      const faceElement = container.querySelector('[data-part="face"]');
      expect(faceElement).toHaveAttribute('fill', '#FFDBB4');
    });
  });

  describe('Hair Colour', () => {
    it('should apply hair colour to hair element', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const hairElement = container.querySelector('[data-part="hair"]');
      expect(hairElement).toBeInTheDocument();
      expect(hairElement).toHaveAttribute('fill', defaultConfig.hairColour);
    });

    it('should update hair colour when config changes', () => {
      const { container, rerender } = render(<AvatarPreview config={defaultConfig} />);
      const newConfig = { ...defaultConfig, hairColour: '#F5DEB3' };
      rerender(<AvatarPreview config={newConfig} />);
      const hairElement = container.querySelector('[data-part="hair"]');
      expect(hairElement).toHaveAttribute('fill', '#F5DEB3');
    });
  });

  describe('Hair Styles', () => {
    const hairStyles: Array<AvatarConfig['hairStyle']> = [
      'short',
      'medium',
      'long',
      'curly',
      'ponytail',
      'braids',
    ];

    hairStyles.forEach((style) => {
      it(`should render ${style} hair style`, () => {
        const config = { ...defaultConfig, hairStyle: style };
        const { container } = render(<AvatarPreview config={config} />);
        const hairElement = container.querySelector('[data-part="hair"]');
        expect(hairElement).toBeInTheDocument();
        expect(hairElement).toHaveAttribute('data-style', style);
      });
    });
  });

  describe('Gender Variations', () => {
    const genders: Array<AvatarConfig['gender']> = ['boy', 'girl', 'neutral'];

    genders.forEach((gender) => {
      it(`should render ${gender} body type`, () => {
        const config = { ...defaultConfig, gender };
        const { container } = render(<AvatarPreview config={config} />);
        const bodyElement = container.querySelector('[data-part="body"]');
        expect(bodyElement).toBeInTheDocument();
        expect(bodyElement).toHaveAttribute('data-gender', gender);
      });
    });
  });

  describe('Responsive Sizing', () => {
    it('should maintain aspect ratio', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });

    it('should apply default size class', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
    });

    it('should allow custom size override', () => {
      const { container } = render(
        <AvatarPreview config={defaultConfig} className="w-16 h-16" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-16', 'h-16');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing config gracefully', () => {
      const { container } = render(<AvatarPreview />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle invalid hex colours gracefully', () => {
      const invalidConfig = {
        ...defaultConfig,
        skinTone: 'invalid',
        hairColour: 'also-invalid',
      };
      const { container } = render(<AvatarPreview config={invalidConfig} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Visual Features', () => {
    it('should render facial features (eyes, nose)', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const eyes = container.querySelectorAll('[data-part="eye"]');
      expect(eyes.length).toBeGreaterThan(0);
    });

    it('should render with subtle shadow/depth', () => {
      const { container } = render(<AvatarPreview config={defaultConfig} />);
      const svg = container.querySelector('svg');
      // Check for defs/filter elements that create depth
      const defs = svg?.querySelector('defs');
      expect(defs).toBeInTheDocument();
    });
  });
});
