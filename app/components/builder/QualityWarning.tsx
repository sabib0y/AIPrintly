/**
 * QualityWarning Component
 *
 * Displays quality warnings for the design, including DPI and coverage issues.
 * Helps users understand potential print quality problems.
 */

import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import type { QualityAssessment } from './types';

export interface QualityWarningProps {
  /** Quality assessment data */
  assessment: QualityAssessment | null;
  /** Minimum required DPI for the product */
  minRequiredDpi?: number;
  /** Compact display mode */
  compact?: boolean;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Callback when user acknowledges warnings */
  onAcknowledge?: () => void;
  /** Callback when user wants to adjust design */
  onAdjustDesign?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Quality level thresholds
 */
const QUALITY_LEVELS = {
  excellent: { minDpi: 300, label: 'Excellent', color: 'green' },
  good: { minDpi: 200, label: 'Good', color: 'sky' },
  acceptable: { minDpi: 150, label: 'Acceptable', color: 'amber' },
  poor: { minDpi: 0, label: 'Poor', color: 'red' },
};

/**
 * Get quality level based on DPI
 */
function getQualityLevel(dpi: number): keyof typeof QUALITY_LEVELS {
  if (dpi >= 300) return 'excellent';
  if (dpi >= 200) return 'good';
  if (dpi >= 150) return 'acceptable';
  return 'poor';
}

/**
 * QualityWarning displays design quality feedback.
 *
 * Features:
 * - DPI indicator with visual bar
 * - Coverage percentage
 * - Warning messages
 * - Action buttons
 *
 * @example
 * ```tsx
 * <QualityWarning
 *   assessment={qualityAssessment}
 *   minRequiredDpi={150}
 *   onAdjustDesign={() => selectElement()}
 * />
 * ```
 */
export function QualityWarning({
  assessment,
  minRequiredDpi = 150,
  compact = false,
  showDetails = true,
  onAcknowledge,
  onAdjustDesign,
  className,
}: QualityWarningProps) {
  // No assessment or everything is acceptable
  if (!assessment) {
    return null;
  }

  const { effectiveDpi, overlapPercentage, warnings, isAcceptable } = assessment;
  const qualityLevel = getQualityLevel(effectiveDpi);

  // If everything is acceptable and compact mode, show nothing
  if (isAcceptable && compact) {
    return null;
  }

  // If everything is acceptable in non-compact mode, show success
  if (isAcceptable && !compact) {
    return (
      <div
        className={cn(
          'rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              Design looks great!
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              Your design meets the quality requirements for printing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show warnings
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        qualityLevel === 'poor'
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <WarningIcon
          className={cn(
            'h-5 w-5 flex-shrink-0',
            qualityLevel === 'poor'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          )}
        />

        <div className="flex-1">
          <p
            className={cn(
              'font-medium',
              qualityLevel === 'poor'
                ? 'text-red-800 dark:text-red-300'
                : 'text-amber-800 dark:text-amber-300'
            )}
          >
            {qualityLevel === 'poor'
              ? 'Quality issues detected'
              : 'Quality could be improved'}
          </p>

          {/* Warning Messages */}
          {warnings.length > 0 && (
            <ul
              className={cn(
                'mt-2 list-inside list-disc space-y-1 text-sm',
                qualityLevel === 'poor'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-amber-700 dark:text-amber-400'
              )}
            >
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}

          {/* Quality Details */}
          {showDetails && (
            <div className="mt-4 space-y-3">
              {/* DPI Indicator */}
              <QualityIndicator
                label="Resolution (DPI)"
                value={effectiveDpi}
                min={0}
                max={400}
                threshold={minRequiredDpi}
                unit="DPI"
                qualityLevel={qualityLevel}
              />

              {/* Coverage Indicator */}
              <QualityIndicator
                label="Design Coverage"
                value={Math.round(overlapPercentage * 100)}
                min={0}
                max={100}
                threshold={30}
                unit="%"
                qualityLevel={overlapPercentage >= 0.3 ? 'good' : 'poor'}
              />
            </div>
          )}

          {/* Action Buttons */}
          {(onAcknowledge || onAdjustDesign) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onAdjustDesign && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdjustDesign}
                  className="bg-white dark:bg-gray-800"
                >
                  Adjust Design
                </Button>
              )}
              {onAcknowledge && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAcknowledge}
                >
                  Continue Anyway
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Quality indicator with visual progress bar
 */
interface QualityIndicatorProps {
  label: string;
  value: number;
  min: number;
  max: number;
  threshold: number;
  unit: string;
  qualityLevel: keyof typeof QUALITY_LEVELS;
}

function QualityIndicator({
  label,
  value,
  min,
  max,
  threshold,
  unit,
  qualityLevel,
}: QualityIndicatorProps) {
  const percentage = Math.min(((value - min) / (max - min)) * 100, 100);
  const thresholdPercentage = ((threshold - min) / (max - min)) * 100;

  const colorClasses = {
    excellent: 'bg-green-500',
    good: 'bg-sky-500',
    acceptable: 'bg-amber-500',
    poor: 'bg-red-500',
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={cn(
            'font-medium',
            qualityLevel === 'poor'
              ? 'text-red-600 dark:text-red-400'
              : qualityLevel === 'acceptable'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-green-600 dark:text-green-400'
          )}
        >
          {value} {unit}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {/* Progress bar */}
        <div
          className={cn('absolute h-full transition-all', colorClasses[qualityLevel])}
          style={{ width: `${percentage}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute h-full w-0.5 bg-gray-400"
          style={{ left: `${thresholdPercentage}%` }}
        />
      </div>
      <div
        className="mt-0.5 text-xs text-gray-500"
        style={{ marginLeft: `calc(${thresholdPercentage}% - 20px)` }}
      >
        Min: {threshold}
      </div>
    </div>
  );
}

/**
 * Compact quality badge
 */
export function QualityBadge({
  assessment,
  className,
}: {
  assessment: QualityAssessment | null;
  className?: string;
}) {
  if (!assessment) return null;

  const qualityLevel = getQualityLevel(assessment.effectiveDpi);
  const config = QUALITY_LEVELS[qualityLevel];

  const colorClasses = {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    acceptable: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClasses[qualityLevel],
        className
      )}
    >
      {qualityLevel === 'poor' ? (
        <WarningIcon className="h-3 w-3" />
      ) : qualityLevel === 'excellent' ? (
        <CheckCircleIcon className="h-3 w-3" />
      ) : null}
      {config.label} Quality
    </span>
  );
}

// Icons
function WarningIcon({ className }: { className?: string }) {
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
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default QualityWarning;
