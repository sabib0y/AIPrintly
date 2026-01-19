/**
 * TextEditor Component
 *
 * Inline text editing for storybook pages.
 * Supports formatting, font size, alignment, and character limits.
 */

import { useRef, useEffect, useId } from 'react';
import { cn } from '~/lib/utils';

export type TextAlignment = 'left' | 'centre' | 'right';

export interface TextEditorProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the editor */
  label?: string;
  /** Aria label when no visible label */
  ariaLabel?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Show formatting toolbar */
  showToolbar?: boolean;
  /** Show font size selector */
  showFontSize?: boolean;
  /** Current font size */
  fontSize?: number;
  /** Callback when font size changes */
  onFontSizeChange?: (size: number) => void;
  /** Show alignment controls */
  showAlignment?: boolean;
  /** Current text alignment */
  alignment?: TextAlignment;
  /** Callback when alignment changes */
  onAlignmentChange?: (alignment: TextAlignment) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Blur callback */
  onBlur?: () => void;
  /** Focus callback */
  onFocus?: () => void;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

/** Available font sizes */
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

/**
 * TextEditor provides inline text editing for storybook pages.
 *
 * Features:
 * - Rich text formatting (bold, italic)
 * - Font size selection
 * - Text alignment
 * - Character count and limits
 * - Auto-resize
 *
 * @example
 * ```tsx
 * <TextEditor
 *   value={pageText}
 *   onChange={(text) => setPageText(text)}
 *   maxLength={500}
 *   showFontSize
 *   showAlignment
 *   alignment="centre"
 * />
 * ```
 */
export function TextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  label,
  ariaLabel,
  maxLength,
  showToolbar = false,
  showFontSize = false,
  fontSize = 16,
  onFontSizeChange,
  showAlignment = false,
  alignment = 'left',
  onAlignmentChange,
  readOnly = false,
  minHeight,
  maxHeight,
  onBlur,
  onFocus,
  error,
  className,
  autoFocus = false,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Enforce maxLength
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }

    onChange(newValue);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    onFontSizeChange?.(newSize);
  };

  const handleAlignmentChange = (newAlignment: TextAlignment) => {
    onAlignmentChange?.(newAlignment);
  };

  const insertFormatting = (tag: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const marker = tag === 'bold' ? '**' : '*';
    const newText =
      value.substring(0, start) +
      marker +
      selectedText +
      marker +
      value.substring(end);

    onChange(newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + marker.length, end + marker.length);
    }, 0);
  };

  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.9;
  const isAtLimit = maxLength && characterCount >= maxLength;

  const textAlignClass = {
    left: 'text-left',
    centre: 'text-center',
    right: 'text-right',
  }[alignment];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          {/* Bold */}
          <button
            type="button"
            onClick={() => insertFormatting('bold')}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Bold"
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="h-4 w-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => insertFormatting('italic')}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Italic"
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>

          {/* Separator */}
          {(showFontSize || showAlignment) && (
            <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
          )}

          {/* Font Size */}
          {showFontSize && (
            <select
              value={fontSize}
              onChange={handleFontSizeChange}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              aria-label="Font size"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          )}

          {/* Alignment */}
          {showAlignment && (
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => handleAlignmentChange('left')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'left'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align left"
                title="Align left"
              >
                <AlignLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAlignmentChange('centre')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'centre'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align centre"
                title="Align centre"
              >
                <AlignCentreIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAlignmentChange('right')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'right'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align right"
                title="Align right"
              >
                <AlignRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Standalone controls (when no toolbar) */}
      {!showToolbar && !readOnly && (showFontSize || showAlignment) && (
        <div className="flex flex-wrap items-center gap-2">
          {showFontSize && (
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-fontsize`} className="text-xs text-gray-500">
                Size:
              </label>
              <select
                id={`${id}-fontsize`}
                value={fontSize}
                onChange={handleFontSizeChange}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                aria-label="Font size"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
          )}

          {showAlignment && (
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => handleAlignmentChange('left')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'left'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align left"
                title="Align left"
              >
                <AlignLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAlignmentChange('centre')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'centre'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align centre"
                title="Align centre"
              >
                <AlignCentreIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAlignmentChange('right')}
                className={cn(
                  'rounded p-1.5',
                  alignment === 'right'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
                aria-label="Align right"
                title="Align right"
              >
                <AlignRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={readOnly}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'w-full resize-none rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500',
          textAlignClass,
          showToolbar && !readOnly ? 'rounded-t-none border-t-0' : '',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-200 dark:border-gray-700',
          readOnly && 'cursor-not-allowed bg-gray-50 dark:bg-gray-900'
        )}
        style={{
          fontSize: `${fontSize}px`,
          minHeight: minHeight ? `${minHeight}px` : undefined,
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        }}
      />

      {/* Footer: Character count and error */}
      <div className="flex items-center justify-between">
        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Character count */}
        {maxLength && (
          <p
            className={cn(
              'ml-auto text-xs',
              isAtLimit
                ? 'text-red-600 dark:text-red-400'
                : isNearLimit
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {characterCount} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

// Icons
function BoldIcon({ className }: { className?: string }) {
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
        d="M7.5 4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h5.25a4.5 4.5 0 0 0 1.856-8.606A4.5 4.5 0 0 0 12 4.5H7.5Zm0 6h4.5a1.5 1.5 0 1 0 0-3H7.5v3Zm0 3v3h5.25a1.5 1.5 0 0 0 0-3H7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ItalicIcon({ className }: { className?: string }) {
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
        d="M10.5 4.5a1.5 1.5 0 1 0 0 3h1.757l-3.514 9H6a1.5 1.5 0 1 0 0 3h7.5a1.5 1.5 0 1 0 0-3h-1.757l3.514-9H18a1.5 1.5 0 1 0 0-3h-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlignLeftIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5"
      />
    </svg>
  );
}

function AlignCentreIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5"
      />
    </svg>
  );
}

function AlignRightIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M9.75 12h10.5M3.75 17.25h16.5"
      />
    </svg>
  );
}

export default TextEditor;
