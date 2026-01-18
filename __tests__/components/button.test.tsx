import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { Button } from '~/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-sky-600');
    });

    it('renders children correctly', () => {
      render(<Button>Test Button</Button>);

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-sky-600');
      expect(button).toHaveClass('text-white');
    });

    it('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('text-white');
    });

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-white');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-gray-100');
      expect(button).toHaveClass('text-gray-900');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-gray-900');
      expect(button).not.toHaveClass('bg-sky-600');
    });

    it('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-sky-600');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('renders default size correctly', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
    });

    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-xs');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-8');
    });

    it('renders icon size correctly', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('States', () => {
    it('handles disabled state correctly', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild prop', () => {
    it('renders as a slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('bg-sky-600');
    });
  });

  describe('HTML attributes', () => {
    it('passes through native button attributes', () => {
      render(
        <Button type="submit" name="submit-btn" data-testid="test-button">
          Submit
        </Button>
      );
      const button = screen.getByTestId('test-button');

      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('supports aria attributes', () => {
      render(<Button aria-label="Close modal">X</Button>);
      const button = screen.getByRole('button', { name: /close modal/i });

      expect(button).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible Button</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('can be focused', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      button.focus();

      expect(button).toHaveFocus();
    });
  });
});
