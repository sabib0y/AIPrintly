import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Checkbox } from '~/components/ui/checkbox';

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('renders an unchecked checkbox by default', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders a checked checkbox when checked prop is true', () => {
      render(<Checkbox checked />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'true');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('renders with custom className', () => {
      render(<Checkbox className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('custom-class');
      // Should still have base classes
      expect(checkbox).toHaveClass('h-5');
      expect(checkbox).toHaveClass('w-5');
    });

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Checkbox ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveAttribute('role', 'checkbox');
    });
  });

  describe('Interactions', () => {
    it('calls onCheckedChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles from unchecked to checked on click', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      await user.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(true);
      });
    });

    it('toggles from checked to unchecked on click', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox checked onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'checked');

      await user.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(false);
      });
    });

    it('can be controlled (checked prop controls state)', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      // Clicking should not change state without updating the checked prop
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      // Rerender with checked=true
      rerender(<Checkbox checked={true} />);
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute('data-disabled');
    });

    it('does not call onCheckedChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('has disabled styling (opacity)', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('disabled:opacity-50');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('has correct role="checkbox"', () => {
      render(<Checkbox />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('has aria-checked attribute matching state', () => {
      const { rerender } = render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox checked={true} />);
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('is focusable via keyboard', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();

      expect(checkbox).toHaveFocus();
    });

    it('toggles on Space key press', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(true);
      });
    });

    it('has visible focus indicator', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('focus-visible:outline-none');
      expect(checkbox).toHaveClass('focus-visible:ring-2');
      expect(checkbox).toHaveClass('focus-visible:ring-sky-500');
      expect(checkbox).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Visual States', () => {
    it('shows check icon when checked', () => {
      render(<Checkbox checked />);
      const checkbox = screen.getByRole('checkbox');

      // The indicator element should be present when checked
      expect(checkbox.querySelector('svg')).toBeInTheDocument();
    });

    it('hides check icon when unchecked', () => {
      render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      // The indicator should not render the svg when unchecked
      // Radix conditionally renders the indicator content
      expect(checkbox.querySelector('svg')).not.toBeInTheDocument();
    });

    it('applies correct styling for checked state', () => {
      render(<Checkbox checked />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('data-[state=checked]:border-sky-600');
      expect(checkbox).toHaveClass('data-[state=checked]:bg-sky-600');
      expect(checkbox).toHaveClass('data-[state=checked]:text-white');
    });

    it('applies correct styling for unchecked state', () => {
      render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('border-2');
      expect(checkbox).toHaveClass('border-gray-300');
      expect(checkbox).toHaveClass('rounded');
      expect(checkbox).toHaveClass('shadow-sm');
    });
  });

  describe('Additional Props', () => {
    it('passes through data attributes', () => {
      render(<Checkbox data-testid="custom-checkbox" data-form="terms" />);
      const checkbox = screen.getByTestId('custom-checkbox');

      expect(checkbox).toHaveAttribute('data-form', 'terms');
    });

    it('supports aria-label', () => {
      render(<Checkbox aria-label="Accept terms and conditions" />);
      const checkbox = screen.getByRole('checkbox', {
        name: /accept terms and conditions/i,
      });

      expect(checkbox).toBeInTheDocument();
    });

    it('supports defaultChecked prop for uncontrolled usage', async () => {
      const user = userEvent.setup();
      render(<Checkbox defaultChecked />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'checked');

      // Can toggle when uncontrolled
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      });
    });

    it('supports value attribute', () => {
      render(<Checkbox value="terms-accepted" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('value', 'terms-accepted');
    });
  });

  describe('Indeterminate State', () => {
    it('supports indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('transitions from indeterminate to checked on click', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox checked="indeterminate" onCheckedChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');

      await user.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(true);
      });
    });
  });
});
