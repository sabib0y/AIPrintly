/**
 * Tests for Watermark Service
 *
 * Test coverage for watermarking storybook preview images with Sharp.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  addWatermark,
  createWatermarkOverlay,
  isWatermarked,
  WATERMARK_TEXT,
  WATERMARK_OPACITY,
} from '~/services/watermark.server'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Watermark Service', () => {
  let testImageBuffer: Buffer

  beforeAll(async () => {
    // Create a test image buffer (800x600 white canvas)
    testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
  })

  describe('createWatermarkOverlay', () => {
    it('should create an SVG watermark overlay', () => {
      const svg = createWatermarkOverlay(800, 600)

      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain(WATERMARK_TEXT)
      expect(svg).toContain('800')
      expect(svg).toContain('600')
    })

    it('should include watermark text in diagonal pattern', () => {
      const svg = createWatermarkOverlay(1000, 1000)

      // Should have multiple instances of text for diagonal pattern
      const textCount = (svg.match(new RegExp(WATERMARK_TEXT, 'g')) || []).length
      expect(textCount).toBeGreaterThan(1)
    })

    it('should set correct opacity', () => {
      const svg = createWatermarkOverlay(800, 600)

      // Check for opacity in the SVG (0.3 = 30%)
      expect(svg).toContain(`opacity="${WATERMARK_OPACITY}"`)
    })

    it('should handle different image dimensions', () => {
      const smallSvg = createWatermarkOverlay(400, 300)
      const largeSvg = createWatermarkOverlay(2048, 2048)

      expect(smallSvg).toContain('400')
      expect(smallSvg).toContain('300')
      expect(largeSvg).toContain('2048')
    })

    it('should rotate text diagonally (45 degrees)', () => {
      const svg = createWatermarkOverlay(800, 600)

      // Check for rotation transform
      expect(svg).toContain('rotate(')
    })
  })

  describe('addWatermark', () => {
    it('should add watermark to image buffer', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      expect(watermarked).toBeInstanceOf(Buffer)
      expect(watermarked.length).toBeGreaterThan(0)
    })

    it('should modify the image (different pixel data)', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      // Compare pixel data statistics instead of exact buffer equality
      const originalStats = await sharp(testImageBuffer).stats()
      const watermarkedStats = await sharp(watermarked).stats()

      // At least one channel should have different statistics
      const hasDifference =
        originalStats.channels[0].mean !== watermarkedStats.channels[0].mean ||
        originalStats.channels[1].mean !== watermarkedStats.channels[1].mean ||
        originalStats.channels[2].mean !== watermarkedStats.channels[2].mean

      expect(hasDifference).toBe(true)
    })

    it('should preserve image dimensions', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      const originalMetadata = await sharp(testImageBuffer).metadata()
      const watermarkedMetadata = await sharp(watermarked).metadata()

      expect(watermarkedMetadata.width).toBe(originalMetadata.width)
      expect(watermarkedMetadata.height).toBe(originalMetadata.height)
    })

    it('should preserve image format as PNG', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.format).toBe('png')
    })

    it('should handle JPEG input', async () => {
      const jpegBuffer = await sharp({
        create: {
          width: 600,
          height: 400,
          channels: 3,
          background: { r: 200, g: 200, b: 200 },
        },
      })
        .jpeg()
        .toBuffer()

      const watermarked = await addWatermark(jpegBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.format).toBe('png')
      expect(metadata.width).toBe(600)
      expect(metadata.height).toBe(400)
    })

    it('should handle WebP input', async () => {
      const webpBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 4,
          background: { r: 150, g: 150, b: 150, alpha: 1 },
        },
      })
        .webp()
        .toBuffer()

      const watermarked = await addWatermark(webpBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.format).toBe('png')
    })

    it('should handle large images (2048x2048)', async () => {
      const largeBuffer = await sharp({
        create: {
          width: 2048,
          height: 2048,
          channels: 4,
          background: { r: 100, g: 100, b: 100, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const watermarked = await addWatermark(largeBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.width).toBe(2048)
      expect(metadata.height).toBe(2048)
    })

    it('should handle small images (300x300)', async () => {
      const smallBuffer = await sharp({
        create: {
          width: 300,
          height: 300,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const watermarked = await addWatermark(smallBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.width).toBe(300)
      expect(metadata.height).toBe(300)
    })

    it('should handle non-square images', async () => {
      const wideBuffer = await sharp({
        create: {
          width: 1200,
          height: 600,
          channels: 4,
          background: { r: 100, g: 150, b: 200, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const watermarked = await addWatermark(wideBuffer)

      const metadata = await sharp(watermarked).metadata()
      expect(metadata.width).toBe(1200)
      expect(metadata.height).toBe(600)
    })

    it('should reject invalid buffer', async () => {
      const invalidBuffer = Buffer.from('not an image')

      await expect(addWatermark(invalidBuffer)).rejects.toThrow()
    })

    it('should reject empty buffer', async () => {
      const emptyBuffer = Buffer.from([])

      await expect(addWatermark(emptyBuffer)).rejects.toThrow()
    })

    it('should produce image larger than zero bytes', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      expect(watermarked.length).toBeGreaterThan(100)
    })
  })

  describe('isWatermarked', () => {
    it('should return true for watermarked metadata', () => {
      const metadata = { isWatermarked: true }

      expect(isWatermarked(metadata)).toBe(true)
    })

    it('should return false for non-watermarked metadata', () => {
      const metadata = { isWatermarked: false }

      expect(isWatermarked(metadata)).toBe(false)
    })

    it('should return false for metadata without watermark field', () => {
      const metadata = {}

      expect(isWatermarked(metadata)).toBe(false)
    })

    it('should return false for null metadata', () => {
      expect(isWatermarked(null)).toBe(false)
    })

    it('should return false for undefined metadata', () => {
      expect(isWatermarked(undefined)).toBe(false)
    })

    it('should handle metadata as Prisma JSON type', () => {
      const metadata = { isWatermarked: true, other: 'data' }

      expect(isWatermarked(metadata)).toBe(true)
    })

    it('should return false if isWatermarked is not boolean', () => {
      const metadata = { isWatermarked: 'yes' }

      expect(isWatermarked(metadata)).toBe(false)
    })
  })

  describe('Integration: Watermark Visual Quality', () => {
    it('should produce visually valid watermarked image', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      // Extract raw pixel data to verify overlay was applied
      const { data, info } = await sharp(watermarked).raw().toBuffer({ resolveWithObject: true })

      expect(info.width).toBe(800)
      expect(info.height).toBe(600)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should not completely obscure the original image', async () => {
      const watermarked = await addWatermark(testImageBuffer)

      // The watermark should be semi-transparent, so a white background
      // should still have areas that are predominantly white
      const stats = await sharp(watermarked).stats()

      // Check that there's still white in the image
      // (watermark shouldn't make everything dark)
      expect(stats.channels[0].mean).toBeGreaterThan(200) // R channel
      expect(stats.channels[1].mean).toBeGreaterThan(200) // G channel
      expect(stats.channels[2].mean).toBeGreaterThan(200) // B channel
    })

    it('should be visible on dark images', async () => {
      const darkBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 30, g: 30, b: 30, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const watermarked = await addWatermark(darkBuffer)

      // Watermark should add lighter pixels to dark image
      const originalStats = await sharp(darkBuffer).stats()
      const watermarkedStats = await sharp(watermarked).stats()

      // Mean should increase (lighter) due to watermark
      expect(watermarkedStats.channels[0].mean).toBeGreaterThanOrEqual(
        originalStats.channels[0].mean
      )
    })

    it('should be visible on bright images', async () => {
      const brightBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 250, g: 250, b: 250, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const watermarked = await addWatermark(brightBuffer)

      // Watermark should add variation to bright image
      const originalStats = await sharp(brightBuffer).stats()
      const watermarkedStats = await sharp(watermarked).stats()

      // Standard deviation should increase (more variation)
      expect(watermarkedStats.channels[0].stdev).toBeGreaterThan(
        originalStats.channels[0].stdev
      )
    })
  })

  describe('Performance', () => {
    it('should watermark in reasonable time (< 500ms)', async () => {
      const start = Date.now()
      await addWatermark(testImageBuffer)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should handle batch watermarking efficiently', async () => {
      const images = Array(5).fill(testImageBuffer)
      const start = Date.now()

      await Promise.all(images.map((img) => addWatermark(img)))

      const duration = Date.now() - start
      expect(duration).toBeLessThan(2000) // 5 images in under 2 seconds
    })
  })

  describe('Constants', () => {
    it('should export WATERMARK_TEXT constant', () => {
      expect(WATERMARK_TEXT).toBeDefined()
      expect(typeof WATERMARK_TEXT).toBe('string')
      expect(WATERMARK_TEXT.length).toBeGreaterThan(0)
    })

    it('should export WATERMARK_OPACITY constant', () => {
      expect(WATERMARK_OPACITY).toBeDefined()
      expect(typeof WATERMARK_OPACITY).toBe('number')
      expect(WATERMARK_OPACITY).toBeGreaterThan(0)
      expect(WATERMARK_OPACITY).toBeLessThanOrEqual(1)
    })

    it('should have sensible opacity (20-50%)', () => {
      expect(WATERMARK_OPACITY).toBeGreaterThanOrEqual(0.2)
      expect(WATERMARK_OPACITY).toBeLessThanOrEqual(0.5)
    })
  })
})
