/**
 * PageThumbnailStrip Component
 *
 * Horizontal strip of page thumbnails for storybook navigation.
 * Shows all pages with current selection and allows reordering.
 */

import { useState, useRef } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';

export interface StoryPage {
  /** Page ID */
  id: string;
  /** Page number (1-based) */
  pageNumber: number;
  /** Page thumbnail URL */
  thumbnailUrl?: string;
  /** Page text content preview */
  textPreview?: string;
  /** Whether page has illustration */
  hasIllustration: boolean;
  /** Whether page is the cover */
  isCover?: boolean;
}

export interface PageThumbnailStripProps {
  /** Array of story pages */
  pages: StoryPage[];
  /** Currently selected page ID */
  selectedPageId: string | null;
  /** Callback when page is selected */
  onPageSelect: (pageId: string) => void;
  /** Callback when pages are reordered */
  onPagesReorder?: (pages: StoryPage[]) => void;
  /** Callback to add new page */
  onAddPage?: () => void;
  /** Callback to delete page */
  onDeletePage?: (pageId: string) => void;
  /** Allow drag reordering */
  allowReorder?: boolean;
  /** Show add page button */
  showAddButton?: boolean;
  /** Maximum number of pages allowed */
  maxPages?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageThumbnailStrip displays a horizontal scrollable strip of page thumbnails.
 *
 * Features:
 * - Page selection
 * - Drag to reorder
 * - Add/delete pages
 * - Cover page indicator
 *
 * @example
 * ```tsx
 * <PageThumbnailStrip
 *   pages={storyPages}
 *   selectedPageId={currentPageId}
 *   onPageSelect={(id) => setCurrentPageId(id)}
 *   onAddPage={() => addNewPage()}
 *   allowReorder
 * />
 * ```
 */
export function PageThumbnailStrip({
  pages,
  selectedPageId,
  onPageSelect,
  onPagesReorder,
  onAddPage,
  onDeletePage,
  allowReorder = false,
  showAddButton = true,
  maxPages = 32,
  className,
}: PageThumbnailStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const canAddPage = pages.length < maxPages;

  // Handle drag start
  const handleDragStart = (index: number) => {
    if (!allowReorder) return;
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDropTargetIndex(index);
  };

  // Handle drop
  const handleDrop = (index: number) => {
    if (draggedIndex === null || !onPagesReorder) return;

    const newPages = [...pages];
    const [removed] = newPages.splice(draggedIndex, 1);
    newPages.splice(index, 0, removed);

    // Update page numbers
    const renumberedPages = newPages.map((page, i) => ({
      ...page,
      pageNumber: i + 1,
    }));

    onPagesReorder(renumberedPages);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Scroll to selected page
  const scrollToPage = (pageId: string) => {
    const pageElement = document.getElementById(`page-thumb-${pageId}`);
    if (pageElement && stripRef.current) {
      pageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Scroll Container */}
      <div
        ref={stripRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isSelected={page.id === selectedPageId}
            isDragging={draggedIndex === index}
            isDropTarget={dropTargetIndex === index}
            onSelect={() => {
              onPageSelect(page.id);
              scrollToPage(page.id);
            }}
            onDelete={onDeletePage ? () => onDeletePage(page.id) : undefined}
            draggable={allowReorder && !page.isCover}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Add Page Button */}
        {showAddButton && canAddPage && (
          <button
            type="button"
            onClick={onAddPage}
            className="flex h-24 w-18 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-sky-500 dark:hover:bg-sky-900/20"
            aria-label="Add new page"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Page Count */}
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        {pages.length} of {maxPages} pages
      </div>
    </div>
  );
}

/**
 * Individual page thumbnail
 */
interface PageThumbnailProps {
  page: StoryPage;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function PageThumbnail({
  page,
  isSelected,
  isDragging,
  isDropTarget,
  onSelect,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: PageThumbnailProps) {
  return (
    <div
      id={`page-thumb-${page.id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex-shrink-0',
        isDragging && 'opacity-50',
        isDropTarget && 'translate-x-2'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative h-24 w-18 overflow-hidden rounded-lg border-2 bg-white transition-all dark:bg-gray-800',
          isSelected
            ? 'border-sky-500 ring-2 ring-sky-500/50'
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
        )}
      >
        {/* Thumbnail Image */}
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.pageNumber}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-700">
            {page.isCover ? (
              <BookIcon className="h-8 w-8" />
            ) : page.hasIllustration ? (
              <ImageIcon className="h-6 w-6" />
            ) : (
              <TextIcon className="h-6 w-6" />
            )}
          </div>
        )}

        {/* Cover Badge */}
        {page.isCover && (
          <span className="absolute left-1 top-1 rounded bg-sky-500 px-1 py-0.5 text-[10px] font-medium text-white">
            Cover
          </span>
        )}

        {/* Page Number */}
        <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white">
          {page.pageNumber}
        </span>
      </button>

      {/* Delete Button */}
      {onDelete && !page.isCover && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 group-hover:flex"
          aria-label={`Delete page ${page.pageNumber}`}
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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

function ImageIcon({ className }: { className?: string }) {
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

function TextIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
      />
    </svg>
  );
}

export default PageThumbnailStrip;
