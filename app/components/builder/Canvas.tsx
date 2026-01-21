/**
 * Canvas Component
 *
 * Main canvas for the product builder. Handles rendering design elements,
 * print area overlay, and user interactions (drag, scale, rotate).
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
  type TouchEvent,
  type KeyboardEvent,
  type DragEvent,
} from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import type { DesignElement, PrintArea, Position } from './types';

/**
 * Touch gesture state for tracking multi-touch interactions
 */
interface TouchGestureState {
  /** Initial distance between two touch points (for pinch) */
  initialDistance: number;
  /** Initial angle between two touch points (for rotation) */
  initialAngle: number;
  /** Initial scale when gesture started */
  initialScale: number;
  /** Initial rotation when gesture started */
  initialRotation: number;
  /** Centre point of the gesture */
  centre: Position;
}

/**
 * Touch point interface for cross-compatibility
 */
interface TouchPoint {
  clientX: number;
  clientY: number;
}

/**
 * Calculate distance between two touch points
 */
function getTouchDistance(touch1: TouchPoint, touch2: TouchPoint): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two touch points (in degrees)
 */
function getTouchAngle(touch1: TouchPoint, touch2: TouchPoint): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Get centre point between two touches
 */
function getTouchCentre(touch1: TouchPoint, touch2: TouchPoint): Position {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

export interface CanvasProps {
  /** Product type (mug, apparel, print, storybook) */
  productType: string;
  /** Print area configuration */
  printArea: PrintArea;
  /** Design elements on the canvas */
  elements: DesignElement[];
  /** Callback when an element is updated */
  onElementUpdate: (element: DesignElement) => void;
  /** Callback when an element is selected */
  onElementSelect: (elementId: string | null) => void;
  /** Callback when an element is deleted */
  onElementDelete?: (elementId: string) => void;
  /** Callback when an image is dropped on the canvas */
  onImageDrop?: (file: File) => void;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Show print area dimensions */
  showDimensions?: boolean;
  /** Show bleed margin indicator */
  showBleedMargin?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Rotation increment for keyboard shortcuts (degrees)
 */
const ROTATION_INCREMENT = 15;

/**
 * Zoom increment for zoom controls
 */
const ZOOM_INCREMENT = 0.1;

/**
 * Canvas component for the product builder
 */
export function Canvas({
  productType,
  printArea,
  elements,
  onElementUpdate,
  onElementSelect,
  onElementDelete,
  onImageDrop,
  showZoomControls = false,
  showDimensions = false,
  showBleedMargin = false,
  className,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Touch gesture state
  const [isTouching, setIsTouching] = useState(false);
  const [touchGesture, setTouchGesture] = useState<TouchGestureState | null>(null);
  const touchStartRef = useRef<Position | null>(null);

  // Selected element
  const selectedElement = elements.find((e) => e.isSelected);

  // Calculate canvas scale to fit container
  const [canvasScale, setCanvasScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth - 32; // padding
          const containerHeight = container.clientHeight - 32;
          const scaleX = containerWidth / printArea.width;
          const scaleY = containerHeight / printArea.height;
          setCanvasScale(Math.min(scaleX, scaleY, 1));
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [printArea.width, printArea.height]);

  // Handle element drag start
  const handleElementMouseDown = useCallback(
    (e: MouseEvent, element: DesignElement) => {
      e.stopPropagation();
      onElementSelect(element.id);

      if (!element.isSelected) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - element.transform.position.x * canvasScale * zoom,
        y: e.clientY - element.transform.position.y * canvasScale * zoom,
      });
    },
    [onElementSelect, canvasScale, zoom]
  );

  // Handle mouse move (drag)
  useEffect(() => {
    if (!isDragging || !selectedElement || !dragStart) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newX = (e.clientX - dragStart.x) / (canvasScale * zoom);
      const newY = (e.clientY - dragStart.y) / (canvasScale * zoom);

      onElementUpdate({
        ...selectedElement,
        transform: {
          ...selectedElement.transform,
          position: { x: newX, y: newY },
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedElement, dragStart, canvasScale, zoom, onElementUpdate]);

  // Handle canvas click (deselect)
  const handleCanvasClick = (e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      onElementSelect(null);
    }
  };

  // ============================================
  // TOUCH EVENT HANDLERS (Mobile Support)
  // ============================================

  /**
   * Handle touch start on an element
   */
  const handleElementTouchStart = useCallback(
    (e: TouchEvent, element: DesignElement) => {
      e.stopPropagation();

      // Prevent default to avoid browser gestures interfering
      if (e.touches.length >= 2) {
        e.preventDefault();
      }

      onElementSelect(element.id);

      if (e.touches.length === 1) {
        // Single touch - drag mode
        const touch = e.touches[0];
        setIsTouching(true);
        touchStartRef.current = {
          x: touch.clientX - element.transform.position.x * canvasScale * zoom,
          y: touch.clientY - element.transform.position.y * canvasScale * zoom,
        };
      } else if (e.touches.length === 2 && element.isSelected) {
        // Two-finger gesture - pinch/rotate mode
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        setTouchGesture({
          initialDistance: getTouchDistance(touch1, touch2),
          initialAngle: getTouchAngle(touch1, touch2),
          initialScale: element.transform.scale,
          initialRotation: element.transform.rotation,
          centre: getTouchCentre(touch1, touch2),
        });
      }
    },
    [onElementSelect, canvasScale, zoom]
  );

  /**
   * Handle touch move - drag, pinch, or rotate
   */
  useEffect(() => {
    if (!selectedElement) return;

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 1 && isTouching && touchStartRef.current) {
        // Single touch - drag
        e.preventDefault();
        const touch = e.touches[0];
        const newX = (touch.clientX - touchStartRef.current.x) / (canvasScale * zoom);
        const newY = (touch.clientY - touchStartRef.current.y) / (canvasScale * zoom);

        onElementUpdate({
          ...selectedElement,
          transform: {
            ...selectedElement.transform,
            position: { x: newX, y: newY },
          },
        });
      } else if (e.touches.length === 2 && touchGesture) {
        // Two-finger gesture - pinch and rotate
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const currentDistance = getTouchDistance(touch1, touch2);
        const currentAngle = getTouchAngle(touch1, touch2);

        // Calculate scale change
        const scaleRatio = currentDistance / touchGesture.initialDistance;
        const newScale = Math.max(0.1, Math.min(3, touchGesture.initialScale * scaleRatio));

        // Calculate rotation change
        const angleDelta = currentAngle - touchGesture.initialAngle;
        const newRotation = touchGesture.initialRotation + angleDelta;

        onElementUpdate({
          ...selectedElement,
          transform: {
            ...selectedElement.transform,
            scale: newScale,
            rotation: newRotation,
          },
        });
      }
    };

    const handleTouchEnd = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 0) {
        // All fingers lifted
        setIsTouching(false);
        touchStartRef.current = null;
        setTouchGesture(null);
      } else if (e.touches.length === 1 && touchGesture) {
        // Went from 2 fingers to 1 - switch to drag mode
        setTouchGesture(null);
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX - selectedElement.transform.position.x * canvasScale * zoom,
          y: touch.clientY - selectedElement.transform.position.y * canvasScale * zoom,
        };
        setIsTouching(true);
      }
    };

    if (isTouching || touchGesture) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [isTouching, touchGesture, selectedElement, canvasScale, zoom, onElementUpdate]);

  /**
   * Handle touch on canvas (deselect)
   */
  const handleCanvasTouchStart = (e: TouchEvent) => {
    if (e.target === canvasRef.current && e.touches.length === 1) {
      onElementSelect(null);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedElement) return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          onElementDelete?.(selectedElement.id);
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          onElementUpdate({
            ...selectedElement,
            transform: {
              ...selectedElement.transform,
              rotation: selectedElement.transform.rotation + ROTATION_INCREMENT,
            },
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          onElementUpdate({
            ...selectedElement,
            transform: {
              ...selectedElement.transform,
              position: {
                ...selectedElement.transform.position,
                y: selectedElement.transform.position.y - (e.shiftKey ? 10 : 1),
              },
            },
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          onElementUpdate({
            ...selectedElement,
            transform: {
              ...selectedElement.transform,
              position: {
                ...selectedElement.transform.position,
                y: selectedElement.transform.position.y + (e.shiftKey ? 10 : 1),
              },
            },
          });
          break;

        case 'ArrowLeft':
          e.preventDefault();
          onElementUpdate({
            ...selectedElement,
            transform: {
              ...selectedElement.transform,
              position: {
                ...selectedElement.transform.position,
                x: selectedElement.transform.position.x - (e.shiftKey ? 10 : 1),
              },
            },
          });
          break;

        case 'ArrowRight':
          e.preventDefault();
          onElementUpdate({
            ...selectedElement,
            transform: {
              ...selectedElement.transform,
              position: {
                ...selectedElement.transform.position,
                x: selectedElement.transform.position.x + (e.shiftKey ? 10 : 1),
              },
            },
          });
          break;
      }
    },
    [selectedElement, onElementUpdate, onElementDelete]
  );

  // Handle drag and drop
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && onImageDrop) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onImageDrop(file);
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_INCREMENT, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - ZOOM_INCREMENT, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const isEmpty = elements.length === 0;

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Canvas Container */}
      <div
        data-testid="builder-canvas"
        ref={canvasRef}
        role="application"
        aria-label={`Design canvas for ${productType}`}
        tabIndex={0}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouchStart}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-lg border-2 bg-gray-100 outline-none transition-all focus:ring-2 focus:ring-sky-500 dark:bg-gray-800',
          isDragOver && 'border-sky-500 bg-sky-50 dark:bg-sky-900/20',
          !isDragOver && 'border-gray-200 dark:border-gray-700'
        )}
        style={{
          minHeight: '400px',
          // Prevent browser gestures from interfering with canvas touch interactions
          touchAction: 'none',
        }}
      >
        {/* Print Area */}
        <div
          data-testid="print-area-overlay"
          className="relative bg-white shadow-lg"
          style={{
            width: printArea.width * canvasScale * zoom,
            height: printArea.height * canvasScale * zoom,
          }}
        >
          {/* Bleed Margin Indicator */}
          {showBleedMargin && (
            <div
              data-testid="bleed-margin-indicator"
              className="pointer-events-none absolute border border-dashed border-amber-400"
              style={{
                top: printArea.bleedMargin * canvasScale * zoom,
                left: printArea.bleedMargin * canvasScale * zoom,
                right: printArea.bleedMargin * canvasScale * zoom,
                bottom: printArea.bleedMargin * canvasScale * zoom,
              }}
            />
          )}

          {/* Design Elements */}
          {elements.map((element) => (
            <DesignElementComponent
              key={element.id}
              element={element}
              canvasScale={canvasScale}
              zoom={zoom}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
              onTouchStart={(e) => handleElementTouchStart(e, element)}
            />
          ))}

          {/* Empty State */}
          {isEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <UploadIcon className="mb-4 h-16 w-16" />
              <p className="text-lg font-medium">Drag and drop your image here</p>
              <p className="mt-2 text-sm">or use the upload button below</p>
            </div>
          )}
        </div>
      </div>

      {/* Dimensions Display */}
      {showDimensions && (
        <div
          data-testid="print-area-dimensions"
          className="mt-2 text-center text-sm text-gray-500"
        >
          Print area: {printArea.width} x {printArea.height} px
        </div>
      )}

      {/* Zoom Controls */}
      {showZoomControls && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>

          <span
            data-testid="zoom-level"
            className="min-w-[4rem] text-center text-sm text-gray-600 dark:text-gray-300"
          >
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            disabled={zoom >= 2}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            aria-label="Reset zoom"
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual design element on the canvas
 */
interface DesignElementComponentProps {
  element: DesignElement;
  canvasScale: number;
  zoom: number;
  onMouseDown: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
}

function DesignElementComponent({
  element,
  canvasScale,
  zoom,
  onMouseDown,
  onTouchStart,
}: DesignElementComponentProps) {
  const { transform, imageUrl, imageWidth, imageHeight, isSelected } = element;
  const scale = canvasScale * zoom;

  const scaledWidth = imageWidth * transform.scale * scale;
  const scaledHeight = imageHeight * transform.scale * scale;

  return (
    <div
      data-testid={`design-element-${element.id}`}
      aria-label={`Design element ${element.id}`}
      className={cn(
        'absolute cursor-move select-none',
        isSelected && 'z-10'
      )}
      style={{
        left: transform.position.x * scale - scaledWidth / 2,
        top: transform.position.y * scale - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
        transform: `rotate(${transform.rotation}deg)`,
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <img
        src={imageUrl}
        alt="Design"
        className="h-full w-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Selection Handles */}
      {isSelected && (
        <div
          data-testid="selection-handles"
          className="pointer-events-none absolute inset-0 border-2 border-sky-500"
        >
          {/* Corner handles */}
          <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-sky-500 bg-white" />
          <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-sky-500 bg-white" />
          <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full border-2 border-sky-500 bg-white" />
          <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-sky-500 bg-white" />

          {/* Rotation handle */}
          <div className="absolute -top-8 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-sky-500 bg-white" />
          <div className="absolute -top-6 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-sky-500" />
        </div>
      )}
    </div>
  );
}

// Icons
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

function MinusIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

export default Canvas;
