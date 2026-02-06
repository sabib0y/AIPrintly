/**
 * PageEditor Component
 *
 * Single page editing interface for storybooks.
 * Handles text editing, image placement, and layout selection.
 */

import { useState, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { TextEditor } from './TextEditor';
import type { StoryPage } from './PageThumbnailStrip';

/**
 * Page layout options
 */
export type PageLayout = 'full-image' | 'text-top' | 'text-bottom' | 'text-left' | 'text-right' | 'text-only';

/**
 * Page data structure
 */
export interface PageData {
  /** Page ID */
  id: string;
  /** Page text content */
  text: string;
  /** Illustration URL */
  illustrationUrl?: string;
  /** Page layout */
  layout: PageLayout;
  /** Background colour */
  backgroundColor?: string;
  /** Font size (numeric for flexible sizing) */
  fontSize?: number | 'sm' | 'md' | 'lg';
  /** Text alignment */
  textAlignment?: 'left' | 'centre' | 'right';
}

export interface PageEditorProps {
  /** Page data */
  pageData: PageData;
  /** Callback when page is updated */
  onPageUpdate: (page: PageData) => void;
  /** Callback to generate illustration */
  onGenerateIllustration?: () => void;
  /** Callback to regenerate illustration */
  onRegenerateIllustration?: () => void;
  /** Callback to upload custom image */
  onUploadImage?: (file: File) => void;
  /** Is illustration loading */
  isIllustrationLoading?: boolean;
  /** Is illustration generating */
  isGeneratingIllustration?: boolean;
  /** Show layout selector */
  showLayoutSelector?: boolean;
  /** Show font size selector */
  showFontSize?: boolean;
  /** Show alignment controls */
  showAlignment?: boolean;
  /** Maximum text length */
  maxTextLength?: number;
  /** Book dimensions */
  bookSize?: { width: number; height: number };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Layout configurations
 */
const LAYOUT_CONFIG: Record<PageLayout, { label: string; icon: string }> = {
  'full-image': { label: 'Full Image', icon: 'image' },
  'text-top': { label: 'Text Top', icon: 'text-top' },
  'text-bottom': { label: 'Text Bottom', icon: 'text-bottom' },
  'text-left': { label: 'Text Left', icon: 'text-left' },
  'text-right': { label: 'Text Right', icon: 'text-right' },
  'text-only': { label: 'Text Only', icon: 'text' },
};

/**
 * PageEditor provides editing controls for a single storybook page.
 *
 * Features:
 * - Inline text editing
 * - Layout selection
 * - Image replacement
 * - Font size control
 *
 * @example
 * ```tsx
 * <PageEditor
 *   page={currentPage}
 *   onPageUpdate={(page) => updatePage(page)}
 *   onRegenerateIllustration={() => regenerate(page.id)}
 * />
 * ```
 */
export function PageEditor({
  pageData,
  onPageUpdate,
  onGenerateIllustration,
  onRegenerateIllustration,
  onUploadImage,
  isIllustrationLoading = false,
  isGeneratingIllustration = false,
  showLayoutSelector = true,
  showFontSize = false,
  showAlignment = false,
  maxTextLength,
  bookSize = { width: 600, height: 600 },
  className,
}: PageEditorProps) {
  const [isEditingText, setIsEditingText] = useState(false);

  // Alias for convenience
  const page = pageData;

  // Handle text change
  const handleTextChange = useCallback(
    (text: string) => {
      if (maxTextLength && text.length > maxTextLength) {
        text = text.slice(0, maxTextLength);
      }
      onPageUpdate({ ...page, text });
    },
    [page, onPageUpdate, maxTextLength]
  );

  // Handle layout change
  const handleLayoutChange = (layout: PageLayout) => {
    onPageUpdate({ ...page, layout });
  };

  // Handle font size change
  const handleFontSizeChange = (fontSize: PageData['fontSize']) => {
    onPageUpdate({ ...page, fontSize });
  };

  // Handle alignment change
  const handleAlignmentChange = (textAlignment: PageData['textAlignment']) => {
    onPageUpdate({ ...page, textAlignment });
  };

  // Handle file drop for image upload
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/') && onUploadImage) {
      onUploadImage(file);
    }
  };

  const showText = page.layout !== 'full-image';
  const showImage = page.layout !== 'text-only';

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Page Preview */}
      <div className="mx-auto">
        <PagePreview
          page={page}
          width={bookSize.width}
          height={bookSize.height}
          onTextClick={() => setIsEditingText(true)}
          isEditingText={isEditingText}
          onTextChange={handleTextChange}
          onTextBlur={() => setIsEditingText(false)}
          isIllustrationLoading={isIllustrationLoading}
          onImageDrop={handleImageDrop}
        />
      </div>

      {/* Layout Options */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
          Page Layout
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LAYOUT_CONFIG) as PageLayout[]).map((layout) => (
            <LayoutButton
              key={layout}
              layout={layout}
              isSelected={page.layout === layout}
              onClick={() => handleLayoutChange(layout)}
            />
          ))}
        </div>
      </div>

      {/* Text Options */}
      {showText && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Text Size
          </h3>
          <div className="flex gap-2">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <Button
                key={size}
                variant={page.fontSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange(size)}
              >
                {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Image Options */}
      {showImage && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Illustration
          </h3>
          <div className="flex flex-wrap gap-2">
            {onRegenerateIllustration && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateIllustration}
                disabled={isIllustrationLoading}
              >
                <RefreshIcon className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
            {onUploadImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) onUploadImage(file);
                  };
                  input.click();
                }}
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Page preview with editable content
 */
interface PagePreviewProps {
  page: PageData;
  width: number;
  height: number;
  onTextClick: () => void;
  isEditingText: boolean;
  onTextChange: (text: string) => void;
  onTextBlur: () => void;
  isIllustrationLoading: boolean;
  onImageDrop: (e: React.DragEvent) => void;
}

function PagePreview({
  page,
  width,
  height,
  onTextClick,
  isEditingText,
  onTextChange,
  onTextBlur,
  isIllustrationLoading,
  onImageDrop,
}: PagePreviewProps) {
  const fontSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[page.fontSize ?? 'md'];

  const layoutClasses: Record<PageLayout, string> = {
    'full-image': '',
    'text-top': 'flex flex-col',
    'text-bottom': 'flex flex-col-reverse',
    'text-left': 'flex flex-row',
    'text-right': 'flex flex-row-reverse',
    'text-only': 'flex items-center justify-center',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
        layoutClasses[page.layout]
      )}
      style={{ width, height }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onImageDrop}
    >
      {/* Illustration Area */}
      {page.layout !== 'text-only' && (
        <div
          className={cn(
            'relative overflow-hidden',
            page.layout === 'full-image' && 'absolute inset-0',
            (page.layout === 'text-top' || page.layout === 'text-bottom') && 'flex-1',
            (page.layout === 'text-left' || page.layout === 'text-right') && 'w-1/2'
          )}
        >
          {isIllustrationLoading ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <LoadingSpinner className="h-8 w-8 text-sky-500" />
            </div>
          ) : page.illustrationUrl ? (
            <img
              src={page.illustrationUrl}
              alt={`Illustration for page ${page.id}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-700">
              <ImagePlaceholder className="h-16 w-16" />
            </div>
          )}
        </div>
      )}

      {/* Text Area */}
      {page.layout !== 'full-image' && (
        <div
          className={cn(
            'p-4',
            page.layout === 'text-only' && 'flex h-full items-center',
            (page.layout === 'text-top' || page.layout === 'text-bottom') && 'flex-shrink-0',
            (page.layout === 'text-left' || page.layout === 'text-right') && 'w-1/2 flex items-center'
          )}
          style={{
            backgroundColor: page.backgroundColor,
          }}
        >
          {isEditingText ? (
            <TextEditor
              value={page.text}
              onChange={onTextChange}
              onBlur={onTextBlur}
              autoFocus
              className={cn('w-full', fontSizeClass)}
            />
          ) : (
            <div
              onClick={onTextClick}
              className={cn(
                'w-full cursor-text rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600',
                fontSizeClass,
                !page.text && 'text-gray-400'
              )}
            >
              {page.text || 'Click to add text...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Layout selection button
 */
function LayoutButton({
  layout,
  isSelected,
  onClick,
}: {
  layout: PageLayout;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = LAYOUT_CONFIG[layout];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 transition-all',
        isSelected
          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
      )}
      title={config.label}
    >
      <LayoutIcon type={layout} className="h-6 w-6 text-gray-600 dark:text-gray-400" />
    </button>
  );
}

/**
 * Layout icon based on type
 */
function LayoutIcon({ type, className }: { type: PageLayout; className?: string }) {
  const boxClasses = 'fill-current';
  const lineClasses = 'stroke-current stroke-[2]';

  switch (type) {
    case 'full-image':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" className={boxClasses} opacity="0.3" />
          <circle cx="12" cy="10" r="3" className={lineClasses} fill="none" />
        </svg>
      );
    case 'text-top':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="18" height="6" rx="1" className={boxClasses} opacity="0.6" />
          <rect x="3" y="11" width="18" height="10" rx="1" className={boxClasses} opacity="0.3" />
        </svg>
      );
    case 'text-bottom':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="18" height="10" rx="1" className={boxClasses} opacity="0.3" />
          <rect x="3" y="15" width="18" height="6" rx="1" className={boxClasses} opacity="0.6" />
        </svg>
      );
    case 'text-left':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="8" height="18" rx="1" className={boxClasses} opacity="0.6" />
          <rect x="13" y="3" width="8" height="18" rx="1" className={boxClasses} opacity="0.3" />
        </svg>
      );
    case 'text-right':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="8" height="18" rx="1" className={boxClasses} opacity="0.3" />
          <rect x="13" y="3" width="8" height="18" rx="1" className={boxClasses} opacity="0.6" />
        </svg>
      );
    case 'text-only':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" className={boxClasses} opacity="0.2" />
          <line x1="6" y1="8" x2="18" y2="8" className={lineClasses} />
          <line x1="6" y1="12" x2="18" y2="12" className={lineClasses} />
          <line x1="6" y1="16" x2="14" y2="16" className={lineClasses} />
        </svg>
      );
  }
}

// Icons
function RefreshIcon({ className }: { className?: string }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
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

export default PageEditor;
