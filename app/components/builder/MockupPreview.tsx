/**
 * MockupPreview Component
 *
 * Displays a preview of the product mockup with the user's design.
 * Handles loading states, zoom, and multiple views.
 */

import { useState } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';

export interface MockupPreviewProps {
  /** Mockup image URL */
  mockupUrl: string | null;
  /** Alternative mockup views */
  altViews?: Array<{ id: string; url: string; label: string }>;
  /** Loading state */
  isLoading?: boolean;
  /** Product name for alt text */
  productName?: string;
  /** Allow zoom/fullscreen */
  allowZoom?: boolean;
  /** Enable image download */
  allowDownload?: boolean;
  /** Callback when view changes */
  onViewChange?: (viewId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MockupPreview displays the generated product mockup.
 *
 * Features:
 * - Loading state with skeleton
 * - Multiple view switching
 * - Zoom/fullscreen mode
 * - Download option
 *
 * @example
 * ```tsx
 * <MockupPreview
 *   mockupUrl={mockup.url}
 *   productName="Custom Mug"
 *   allowZoom
 *   altViews={[
 *     { id: 'front', url: '/mockup-front.jpg', label: 'Front' },
 *     { id: 'angle', url: '/mockup-angle.jpg', label: 'Angle' },
 *   ]}
 * />
 * ```
 */
export function MockupPreview({
  mockupUrl,
  altViews = [],
  isLoading = false,
  productName = 'Product',
  allowZoom = false,
  allowDownload = false,
  onViewChange,
  className,
}: MockupPreviewProps) {
  const [activeView, setActiveView] = useState<string>('main');
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    onViewChange?.(viewId);
  };

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDownload = async () => {
    if (!mockupUrl) return;

    try {
      const response = await fetch(mockupUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-mockup.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download mockup:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get current image URL
  const currentUrl =
    activeView === 'main'
      ? mockupUrl
      : altViews.find((v) => v.id === activeView)?.url ?? mockupUrl;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="aspect-square w-full rounded-lg" />
        {altViews.length > 0 && (
          <div className="flex gap-2">
            {altViews.map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // No mockup state
  if (!mockupUrl) {
    return (
      <div
        className={cn(
          'flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
          className
        )}
      >
        <div className="text-center text-gray-400">
          <ImagePlaceholderIcon className="mx-auto h-16 w-16" />
          <p className="mt-4 text-sm">No preview available</p>
          <p className="mt-1 text-xs">Add a design to see the mockup</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Preview */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
          isZoomed && 'fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/90'
        )}
      >
        {imageError ? (
          <div className="flex aspect-square items-center justify-center">
            <div className="text-center text-gray-400">
              <ErrorIcon className="mx-auto h-12 w-12" />
              <p className="mt-2 text-sm">Failed to load mockup</p>
            </div>
          </div>
        ) : (
          <img
            src={currentUrl ?? ''}
            alt={`${productName} mockup preview`}
            className={cn(
              'h-full w-full object-contain',
              isZoomed ? 'max-h-screen max-w-screen-lg' : 'aspect-square'
            )}
            onError={handleImageError}
          />
        )}

        {/* Zoom/Close button */}
        {allowZoom && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomToggle}
            className={cn(
              'absolute right-2 top-2',
              isZoomed && 'bg-white/10 text-white hover:bg-white/20'
            )}
            aria-label={isZoomed ? 'Close fullscreen' : 'View fullscreen'}
          >
            {isZoomed ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <ZoomIcon className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Download button */}
        {allowDownload && !isZoomed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="absolute bottom-2 right-2"
            aria-label="Download mockup"
          >
            <DownloadIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* View Thumbnails */}
      {altViews.length > 0 && !isZoomed && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleViewChange('main')}
            className={cn(
              'h-16 w-16 overflow-hidden rounded border-2 transition-all',
              activeView === 'main'
                ? 'border-sky-500 ring-2 ring-sky-500/50'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            )}
          >
            <img
              src={mockupUrl}
              alt="Main view"
              className="h-full w-full object-cover"
            />
          </button>
          {altViews.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => handleViewChange(view.id)}
              className={cn(
                'h-16 w-16 overflow-hidden rounded border-2 transition-all',
                activeView === view.id
                  ? 'border-sky-500 ring-2 ring-sky-500/50'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              )}
            >
              <img
                src={view.url}
                alt={view.label}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* View Labels */}
      {altViews.length > 0 && !isZoomed && (
        <div className="flex gap-2 text-xs text-gray-500">
          <span className={activeView === 'main' ? 'font-medium text-gray-900 dark:text-white' : ''}>
            Main
          </span>
          {altViews.map((view) => (
            <span
              key={view.id}
              className={activeView === view.id ? 'font-medium text-gray-900 dark:text-white' : ''}
            >
              {view.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Icons
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

function ZoomIcon({ className }: { className?: string }) {
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

function CloseIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

export default MockupPreview;
