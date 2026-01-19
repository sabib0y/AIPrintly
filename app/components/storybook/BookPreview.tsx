/**
 * BookPreview Component
 *
 * Flip-through preview for storybooks.
 * Displays pages with navigation, autoplay, and fullscreen support.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';

export type PageLayout =
  | 'full-image'
  | 'text-top'
  | 'text-bottom'
  | 'text-left'
  | 'text-right'
  | 'text-only';

export type PageType = 'cover' | 'content' | 'back';

export interface PreviewPage {
  /** Page ID */
  id: string;
  /** Page number (1-based) */
  pageNumber: number;
  /** Page type */
  type: PageType;
  /** Page title (for cover) */
  title?: string;
  /** Page text content */
  text?: string;
  /** Page image URL */
  imageUrl?: string;
  /** Page layout */
  layout?: PageLayout;
}

export interface BookPreviewProps {
  /** Array of pages to preview */
  pages: PreviewPage[];
  /** Current page number (1-based) */
  currentPage: number;
  /** Callback when page changes */
  onPageChange: (pageNumber: number) => void;
  /** Show page dots navigation */
  showDots?: boolean;
  /** Allow fullscreen mode */
  allowFullscreen?: boolean;
  /** Allow autoplay */
  allowAutoplay?: boolean;
  /** Autoplay interval in milliseconds */
  autoplayInterval?: number;
  /** Aspect ratio (width:height) */
  aspectRatio?: '3:4' | '4:3' | '1:1' | '16:9';
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BookPreview provides a flip-through preview for storybooks.
 *
 * Features:
 * - Page navigation (buttons, keyboard, dots)
 * - Autoplay with configurable interval
 * - Fullscreen mode
 * - Multiple page layouts
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <BookPreview
 *   pages={storyPages}
 *   currentPage={currentPage}
 *   onPageChange={setCurrentPage}
 *   showDots
 *   allowFullscreen
 *   allowAutoplay
 * />
 * ```
 */
export function BookPreview({
  pages,
  currentPage,
  onPageChange,
  showDots = false,
  allowFullscreen = false,
  allowAutoplay = false,
  autoplayInterval = 3000,
  aspectRatio = '3:4',
  isLoading = false,
  className,
}: BookPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = pages.length;
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  // Get current page data
  const currentPageData = pages.find((p) => p.pageNumber === currentPage);

  // Navigation handlers
  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setImageLoaded(false);
        onPageChange(pageNumber);
      }
    },
    [totalPages, onPageChange]
  );

  const goToPrevious = useCallback(() => {
    if (canGoBack) {
      goToPage(currentPage - 1);
    }
  }, [canGoBack, currentPage, goToPage]);

  const goToNext = useCallback(() => {
    if (canGoForward) {
      goToPage(currentPage + 1);
    } else if (isPlaying) {
      // Stop autoplay at end
      setIsPlaying(false);
    }
  }, [canGoForward, currentPage, goToPage, isPlaying]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    },
    [goToPrevious, goToNext, isFullscreen]
  );

  // Autoplay
  useEffect(() => {
    if (isPlaying) {
      autoplayRef.current = setInterval(() => {
        goToNext();
      }, autoplayInterval);
    } else {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPlaying, autoplayInterval, goToNext]);

  // Focus management for fullscreen
  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isFullscreen]);

  // Toggle autoplay
  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsPlaying(false);
    }
  };

  // Aspect ratio styles
  const aspectRatioClass = {
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
  }[aspectRatio];

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="book-preview-skeleton">
        <Skeleton className={cn('w-full rounded-lg', aspectRatioClass)} />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    );
  }

  // Empty state
  if (pages.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
          aspectRatioClass,
          className
        )}
      >
        <div className="text-center text-gray-400">
          <BookIcon className="mx-auto h-12 w-12" />
          <p className="mt-2 text-sm">No pages to preview</p>
        </div>
      </div>
    );
  }

  const content = (
    <div
      ref={containerRef}
      role="region"
      aria-label="Book preview"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative focus:outline-none',
        isFullscreen &&
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-8',
        className
      )}
    >
      {/* Book Container */}
      <div
        data-aspect-ratio={aspectRatio}
        className={cn(
          'relative mx-auto overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800',
          aspectRatioClass,
          isFullscreen ? 'max-h-[80vh] max-w-lg' : 'w-full'
        )}
      >
        {/* Page Content */}
        <PageContent
          page={currentPageData}
          onImageLoad={() => setImageLoaded(true)}
          imageLoaded={imageLoaded}
        />

        {/* Navigation Arrows (overlay) */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={!canGoBack}
            aria-label="Previous page"
            className="ml-2 bg-black/20 text-white hover:bg-black/40 disabled:opacity-30"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={!canGoForward}
            aria-label="Next page"
            className="mr-2 bg-black/20 text-white hover:bg-black/40 disabled:opacity-30"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div
        className={cn(
          'mt-4 flex flex-wrap items-center justify-center gap-4',
          isFullscreen && 'text-white'
        )}
      >
        {/* Autoplay Button */}
        {allowAutoplay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAutoplay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={isFullscreen ? 'text-white hover:bg-white/20' : ''}
          >
            {isPlaying ? (
              <PauseIcon className="mr-1 h-4 w-4" />
            ) : (
              <PlayIcon className="mr-1 h-4 w-4" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        )}

        {/* Page Indicator */}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'text-sm',
            isFullscreen ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
          )}
        >
          Page {currentPage} of {totalPages}
        </div>

        {/* Fullscreen Button */}
        {allowFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className={isFullscreen ? 'text-white hover:bg-white/20' : ''}
          >
            {isFullscreen ? (
              <ExitFullscreenIcon className="mr-1 h-4 w-4" />
            ) : (
              <FullscreenIcon className="mr-1 h-4 w-4" />
            )}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        )}
      </div>

      {/* Page Dots */}
      {showDots && (
        <div className="mt-3 flex justify-center gap-1.5">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => goToPage(page.pageNumber)}
              aria-label={`Go to page ${page.pageNumber}`}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                page.pageNumber === currentPage
                  ? 'bg-sky-500'
                  : isFullscreen
                    ? 'bg-white/40 hover:bg-white/60'
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );

  return content;
}

/**
 * Renders page content based on type and layout
 */
interface PageContentProps {
  page?: PreviewPage;
  onImageLoad: () => void;
  imageLoaded: boolean;
}

function PageContent({ page, onImageLoad, imageLoaded }: PageContentProps) {
  if (!page) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
        <p className="text-gray-400">Page not found</p>
      </div>
    );
  }

  // Cover page
  if (page.type === 'cover') {
    return (
      <div className="relative h-full">
        {page.imageUrl && (
          <img
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            onLoad={onImageLoad}
            className="h-full w-full object-cover"
          />
        )}
        {page.title && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg">
              {page.title}
            </h2>
          </div>
        )}
      </div>
    );
  }

  // Back page
  if (page.type === 'back') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-8 dark:from-gray-700 dark:to-gray-800">
        <p className="text-center text-xl font-semibold text-gray-700 dark:text-gray-200">
          {page.text || 'The End'}
        </p>
      </div>
    );
  }

  // Content pages with various layouts
  const layout = page.layout || 'full-image';

  switch (layout) {
    case 'full-image':
      return (
        <div className="relative h-full">
          {page.imageUrl ? (
            <img
              src={page.imageUrl}
              alt={`Page ${page.pageNumber}`}
              onLoad={onImageLoad}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <ImagePlaceholderIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
        </div>
      );

    case 'text-top':
      return (
        <div className="flex h-full flex-col">
          <div className="order-1 shrink-0 bg-white p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">{page.text}</p>
          </div>
          <div className="order-2 flex-1">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                onLoad={onImageLoad}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                <ImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      );

    case 'text-bottom':
      return (
        <div className="flex h-full flex-col">
          <div className="order-1 flex-1">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                onLoad={onImageLoad}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                <ImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
          <div className="order-2 shrink-0 bg-white p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">{page.text}</p>
          </div>
        </div>
      );

    case 'text-left':
      return (
        <div className="flex h-full">
          <div className="w-1/3 shrink-0 bg-white p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">{page.text}</p>
          </div>
          <div className="flex-1">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                onLoad={onImageLoad}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                <ImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      );

    case 'text-right':
      return (
        <div className="flex h-full">
          <div className="flex-1">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                onLoad={onImageLoad}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                <ImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
          <div className="w-1/3 shrink-0 bg-white p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">{page.text}</p>
          </div>
        </div>
      );

    case 'text-only':
      return (
        <div className="flex h-full items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-8 dark:from-gray-700 dark:to-gray-800">
          <p className="text-center text-lg text-gray-700 dark:text-gray-200">{page.text}</p>
        </div>
      );

    default:
      return null;
  }
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
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
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
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
        d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

export default BookPreview;
