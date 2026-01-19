/**
 * Builder Types
 *
 * Type definitions for the product builder canvas and customisation system.
 */

/**
 * Position coordinates on the canvas
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Transform values for the design element
 */
export interface Transform {
  position: Position;
  scale: number;
  rotation: number;
}

/**
 * Print area dimensions and constraints
 */
export interface PrintArea {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Safe area offset from edges (pixels) */
  bleedMargin: number;
  /** Minimum DPI for acceptable quality */
  minDpi: number;
  /** Minimum required overlap percentage (0-1) */
  minOverlap: number;
}

/**
 * Product-specific print area configurations
 */
export const PRINT_AREAS: Record<string, PrintArea> = {
  mug: {
    width: 900,
    height: 380,
    bleedMargin: 20,
    minDpi: 150,
    minOverlap: 0.3,
  },
  apparel: {
    width: 1200,
    height: 1400,
    bleedMargin: 30,
    minDpi: 150,
    minOverlap: 0.5,
  },
  print: {
    width: 3508, // A4 at 300 DPI
    height: 4961,
    bleedMargin: 50,
    minDpi: 300,
    minOverlap: 0.9,
  },
  storybook: {
    width: 2400,
    height: 2400,
    bleedMargin: 75,
    minDpi: 300,
    minOverlap: 0.95,
  },
};

/**
 * Design element on the canvas
 */
export interface DesignElement {
  /** Unique identifier */
  id: string;
  /** Source image URL */
  imageUrl: string;
  /** Image dimensions */
  imageWidth: number;
  /** Image dimensions */
  imageHeight: number;
  /** Current transform */
  transform: Transform;
  /** Whether this is the active/selected element */
  isSelected: boolean;
}

/**
 * Quality assessment for the current design
 */
export interface QualityAssessment {
  /** Effective DPI at current scale */
  effectiveDpi: number;
  /** Whether DPI is acceptable */
  isDpiAcceptable: boolean;
  /** Percentage of print area covered */
  overlapPercentage: number;
  /** Whether overlap is acceptable */
  isOverlapAcceptable: boolean;
  /** Whether design is within bounds */
  isWithinBounds: boolean;
  /** Overall quality acceptable */
  isAcceptable: boolean;
  /** Warning messages */
  warnings: string[];
}

/**
 * Canvas state
 */
export interface CanvasState {
  /** Product type */
  productType: string;
  /** Print area configuration */
  printArea: PrintArea;
  /** Design elements on canvas */
  elements: DesignElement[];
  /** Currently selected element ID */
  selectedElementId: string | null;
  /** Zoom level */
  zoom: number;
  /** Canvas pan offset */
  panOffset: Position;
}

/**
 * Canvas interaction mode
 */
export type InteractionMode = 'select' | 'pan' | 'zoom';

/**
 * Touch gesture state for mobile
 */
export interface TouchState {
  /** Is currently touching */
  isTouching: boolean;
  /** Number of touch points */
  touchCount: number;
  /** Initial pinch distance */
  initialPinchDistance: number | null;
  /** Initial rotation angle */
  initialRotation: number | null;
  /** Initial scale */
  initialScale: number;
}

/**
 * Constraint settings for transforms
 */
export interface TransformConstraints {
  /** Minimum scale factor */
  minScale: number;
  /** Maximum scale factor */
  maxScale: number;
  /** Whether to snap to angles (every 15 degrees) */
  snapRotation: boolean;
  /** Whether to constrain within print area */
  constrainToBounds: boolean;
}

/**
 * Default transform constraints
 */
export const DEFAULT_CONSTRAINTS: TransformConstraints = {
  minScale: 0.1,
  maxScale: 5,
  snapRotation: false,
  constrainToBounds: false,
};

/**
 * Calculate effective DPI based on scale and original image size
 */
export function calculateEffectiveDpi(
  imageWidth: number,
  imageHeight: number,
  scale: number,
  printAreaWidth: number,
  printAreaHeight: number,
  printDpi: number
): number {
  // Calculate the size of the image on the print area at the current scale
  const scaledWidthOnCanvas = imageWidth * scale;
  const scaledHeightOnCanvas = imageHeight * scale;

  // Calculate what size this would be when printed
  const printWidthInches = (scaledWidthOnCanvas / printAreaWidth) * (printAreaWidth / printDpi);
  const printHeightInches = (scaledHeightOnCanvas / printAreaHeight) * (printAreaHeight / printDpi);

  // Calculate effective DPI
  const effectiveDpiX = imageWidth / printWidthInches;
  const effectiveDpiY = imageHeight / printHeightInches;

  // Return the lower of the two
  return Math.min(effectiveDpiX, effectiveDpiY);
}

/**
 * Calculate overlap percentage between design and print area
 */
export function calculateOverlapPercentage(
  element: DesignElement,
  printArea: PrintArea
): number {
  const { transform, imageWidth, imageHeight } = element;
  const { position, scale, rotation } = transform;

  // Simplified calculation (ignoring rotation for now)
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  // Element bounds
  const left = position.x - scaledWidth / 2;
  const right = position.x + scaledWidth / 2;
  const top = position.y - scaledHeight / 2;
  const bottom = position.y + scaledHeight / 2;

  // Print area bounds
  const areaLeft = 0;
  const areaRight = printArea.width;
  const areaTop = 0;
  const areaBottom = printArea.height;

  // Calculate overlap rectangle
  const overlapLeft = Math.max(left, areaLeft);
  const overlapRight = Math.min(right, areaRight);
  const overlapTop = Math.max(top, areaTop);
  const overlapBottom = Math.min(bottom, areaBottom);

  // No overlap if rectangles don't intersect
  if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
    return 0;
  }

  // Calculate overlap area as percentage of element
  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  const elementArea = scaledWidth * scaledHeight;

  return overlapArea / elementArea;
}

/**
 * Assess the quality of a design element
 */
export function assessQuality(
  element: DesignElement,
  printArea: PrintArea
): QualityAssessment {
  const warnings: string[] = [];

  // Calculate effective DPI
  const effectiveDpi = calculateEffectiveDpi(
    element.imageWidth,
    element.imageHeight,
    element.transform.scale,
    printArea.width,
    printArea.height,
    printArea.minDpi
  );

  const isDpiAcceptable = effectiveDpi >= printArea.minDpi;
  if (!isDpiAcceptable) {
    warnings.push(
      `Image quality may be low. Effective DPI: ${Math.round(effectiveDpi)} (recommended: ${printArea.minDpi}+)`
    );
  }

  // Calculate overlap
  const overlapPercentage = calculateOverlapPercentage(element, printArea);
  const isOverlapAcceptable = overlapPercentage >= printArea.minOverlap;
  if (!isOverlapAcceptable) {
    warnings.push(
      `Design should cover more of the print area (currently ${Math.round(overlapPercentage * 100)}%)`
    );
  }

  // Check bounds
  const { transform, imageWidth, imageHeight } = element;
  const scaledWidth = imageWidth * transform.scale;
  const scaledHeight = imageHeight * transform.scale;
  const left = transform.position.x - scaledWidth / 2;
  const right = transform.position.x + scaledWidth / 2;
  const top = transform.position.y - scaledHeight / 2;
  const bottom = transform.position.y + scaledHeight / 2;

  const isWithinBounds =
    left >= -printArea.bleedMargin &&
    right <= printArea.width + printArea.bleedMargin &&
    top >= -printArea.bleedMargin &&
    bottom <= printArea.height + printArea.bleedMargin;

  if (!isWithinBounds) {
    warnings.push('Design extends beyond the printable area');
  }

  return {
    effectiveDpi,
    isDpiAcceptable,
    overlapPercentage,
    isOverlapAcceptable,
    isWithinBounds,
    isAcceptable: isDpiAcceptable && isOverlapAcceptable,
    warnings,
  };
}
