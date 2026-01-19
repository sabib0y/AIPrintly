/**
 * TransformControls Component
 *
 * UI controls for transforming design elements (scale, rotation, position).
 * Provides slider inputs and numeric displays for precise adjustments.
 */

import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { Transform, TransformConstraints, DEFAULT_CONSTRAINTS } from './types';

export interface TransformControlsProps {
  /** Current transform values */
  transform: Transform;
  /** Callback when transform changes */
  onTransformChange: (transform: Transform) => void;
  /** Transform constraints */
  constraints?: TransformConstraints;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Show position controls */
  showPosition?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default constraints
 */
const defaultConstraints: TransformConstraints = {
  minScale: 0.1,
  maxScale: 5,
  snapRotation: false,
  constrainToBounds: false,
};

/**
 * TransformControls provides precise control over design element transforms.
 *
 * Features:
 * - Scale slider with percentage display
 * - Rotation slider with degree display
 * - Position inputs for X and Y
 * - Reset button
 *
 * @example
 * ```tsx
 * <TransformControls
 *   transform={element.transform}
 *   onTransformChange={(transform) => updateElement({ ...element, transform })}
 * />
 * ```
 */
export function TransformControls({
  transform,
  onTransformChange,
  constraints = defaultConstraints,
  disabled = false,
  showPosition = false,
  className,
}: TransformControlsProps) {
  const { position, scale, rotation } = transform;

  // Handle scale change
  const handleScaleChange = (newScale: number) => {
    const clampedScale = Math.min(
      Math.max(newScale, constraints.minScale),
      constraints.maxScale
    );
    onTransformChange({ ...transform, scale: clampedScale });
  };

  // Handle rotation change
  const handleRotationChange = (newRotation: number) => {
    let finalRotation = newRotation;

    // Snap to 15-degree increments if enabled
    if (constraints.snapRotation) {
      finalRotation = Math.round(newRotation / 15) * 15;
    }

    // Normalise to 0-360 range
    while (finalRotation < 0) finalRotation += 360;
    while (finalRotation >= 360) finalRotation -= 360;

    onTransformChange({ ...transform, rotation: finalRotation });
  };

  // Handle position change
  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    onTransformChange({
      ...transform,
      position: { ...position, [axis]: value },
    });
  };

  // Reset transforms
  const handleReset = () => {
    onTransformChange({
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    });
  };

  // Quick rotation buttons
  const handleQuickRotate = (degrees: number) => {
    handleRotationChange(rotation + degrees);
  };

  // Flip horizontal (by rotating 180 degrees - visual only)
  const handleFlipHorizontal = () => {
    handleRotationChange(rotation + 180);
  };

  return (
    <div
      data-testid="transform-controls"
      className={cn('space-y-6', className)}
    >
      {/* Scale Control */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="scale-slider" className="text-sm font-medium">
            Scale
          </Label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            id="scale-slider"
            type="range"
            min={constraints.minScale * 100}
            max={constraints.maxScale * 100}
            value={scale * 100}
            onChange={(e) => handleScaleChange(parseInt(e.target.value, 10) / 100)}
            disabled={disabled}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-sky-600 dark:bg-gray-700"
          />
          <Input
            type="number"
            value={Math.round(scale * 100)}
            onChange={(e) => handleScaleChange(parseInt(e.target.value, 10) / 100)}
            disabled={disabled}
            className="w-20"
            min={constraints.minScale * 100}
            max={constraints.maxScale * 100}
          />
        </div>
      </div>

      {/* Rotation Control */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="rotation-slider" className="text-sm font-medium">
            Rotation
          </Label>
          <span className="text-sm text-gray-500 dark:text-gray-400">{rotation}°</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            id="rotation-slider"
            type="range"
            min={0}
            max={360}
            value={rotation}
            onChange={(e) => handleRotationChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-sky-600 dark:bg-gray-700"
          />
          <Input
            type="number"
            value={rotation}
            onChange={(e) => handleRotationChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-20"
            min={0}
            max={360}
          />
        </div>

        {/* Quick Rotation Buttons */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickRotate(-90)}
            disabled={disabled}
            aria-label="Rotate 90° anticlockwise"
          >
            <RotateLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickRotate(90)}
            disabled={disabled}
            aria-label="Rotate 90° clockwise"
          >
            <RotateRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickRotate(180)}
            disabled={disabled}
            aria-label="Rotate 180°"
          >
            180°
          </Button>
        </div>
      </div>

      {/* Position Controls (optional) */}
      {showPosition && (
        <div>
          <Label className="mb-2 block text-sm font-medium">Position</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position-x" className="mb-1 block text-xs text-gray-500">
                X
              </Label>
              <Input
                id="position-x"
                type="number"
                value={Math.round(position.x)}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value, 10))}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="position-y" className="mb-1 block text-xs text-gray-500">
                Y
              </Label>
              <Input
                id="position-y"
                type="number"
                value={Math.round(position.y)}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value, 10))}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={disabled}
        className="w-full"
      >
        <ResetIcon className="mr-2 h-4 w-4" />
        Reset Transform
      </Button>
    </div>
  );
}

// Icons
function RotateLeftIcon({ className }: { className?: string }) {
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
        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
      />
    </svg>
  );
}

function RotateRightIcon({ className }: { className?: string }) {
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
        d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
      />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
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

export default TransformControls;
