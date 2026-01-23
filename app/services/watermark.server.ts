/**
 * Watermark Service
 *
 * Sharp-based watermarking for storybook preview images.
 * Adds semi-transparent diagonal watermark to prevent unauthorised use.
 */

import sharp from 'sharp'

/**
 * Watermark text displayed on preview images
 */
export const WATERMARK_TEXT = 'PREVIEW - AIPrintly'

/**
 * Watermark opacity (0-1, where 0.3 = 30%)
 */
export const WATERMARK_OPACITY = 0.3

/**
 * Font size calculation based on image dimensions
 */
function calculateFontSize(width: number, height: number): number {
  const baseSize = Math.min(width, height) / 15
  return Math.max(30, Math.min(baseSize, 80))
}

/**
 * Calculate spacing between diagonal watermark lines
 */
function calculateSpacing(width: number, height: number): number {
  const diagonal = Math.sqrt(width ** 2 + height ** 2)
  return diagonal / 4
}

/**
 * Create SVG watermark overlay
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns SVG markup as string
 */
export function createWatermarkOverlay(width: number, height: number): string {
  const fontSize = calculateFontSize(width, height)
  const spacing = calculateSpacing(width, height)

  // Calculate diagonal angle
  const angle = -45

  // Calculate how many repetitions we need to cover the diagonal
  const diagonal = Math.sqrt(width ** 2 + height ** 2)
  const repetitions = Math.ceil(diagonal / spacing) + 2

  // Generate repeated text elements along the diagonal
  // Use grey colour that works on both light and dark backgrounds
  const textElements = []
  for (let i = -1; i < repetitions; i++) {
    const y = i * spacing

    // Add shadow text first (darker)
    textElements.push(
      `<text
        x="${width / 2}"
        y="${y}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="rgba(0,0,0,0.4)"
        text-anchor="middle"
        opacity="${WATERMARK_OPACITY}"
      >${WATERMARK_TEXT}</text>`
    )

    // Add main text (lighter, slightly offset)
    textElements.push(
      `<text
        x="${width / 2 - 2}"
        y="${y - 2}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="rgba(255,255,255,0.9)"
        text-anchor="middle"
        opacity="${WATERMARK_OPACITY}"
      >${WATERMARK_TEXT}</text>`
    )
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g transform="rotate(${angle} ${width / 2} ${height / 2})">
        ${textElements.join('\n')}
      </g>
    </svg>
  `
}

/**
 * Add watermark overlay to an image
 *
 * @param imageBuffer - Original image buffer
 * @returns Watermarked image buffer (PNG format)
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image: missing dimensions')
  }

  const { width, height } = metadata

  // Create watermark SVG overlay
  const watermarkSvg = createWatermarkOverlay(width, height)
  const watermarkBuffer = Buffer.from(watermarkSvg)

  // Composite watermark onto image
  const watermarked = await sharp(imageBuffer)
    .composite([
      {
        input: watermarkBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png() // Always output as PNG to preserve transparency
    .toBuffer()

  return watermarked
}

/**
 * Check if asset metadata indicates watermarking
 *
 * @param metadata - Asset metadata (Prisma JSON)
 * @returns True if marked as watermarked
 */
export function isWatermarked(
  metadata: unknown
): metadata is { isWatermarked: true } {
  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  const meta = metadata as Record<string, unknown>
  return meta.isWatermarked === true
}

/**
 * Create watermarked asset metadata
 *
 * @param originalMetadata - Existing metadata to merge
 * @returns Metadata with watermark flag
 */
export function createWatermarkedMetadata(
  originalMetadata?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(originalMetadata || {}),
    isWatermarked: true,
    watermarkedAt: new Date().toISOString(),
  }
}

/**
 * Remove watermark flag from metadata
 *
 * @param metadata - Asset metadata
 * @returns Clean metadata without watermark flags
 */
export function removeWatermarkMetadata(
  metadata: unknown
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const meta = { ...(metadata as Record<string, unknown>) }
  delete meta.isWatermarked
  delete meta.watermarkedAt

  return meta
}
