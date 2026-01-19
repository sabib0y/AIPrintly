/**
 * Image Processing Service
 *
 * Sharp-based image processing for uploads, including resize, format conversion,
 * quality validation, and metadata extraction.
 */

import sharp from 'sharp'

/**
 * Supported output image formats
 */
export type OutputFormat = 'jpeg' | 'png' | 'webp'

/**
 * Image metadata extracted from processed images
 */
export interface ImageMetadata {
  width: number
  height: number
  format: string
  dpi: number
  sizeBytes: number
}

/**
 * Get metadata from an image buffer
 *
 * @param buffer - Image buffer to analyse
 * @returns Extracted image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata()

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    dpi: metadata.density || 72, // Default to screen resolution if not specified
    sizeBytes: metadata.size || buffer.length,
  }
}

/**
 * Image quality validation options
 */
export interface ValidationOptions {
  /** Minimum width in pixels (default: 300) */
  minWidth?: number
  /** Minimum height in pixels (default: 300) */
  minHeight?: number
  /** Maximum file size in bytes (default: 25MB) */
  maxFileSize?: number
  /** Minimum DPI for print quality (default: 150) */
  minDpi?: number
  /** Target print width in inches for DPI calculation */
  targetPrintWidth?: number
  /** Target print height in inches for DPI calculation */
  targetPrintHeight?: number
}

/**
 * Image quality validation result
 */
export interface ValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  metadata: ImageMetadata
}

/**
 * Default validation thresholds
 */
const DEFAULT_VALIDATION: Required<Omit<ValidationOptions, 'targetPrintWidth' | 'targetPrintHeight'>> = {
  minWidth: 300,
  minHeight: 300,
  maxFileSize: 25 * 1024 * 1024, // 25MB
  minDpi: 150,
}

/**
 * Validate image quality for print production
 *
 * @param buffer - Image buffer to validate
 * @param options - Validation options
 * @returns Validation result with warnings and errors
 */
export async function validateImageQuality(
  buffer: Buffer,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const opts = { ...DEFAULT_VALIDATION, ...options }
  const warnings: string[] = []
  const errors: string[] = []

  const metadata = await getImageMetadata(buffer)

  // Check minimum dimensions
  if (metadata.width < opts.minWidth) {
    errors.push(
      `Image width (${metadata.width}px) is below minimum width of ${opts.minWidth}px`
    )
  }

  if (metadata.height < opts.minHeight) {
    errors.push(
      `Image height (${metadata.height}px) is below minimum height of ${opts.minHeight}px`
    )
  }

  // Check file size
  if (metadata.sizeBytes > opts.maxFileSize) {
    const maxMB = Math.round(opts.maxFileSize / (1024 * 1024))
    const actualMB = Math.round(metadata.sizeBytes / (1024 * 1024))
    errors.push(
      `File size (${actualMB}MB) exceeds maximum allowed size of ${maxMB}MB`
    )
  }

  // Check DPI for print quality
  if (metadata.dpi < opts.minDpi) {
    warnings.push(
      `Image has low resolution (${metadata.dpi} DPI). For best print quality, use images with at least ${opts.minDpi} DPI`
    )
  }

  // Calculate effective DPI for target print size if specified
  if (opts.targetPrintWidth && opts.targetPrintHeight) {
    const effectiveDpiWidth = metadata.width / opts.targetPrintWidth
    const effectiveDpiHeight = metadata.height / opts.targetPrintHeight
    const effectiveDpi = Math.min(effectiveDpiWidth, effectiveDpiHeight)

    if (effectiveDpi < opts.minDpi) {
      warnings.push(
        `For a ${opts.targetPrintWidth}" x ${opts.targetPrintHeight}" print, ` +
        `this image will have an effective resolution of ${Math.round(effectiveDpi)} DPI. ` +
        `For best quality, we recommend at least ${opts.minDpi} DPI.`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    metadata,
  }
}

/**
 * Resize options
 */
export interface ResizeOptions {
  /** Target width in pixels */
  width: number
  /** Target height in pixels */
  height: number
  /** Fit mode: cover, contain, fill, inside, outside */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  /** Background colour for letterboxing (default: transparent/white) */
  background?: { r: number; g: number; b: number; alpha?: number }
  /** Whether to enlarge images smaller than the target */
  withoutEnlargement?: boolean
}

/**
 * Resize an image to specified dimensions
 *
 * @param buffer - Image buffer to resize
 * @param options - Resize options
 * @returns Resized image buffer
 */
export async function resizeImage(
  buffer: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  const { width, height, fit = 'inside', background, withoutEnlargement = true } = options

  let pipeline = sharp(buffer).resize({
    width,
    height,
    fit,
    withoutEnlargement,
    background: background || { r: 255, g: 255, b: 255, alpha: 0 },
  })

  return pipeline.toBuffer()
}

/**
 * Format conversion options
 */
export interface FormatOptions {
  /** Quality for lossy formats (1-100, default: 85) */
  quality?: number
  /** Enable progressive rendering for JPEG */
  progressive?: boolean
  /** Compression level for PNG (0-9, default: 6) */
  compressionLevel?: number
}

/**
 * Convert image to a different format
 *
 * @param buffer - Image buffer to convert
 * @param format - Target format (jpeg, png, webp)
 * @param options - Format-specific options
 * @returns Converted image buffer
 */
export async function convertImageFormat(
  buffer: Buffer,
  format: OutputFormat,
  options: FormatOptions = {}
): Promise<Buffer> {
  const { quality = 85, progressive = true, compressionLevel = 6 } = options
  const image = sharp(buffer)

  switch (format) {
    case 'jpeg':
      return image.jpeg({ quality, progressive }).toBuffer()
    case 'png':
      return image.png({ compressionLevel }).toBuffer()
    case 'webp':
      return image.webp({ quality }).toBuffer()
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Processing options for uploaded images
 */
export interface ProcessingOptions {
  /** Maximum width constraint */
  maxWidth?: number
  /** Maximum height constraint */
  maxHeight?: number
  /** Output format (defaults to original or jpeg) */
  outputFormat?: OutputFormat
  /** Quality for output (1-100) */
  quality?: number
  /** Whether to strip metadata */
  stripMetadata?: boolean
}

/**
 * Processed image result
 */
export interface ProcessedImage {
  buffer: Buffer
  metadata: ImageMetadata
  mimeType: string
}

/**
 * Default processing options
 */
const DEFAULT_PROCESSING: Required<ProcessingOptions> = {
  maxWidth: 4096,
  maxHeight: 4096,
  outputFormat: 'jpeg',
  quality: 85,
  stripMetadata: true,
}

/**
 * Process an uploaded image with optimisation
 *
 * @param buffer - Original image buffer
 * @param options - Processing options
 * @returns Processed image with metadata
 */
export async function processUploadedImage(
  buffer: Buffer,
  options: ProcessingOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_PROCESSING, ...options }

  // Get original metadata
  const originalMetadata = await getImageMetadata(buffer)

  let pipeline = sharp(buffer)

  // Resize if exceeds maximum dimensions
  if (
    originalMetadata.width > opts.maxWidth ||
    originalMetadata.height > opts.maxHeight
  ) {
    pipeline = pipeline.resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Strip metadata if requested
  if (opts.stripMetadata) {
    pipeline = pipeline.rotate() // Auto-rotate based on EXIF and strip orientation
  }

  // Convert to output format
  let outputBuffer: Buffer
  let mimeType: string

  switch (opts.outputFormat) {
    case 'jpeg':
      outputBuffer = await pipeline.jpeg({ quality: opts.quality }).toBuffer()
      mimeType = 'image/jpeg'
      break
    case 'png':
      outputBuffer = await pipeline.png().toBuffer()
      mimeType = 'image/png'
      break
    case 'webp':
      outputBuffer = await pipeline.webp({ quality: opts.quality }).toBuffer()
      mimeType = 'image/webp'
      break
    default:
      outputBuffer = await pipeline.jpeg({ quality: opts.quality }).toBuffer()
      mimeType = 'image/jpeg'
  }

  // Get final metadata
  const finalMetadata = await getImageMetadata(outputBuffer)

  return {
    buffer: outputBuffer,
    metadata: finalMetadata,
    mimeType,
  }
}

/**
 * Thumbnail options
 */
export interface ThumbnailOptions {
  /** Thumbnail width */
  width: number
  /** Thumbnail height */
  height: number
  /** Output format (default: webp) */
  format?: OutputFormat
  /** Quality (default: 80) */
  quality?: number
}

/**
 * Generate a thumbnail image
 *
 * @param buffer - Original image buffer
 * @param options - Thumbnail options
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(
  buffer: Buffer,
  options: ThumbnailOptions
): Promise<Buffer> {
  const { width, height, format = 'webp', quality = 80 } = options

  let pipeline = sharp(buffer).resize({
    width,
    height,
    fit: 'cover',
    position: 'centre', // British spelling
  })

  switch (format) {
    case 'jpeg':
      return pipeline.jpeg({ quality }).toBuffer()
    case 'png':
      return pipeline.png().toBuffer()
    case 'webp':
    default:
      return pipeline.webp({ quality }).toBuffer()
  }
}

/**
 * Print dimension calculation result
 */
export interface PrintDimensions {
  /** Width in inches */
  widthInches: number
  /** Height in inches */
  heightInches: number
  /** Effective DPI at this print size */
  effectiveDpi: number
  /** Quality assessment: high, medium, low */
  quality: 'high' | 'medium' | 'low'
}

/**
 * Calculate print dimensions from pixel dimensions
 *
 * @param widthPixels - Image width in pixels
 * @param heightPixels - Image height in pixels
 * @param targetDpi - Target DPI for printing (default: 300)
 * @returns Print dimensions and quality assessment
 */
export function calculatePrintDimensions(
  widthPixels: number,
  heightPixels: number,
  targetDpi: number = 300
): PrintDimensions {
  const widthInches = widthPixels / targetDpi
  const heightInches = heightPixels / targetDpi

  // Assess quality based on effective DPI
  let quality: 'high' | 'medium' | 'low'
  if (targetDpi >= 250) {
    quality = 'high'
  } else if (targetDpi >= 150) {
    quality = 'medium'
  } else {
    quality = 'low'
  }

  return {
    widthInches,
    heightInches,
    effectiveDpi: targetDpi,
    quality,
  }
}

/**
 * Calculate effective DPI for a given print size
 *
 * @param widthPixels - Image width in pixels
 * @param heightPixels - Image height in pixels
 * @param printWidthInches - Target print width
 * @param printHeightInches - Target print height
 * @returns Effective DPI and quality assessment
 */
export function calculateEffectiveDpi(
  widthPixels: number,
  heightPixels: number,
  printWidthInches: number,
  printHeightInches: number
): PrintDimensions {
  const dpiWidth = widthPixels / printWidthInches
  const dpiHeight = heightPixels / printHeightInches
  const effectiveDpi = Math.min(dpiWidth, dpiHeight)

  let quality: 'high' | 'medium' | 'low'
  if (effectiveDpi >= 250) {
    quality = 'high'
  } else if (effectiveDpi >= 150) {
    quality = 'medium'
  } else {
    quality = 'low'
  }

  return {
    widthInches: widthPixels / effectiveDpi,
    heightInches: heightPixels / effectiveDpi,
    effectiveDpi,
    quality,
  }
}

/**
 * Supported file types for upload
 */
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number]

/**
 * Check if a MIME type is supported
 *
 * @param mimeType - MIME type to check
 * @returns True if supported
 */
export function isSupportedMimeType(
  mimeType: string
): mimeType is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)
}

/**
 * Get file extension for a MIME type
 *
 * @param mimeType - MIME type
 * @returns File extension without dot
 */
export function getExtensionForMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }

  return extensions[mimeType] || 'bin'
}
