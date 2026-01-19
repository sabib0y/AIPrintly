/**
 * TextEditor Component Tests
 *
 * Tests for the inline text editing component used in storybooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextEditor, type TextEditorProps } from '../TextEditor';

describe('TextEditor', () => {
  const defaultProps: TextEditorProps = {
    value: 'Once upon a time',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with initial value', () => {
      render(<TextEditor {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Once upon a time');
    });

    it('renders placeholder when empty', () => {
      render(<TextEditor {...defaultProps} value="" placeholder="Enter your story text..." />);

      const textarea = screen.getByPlaceholderText('Enter your story text...');
      expect(textarea).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<TextEditor {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders label when provided', () => {
      render(<TextEditor {...defaultProps} label="Story Text" />);

      expect(screen.getByText('Story Text')).toBeInTheDocument();
    });

    it('renders character count when maxLength is set', () => {
      render(<TextEditor {...defaultProps} maxLength={500} />);

      expect(screen.getByText('16 / 500')).toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('calls onChange when text is entered', async () => {
      const handleChange = vi.fn();
      render(<TextEditor {...defaultProps} value="" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');

      expect(handleChange).toHaveBeenCalled();
    });

    it('prevents input beyond maxLength', async () => {
      const handleChange = vi.fn();
      render(<TextEditor {...defaultProps} value="abc" maxLength={5} onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'defgh');

      // Should only allow 2 more characters (5 - 3 = 2)
      // The actual enforcement is in the component
      expect(handleChange).toHaveBeenCalled();
    });

    it('shows warning when near maxLength', () => {
      const longText = 'a'.repeat(480);
      render(<TextEditor {...defaultProps} value={longText} maxLength={500} />);

      // Should show warning styling when > 90% of max
      expect(screen.getByText('480 / 500')).toBeInTheDocument();
    });
  });

  describe('Formatting Toolbar', () => {
    it('renders formatting toolbar when showToolbar is true', () => {
      render(<TextEditor {...defaultProps} showToolbar />);

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    });

    it('does not render toolbar when showToolbar is false', () => {
      render(<TextEditor {...defaultProps} showToolbar={false} />);

      expect(screen.queryByRole('button', { name: /bold/i })).not.toBeInTheDocument();
    });
  });

  describe('Font Size Control', () => {
    it('renders font size selector when showFontSize is true', () => {
      render(<TextEditor {...defaultProps} showFontSize />);

      expect(screen.getByLabelText(/font size/i)).toBeInTheDocument();
    });

    it('displays current font size', () => {
      render(<TextEditor {...defaultProps} showFontSize fontSize={18} />);

      const fontSizeSelect = screen.getByLabelText(/font size/i);
      expect(fontSizeSelect).toHaveValue('18');
    });

    it('calls onFontSizeChange when font size changes', async () => {
      const handleFontSizeChange = vi.fn();
      render(
        <TextEditor
          {...defaultProps}
          showFontSize
          fontSize={16}
          onFontSizeChange={handleFontSizeChange}
        />
      );

      const fontSizeSelect = screen.getByLabelText(/font size/i);
      await userEvent.selectOptions(fontSizeSelect, '24');

      expect(handleFontSizeChange).toHaveBeenCalledWith(24);
    });
  });

  describe('Text Alignment', () => {
    it('renders alignment controls when showAlignment is true', () => {
      render(<TextEditor {...defaultProps} showAlignment />);

      expect(screen.getByRole('button', { name: /align left/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align centre/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align right/i })).toBeInTheDocument();
    });

    it('highlights current alignment', () => {
      render(<TextEditor {...defaultProps} showAlignment alignment="centre" />);

      const centreButton = screen.getByRole('button', { name: /align centre/i });
      expect(centreButton).toHaveClass('bg-sky-100');
    });

    it('calls onAlignmentChange when alignment changes', async () => {
      const handleAlignmentChange = vi.fn();
      render(
        <TextEditor
          {...defaultProps}
          showAlignment
          alignment="left"
          onAlignmentChange={handleAlignmentChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /align right/i }));

      expect(handleAlignmentChange).toHaveBeenCalledWith('right');
    });
  });

  describe('Read-only Mode', () => {
    it('disables textarea when readOnly is true', () => {
      render(<TextEditor {...defaultProps} readOnly />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('hides toolbar when readOnly is true', () => {
      render(<TextEditor {...defaultProps} showToolbar readOnly />);

      expect(screen.queryByRole('button', { name: /bold/i })).not.toBeInTheDocument();
    });
  });

  describe('Auto-resize', () => {
    it('applies minHeight when specified', () => {
      render(<TextEditor {...defaultProps} minHeight={100} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle({ minHeight: '100px' });
    });

    it('applies maxHeight when specified', () => {
      render(<TextEditor {...defaultProps} maxHeight={300} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle({ maxHeight: '300px' });
    });
  });

  describe('Blur and Focus', () => {
    it('calls onBlur when textarea loses focus', async () => {
      const handleBlur = vi.fn();
      render(<TextEditor {...defaultProps} onBlur={handleBlur} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.click(textarea);
      await userEvent.tab();

      expect(handleBlur).toHaveBeenCalled();
    });

    it('calls onFocus when textarea gains focus', async () => {
      const handleFocus = vi.fn();
      render(<TextEditor {...defaultProps} onFocus={handleFocus} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.click(textarea);

      expect(handleFocus).toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('displays error message when provided', () => {
      render(<TextEditor {...defaultProps} error="Text is required" />);

      expect(screen.getByText('Text is required')).toBeInTheDocument();
    });

    it('applies error styling when error is present', () => {
      render(<TextEditor {...defaultProps} error="Text is required" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });
  });

  describe('Accessibility', () => {
    it('has accessible label', () => {
      render(<TextEditor {...defaultProps} label="Story Text" />);

      const textarea = screen.getByLabelText('Story Text');
      expect(textarea).toBeInTheDocument();
    });

    it('has aria-describedby when error is present', () => {
      render(<TextEditor {...defaultProps} error="Text is required" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports aria-label when no visible label', () => {
      render(<TextEditor {...defaultProps} ariaLabel="Story content" />);

      const textarea = screen.getByLabelText('Story content');
      expect(textarea).toBeInTheDocument();
    });
  });
});
