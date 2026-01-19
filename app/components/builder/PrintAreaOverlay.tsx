/**
 * PrintAreaOverlay Component
 *
 * Visual overlay showing the print area boundaries, safe zones,
 * and bleed margins for the product builder.
 */

import { cn } from '~/lib/utils';
import type { PrintArea } from './types';

export interface PrintAreaOverlayProps {
  /** Print area configuration */
  printArea: PrintArea;
  /** Current zoom level */
  zoom?: number;
  /** Show the bleed margin indicator */
  showBleedMargin?: boolean;
  /** Show the safe area indicator */
  showSafeArea?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show dimension labels */
  showDimensions?: boolean;
  /** Show centre guides */
  showCentreGuides?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PrintAreaOverlay displays visual guides for the print area.
 *
 * Features:
 * - Bleed margin indicator
 * - Safe zone indicator
 * - Grid overlay
 * - Dimension labels
 * - Centre guides
 *
 * @example
 * ```tsx
 * <PrintAreaOverlay
 *   printArea={printArea}
 *   showBleedMargin
 *   showSafeArea
 *   showCentreGuides
 * />
 * ```
 */
export function PrintAreaOverlay({
  printArea,
  zoom = 1,
  showBleedMargin = false,
  showSafeArea = true,
  showGrid = false,
  showDimensions = false,
  showCentreGuides = false,
  className,
}: PrintAreaOverlayProps) {
  const { width, height, bleedMargin } = printArea;

  return (
    <div
      data-testid="print-area-overlay"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {/* Bleed Margin Indicator (outer danger zone) */}
      {showBleedMargin && (
        <div
          data-testid="bleed-margin"
          className="absolute border border-dashed border-red-400"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Corner labels */}
          <span className="absolute -top-5 left-0 text-xs text-red-500">
            Bleed zone
          </span>
        </div>
      )}

      {/* Safe Area Indicator */}
      {showSafeArea && (
        <div
          data-testid="safe-area"
          className="absolute border border-dashed border-green-400"
          style={{
            top: bleedMargin * zoom,
            left: bleedMargin * zoom,
            right: bleedMargin * zoom,
            bottom: bleedMargin * zoom,
          }}
        >
          {/* Corner labels */}
          <span className="absolute -bottom-5 right-0 text-xs text-green-500">
            Safe area
          </span>
        </div>
      )}

      {/* Grid Overlay */}
      {showGrid && (
        <div
          data-testid="grid-overlay"
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
          }}
        />
      )}

      {/* Centre Guides */}
      {showCentreGuides && (
        <>
          {/* Vertical centre line */}
          <div
            data-testid="centre-guide-vertical"
            className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-sky-400/30"
          />
          {/* Horizontal centre line */}
          <div
            data-testid="centre-guide-horizontal"
            className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-sky-400/30"
          />
          {/* Centre crosshair */}
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full border border-sky-400/50" />
          </div>
        </>
      )}

      {/* Dimension Labels */}
      {showDimensions && (
        <>
          {/* Width label */}
          <div
            data-testid="dimension-width"
            className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-gray-800/75 px-2 py-0.5 text-xs text-white"
          >
            {width}px
          </div>
          {/* Height label */}
          <div
            data-testid="dimension-height"
            className="absolute -right-12 top-1/2 -translate-y-1/2 rotate-90 rounded bg-gray-800/75 px-2 py-0.5 text-xs text-white"
          >
            {height}px
          </div>
        </>
      )}

      {/* Corner Markers */}
      <CornerMarker position="top-left" />
      <CornerMarker position="top-right" />
      <CornerMarker position="bottom-left" />
      <CornerMarker position="bottom-right" />
    </div>
  );
}

/**
 * Corner marker component for registration marks
 */
interface CornerMarkerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

function CornerMarker({ position }: CornerMarkerProps) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  const borderClasses = {
    'top-left': 'border-t-2 border-l-2',
    'top-right': 'border-t-2 border-r-2',
    'bottom-left': 'border-b-2 border-l-2',
    'bottom-right': 'border-b-2 border-r-2',
  };

  return (
    <div
      className={cn(
        'absolute h-4 w-4 border-gray-400',
        positionClasses[position],
        borderClasses[position]
      )}
    />
  );
}

/**
 * Legend component for the overlay indicators
 */
export function PrintAreaLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-4 text-xs', className)}>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 border border-dashed border-red-400" />
        <span className="text-gray-600 dark:text-gray-400">Bleed zone</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 border border-dashed border-green-400" />
        <span className="text-gray-600 dark:text-gray-400">Safe area</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 border-l border-t border-gray-400" />
        <span className="text-gray-600 dark:text-gray-400">Print boundary</span>
      </div>
    </div>
  );
}

export default PrintAreaOverlay;
