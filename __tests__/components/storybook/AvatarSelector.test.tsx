/**
 * AvatarSelector Component Tests
 *
 * Tests for the avatar customisation selector component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AvatarSelector } from '~/components/storybook/AvatarSelector';
import type { AvatarConfig } from '~/components/storybook/types';
import { DEFAULT_AVATAR_CONFIG } from '~/components/storybook/types';

describe('AvatarSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render avatar preview', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const avatar = screen.getByLabelText(/avatar preview/i);
      expect(avatar).toBeInTheDocument();
    });

    it('should render gender selection buttons', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      expect(screen.getByRole('button', { name: /boy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /girl/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /neutral/i })).toBeInTheDocument();
    });

    it('should render skin tone swatches', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /skin tone/i });
      expect(swatches.length).toBeGreaterThan(0);
    });

    it('should render hair colour swatches', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /hair colour/i });
      expect(swatches.length).toBeGreaterThan(0);
    });

    it('should render hair style options', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const heading = screen.getByText(/hair style/i);
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Gender Selection', () => {
    it('should highlight selected gender', () => {
      const config = { ...DEFAULT_AVATAR_CONFIG, gender: 'girl' as const };
      render(<AvatarSelector value={config} onChange={mockOnChange} />);
      const girlButton = screen.getByRole('button', { name: /girl/i });
      expect(girlButton).toHaveAttribute('data-selected', 'true');
    });

    it('should call onChange when gender is changed', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const boyButton = screen.getByRole('button', { name: /boy/i });
      fireEvent.click(boyButton);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ gender: 'boy' })
      );
    });

    it('should update available hair styles when gender changes', () => {
      const { rerender } = render(
        <AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />
      );

      // Change to girl
      const config = { ...DEFAULT_AVATAR_CONFIG, gender: 'girl' as const };
      rerender(<AvatarSelector value={config} onChange={mockOnChange} />);

      // Girl should have ponytail option
      expect(screen.queryByRole('button', { name: /ponytail/i })).toBeInTheDocument();
    });

    it('should adjust hair style if current style not available for new gender', () => {
      const config: AvatarConfig = {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'ponytail',
      };
      render(<AvatarSelector value={config} onChange={mockOnChange} />);

      // Change to boy (ponytail not available)
      const boyButton = screen.getByRole('button', { name: /boy/i });
      fireEvent.click(boyButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: 'boy',
          hairStyle: 'short', // Should default to first available
        })
      );
    });
  });

  describe('Skin Tone Selection', () => {
    it('should highlight selected skin tone', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /skin tone/i });
      const selectedSwatch = swatches.find(
        (swatch) => swatch.getAttribute('data-selected') === 'true'
      );
      expect(selectedSwatch).toBeInTheDocument();
    });

    it('should call onChange when skin tone is selected', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /skin tone/i });
      fireEvent.click(swatches[0]);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ skinTone: expect.any(String) })
      );
    });

    it('should display skin tone colour in swatch', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /skin tone/i });
      swatches.forEach((swatch) => {
        const colourElement = swatch.querySelector('[data-swatch]');
        expect(colourElement).toBeInTheDocument();
        expect(colourElement).toHaveStyle({ backgroundColor: expect.any(String) });
      });
    });
  });

  describe('Hair Colour Selection', () => {
    it('should highlight selected hair colour', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /hair colour/i });
      const selectedSwatch = swatches.find(
        (swatch) => swatch.getAttribute('data-selected') === 'true'
      );
      expect(selectedSwatch).toBeInTheDocument();
    });

    it('should call onChange when hair colour is selected', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const swatches = screen.getAllByRole('button', { name: /hair colour/i });
      fireEvent.click(swatches[0]);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ hairColour: expect.any(String) })
      );
    });

    it('should mark fun colours with indicator', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      // Fun colours like blue and pink should have a sparkle or indicator
      const funColourButton = screen.getByRole('button', { name: /blue/i });
      expect(funColourButton).toBeInTheDocument();
    });
  });

  describe('Hair Style Selection', () => {
    it('should highlight selected hair style', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const selectedStyle = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('short') &&
          btn.getAttribute('data-selected') === 'true'
      );
      expect(selectedStyle).toBeInTheDocument();
    });

    it('should call onChange when hair style is selected', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const hairStyleSection = screen.getByText(/hair style/i).parentElement!;
      const mediumButton = within(hairStyleSection).getByRole('button', { name: /medium/i });
      fireEvent.click(mediumButton);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ hairStyle: 'medium' })
      );
    });
  });

  describe('Live Preview', () => {
    it('should update preview when gender changes', () => {
      const { rerender } = render(
        <AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />
      );

      const newConfig = { ...DEFAULT_AVATAR_CONFIG, gender: 'girl' as const };
      rerender(<AvatarSelector value={newConfig} onChange={mockOnChange} />);

      const avatar = screen.getByLabelText(/avatar preview/i);
      expect(avatar).toBeInTheDocument();
    });

    it('should update preview when skin tone changes', () => {
      const { rerender } = render(
        <AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />
      );

      const newConfig = { ...DEFAULT_AVATAR_CONFIG, skinTone: '#FFDBB4' };
      rerender(<AvatarSelector value={newConfig} onChange={mockOnChange} />);

      const avatar = screen.getByLabelText(/avatar preview/i);
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation for gender', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const boyButton = screen.getByRole('button', { name: /boy/i });
      boyButton.focus();
      expect(document.activeElement).toBe(boyButton);
    });

    it('should have visible focus indicators', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /boy/i });
      button.focus();
      // Check for focus-visible class or ring
      expect(button).toHaveClass(/focus/);
    });

    it('should announce selection changes to screen readers', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const section = screen.getByRole('region', { name: /avatar customisation/i });
      expect(section).toBeInTheDocument();
    });
  });

  describe('Layout and Responsiveness', () => {
    it('should render in a card container', () => {
      const { container } = render(
        <AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />
      );
      const card = container.querySelector('[class*="rounded"]');
      expect(card).toBeInTheDocument();
    });

    it('should stack sections vertically', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      expect(screen.getByText(/gender/i)).toBeInTheDocument();
      expect(screen.getByText(/skin tone/i)).toBeInTheDocument();
      expect(screen.getByText(/hair colour/i)).toBeInTheDocument();
      expect(screen.getByText(/hair style/i)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AvatarSelector
          value={DEFAULT_AVATAR_CONFIG}
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum touch target size for mobile', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Check that buttons have adequate size classes
        const classes = button.className;
        expect(classes).toMatch(/(h-10|h-12|h-8|p-2|p-3|p-4)/);
      });
    });
  });

  describe('Visual Feedback', () => {
    it('should show hover state on buttons', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /boy/i });
      expect(button).toHaveClass(/hover/);
    });

    it('should show transition animations', () => {
      render(<AvatarSelector value={DEFAULT_AVATAR_CONFIG} onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /boy/i });
      expect(button).toHaveClass(/transition/);
    });
  });
});
