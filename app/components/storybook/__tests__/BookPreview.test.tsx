/**
 * BookPreview Component Tests
 *
 * Tests for the flip-through storybook preview component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookPreview, type BookPreviewProps, type PreviewPage } from '../BookPreview';

describe('BookPreview', () => {
  const mockPages: PreviewPage[] = [
    {
      id: 'cover',
      pageNumber: 1,
      type: 'cover',
      title: 'My Storybook',
      imageUrl: '/cover.jpg',
    },
    {
      id: 'page-1',
      pageNumber: 2,
      type: 'content',
      text: 'Once upon a time...',
      imageUrl: '/page1.jpg',
      layout: 'text-bottom',
    },
    {
      id: 'page-2',
      pageNumber: 3,
      type: 'content',
      text: 'The adventure begins!',
      imageUrl: '/page2.jpg',
      layout: 'text-top',
    },
    {
      id: 'back',
      pageNumber: 4,
      type: 'back',
      text: 'The End',
    },
  ];

  const defaultProps: BookPreviewProps = {
    pages: mockPages,
    currentPage: 1,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders book preview container', () => {
      render(<BookPreview {...defaultProps} />);

      expect(screen.getByRole('region', { name: /book preview/i })).toBeInTheDocument();
    });

    it('renders current page content', () => {
      render(<BookPreview {...defaultProps} currentPage={1} />);

      expect(screen.getByText('My Storybook')).toBeInTheDocument();
    });

    it('renders page image when available', () => {
      render(<BookPreview {...defaultProps} currentPage={1} />);

      const image = screen.getByRole('img', { name: /page 1/i });
      expect(image).toHaveAttribute('src', '/cover.jpg');
    });

    it('renders with custom className', () => {
      const { container } = render(<BookPreview {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('displays page text on content pages', () => {
      render(<BookPreview {...defaultProps} currentPage={2} />);

      expect(screen.getByText('Once upon a time...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders navigation buttons', () => {
      render(<BookPreview {...defaultProps} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(<BookPreview {...defaultProps} currentPage={1} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<BookPreview {...defaultProps} currentPage={4} />);

      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('calls onPageChange when next is clicked', async () => {
      const handlePageChange = vi.fn();
      render(<BookPreview {...defaultProps} currentPage={1} onPageChange={handlePageChange} />);

      await userEvent.click(screen.getByRole('button', { name: /next page/i }));

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous is clicked', async () => {
      const handlePageChange = vi.fn();
      render(<BookPreview {...defaultProps} currentPage={3} onPageChange={handlePageChange} />);

      await userEvent.click(screen.getByRole('button', { name: /previous page/i }));

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('supports keyboard navigation with arrow keys', async () => {
      const handlePageChange = vi.fn();
      render(<BookPreview {...defaultProps} currentPage={2} onPageChange={handlePageChange} />);

      const preview = screen.getByRole('region', { name: /book preview/i });
      fireEvent.keyDown(preview, { key: 'ArrowRight' });

      expect(handlePageChange).toHaveBeenCalledWith(3);

      fireEvent.keyDown(preview, { key: 'ArrowLeft' });

      expect(handlePageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Page Indicator', () => {
    it('displays current page number', () => {
      render(<BookPreview {...defaultProps} currentPage={2} />);

      expect(screen.getByText(/page 2 of 4/i)).toBeInTheDocument();
    });

    it('updates page indicator when page changes', () => {
      const { rerender } = render(<BookPreview {...defaultProps} currentPage={1} />);

      expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument();

      rerender(<BookPreview {...defaultProps} currentPage={3} />);

      expect(screen.getByText(/page 3 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Page Dots Navigation', () => {
    it('renders page dots when showDots is true', () => {
      render(<BookPreview {...defaultProps} showDots />);

      const dots = screen.getAllByRole('button', { name: /go to page/i });
      expect(dots).toHaveLength(4);
    });

    it('highlights current page dot', () => {
      render(<BookPreview {...defaultProps} currentPage={2} showDots />);

      const dots = screen.getAllByRole('button', { name: /go to page/i });
      expect(dots[1]).toHaveClass('bg-sky-500');
    });

    it('navigates to page when dot is clicked', async () => {
      const handlePageChange = vi.fn();
      render(<BookPreview {...defaultProps} showDots onPageChange={handlePageChange} />);

      const dots = screen.getAllByRole('button', { name: /go to page/i });
      await userEvent.click(dots[2]);

      expect(handlePageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Fullscreen Mode', () => {
    it('renders fullscreen button when allowFullscreen is true', () => {
      render(<BookPreview {...defaultProps} allowFullscreen />);

      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });

    it('does not render fullscreen button when allowFullscreen is false', () => {
      render(<BookPreview {...defaultProps} allowFullscreen={false} />);

      expect(screen.queryByRole('button', { name: /fullscreen/i })).not.toBeInTheDocument();
    });

    it('toggles fullscreen mode when button is clicked', async () => {
      render(<BookPreview {...defaultProps} allowFullscreen />);

      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await userEvent.click(fullscreenButton);

      expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument();
    });
  });

  describe('Autoplay', () => {
    it('renders play button when autoplay is supported', () => {
      render(<BookPreview {...defaultProps} allowAutoplay />);

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('shows pause button when autoplay is active', async () => {
      render(<BookPreview {...defaultProps} allowAutoplay />);

      await userEvent.click(screen.getByRole('button', { name: /play/i }));

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('calls onPageChange at interval during autoplay', async () => {
      vi.useFakeTimers();
      const handlePageChange = vi.fn();

      render(
        <BookPreview
          {...defaultProps}
          currentPage={1}
          allowAutoplay
          autoplayInterval={1000}
          onPageChange={handlePageChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /play/i }));

      vi.advanceTimersByTime(1000);
      expect(handlePageChange).toHaveBeenCalledWith(2);

      vi.useRealTimers();
    });
  });

  describe('Page Layouts', () => {
    it('renders text at bottom for text-bottom layout', () => {
      render(<BookPreview {...defaultProps} currentPage={2} />);

      const textContainer = screen.getByText('Once upon a time...').parentElement;
      expect(textContainer).toHaveClass('order-2');
    });

    it('renders text at top for text-top layout', () => {
      render(<BookPreview {...defaultProps} currentPage={3} />);

      const textContainer = screen.getByText('The adventure begins!').parentElement;
      expect(textContainer).toHaveClass('order-1');
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<BookPreview {...defaultProps} isLoading />);

      expect(screen.getByTestId('book-preview-skeleton')).toBeInTheDocument();
    });

    it('shows image loading state while image loads', () => {
      render(<BookPreview {...defaultProps} currentPage={1} />);

      // Initial render may show loading state
      const image = screen.getByRole('img', { name: /page 1/i });
      expect(image).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no pages provided', () => {
      render(<BookPreview {...defaultProps} pages={[]} />);

      expect(screen.getByText(/no pages to preview/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible region label', () => {
      render(<BookPreview {...defaultProps} />);

      expect(screen.getByRole('region', { name: /book preview/i })).toBeInTheDocument();
    });

    it('announces page changes to screen readers', () => {
      const { rerender } = render(<BookPreview {...defaultProps} currentPage={1} />);

      rerender(<BookPreview {...defaultProps} currentPage={2} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/page 2/i);
    });

    it('has focus trap in fullscreen mode', async () => {
      render(<BookPreview {...defaultProps} allowFullscreen />);

      await userEvent.click(screen.getByRole('button', { name: /fullscreen/i }));

      // Focus should be trapped within the fullscreen container
      const exitButton = screen.getByRole('button', { name: /exit fullscreen/i });
      expect(document.activeElement).toBe(exitButton);
    });
  });

  describe('Aspect Ratio', () => {
    it('renders with default aspect ratio', () => {
      const { container } = render(<BookPreview {...defaultProps} />);

      const bookContainer = container.querySelector('[data-aspect-ratio]');
      expect(bookContainer).toHaveAttribute('data-aspect-ratio', '3:4');
    });

    it('renders with custom aspect ratio', () => {
      const { container } = render(<BookPreview {...defaultProps} aspectRatio="1:1" />);

      const bookContainer = container.querySelector('[data-aspect-ratio]');
      expect(bookContainer).toHaveAttribute('data-aspect-ratio', '1:1');
    });
  });
});
