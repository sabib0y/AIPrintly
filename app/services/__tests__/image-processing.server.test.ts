/**
 * Image Processing Service Tests
 *
 * Tests for Sharp-based image processing including resize, format conversion,
 * quality validation, and metadata extraction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock sharp module
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({
      width: 2000,
      height: 1500,
      format: 'jpeg',
      density: 300,
      size: 1024000,
    }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image')),
    toFormat: vi.fn().mockReturnThis(),
  }))

  return {
    default: mockSharp,
  }
})

describe('Image Processing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getImageMetadata', () => {
    it('should extract metadata from an image buffer', async () => {
      const { getImageMetadata } = await import('../image-processing.server')

      const buffer = Buffer.from('fake image data')
      const metadata = await getImageMetadata(buffer)

      expect(metadata).toEqual({
        width: 2000,
        height: 1500,
        format: 'jpeg',
        dpi: 300,
        sizeBytes: 1024000,
      })
    })

    it('should default DPI to 72 if not present', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 1000,
          height: 800,
          format: 'png',
          density: undefined,
          size: 500000,
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { getImageMetadata } = await import('../image-processing.server')

      const buffer = Buffer.from('fake image data')
      const metadata = await getImageMetadata(buffer)

      expect(metadata.dpi).toBe(72)
    })
  })

  describe('validateImageQuality', () => {
    it('should pass validation for high-quality images', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
          density: 300,
          size: 1024000,
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { validateImageQuality } = await import('../image-processing.server')

      const buffer = Buffer.from('high quality image')
      const result = await validateImageQuality(buffer)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn about low DPI images', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
          density: 72,
          size: 1024000,
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { validateImageQuality } = await import('../image-processing.server')

      const buffer = Buffer.from('low dpi image')
      const result = await validateImageQuality(buffer)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(
        expect.stringContaining('low resolution')
      )
    })

    it('should fail validation for images below minimum dimensions', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 200,
          height: 150,
          format: 'jpeg',
          density: 300,
          size: 10000,
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { validateImageQuality } = await import('../image-processing.server')

      const buffer = Buffer.from('tiny image')
      const result = await validateImageQuality(buffer, {
        minWidth: 500,
        minHeight: 500,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        expect.stringContaining('minimum width')
      )
    })

    it('should fail validation for oversized files', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 5000,
          height: 4000,
          format: 'jpeg',
          density: 300,
          size: 50 * 1024 * 1024, // 50MB
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { validateImageQuality } = await import('../image-processing.server')

      const buffer = Buffer.from('huge image')
      const result = await validateImageQuality(buffer, {
        maxFileSize: 20 * 1024 * 1024, // 20MB limit
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        expect.stringContaining('exceeds maximum')
      )
    })
  })

  describe('resizeImage', () => {
    it('should resize image to specified dimensions', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized image')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { resizeImage } = await import('../image-processing.server')

      const buffer = Buffer.from('original image')
      const result = await resizeImage(buffer, { width: 800, height: 600 })

      expect(result).toBeInstanceOf(Buffer)
      expect(sharp).toHaveBeenCalledWith(buffer)
    })

    it('should maintain aspect ratio when fit is "inside"', async () => {
      const sharp = (await import('sharp')).default
      const mockResize = vi.fn().mockReturnThis()
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
        }),
        resize: mockResize,
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { resizeImage } = await import('../image-processing.server')

      await resizeImage(Buffer.from('test'), {
        width: 800,
        height: 600,
        fit: 'inside',
      })

      expect(mockResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 800,
          height: 600,
          fit: 'inside',
        })
      )
    })
  })

  describe('convertImageFormat', () => {
    it('should convert image to JPEG format', async () => {
      const sharp = (await import('sharp')).default
      const mockJpeg = vi.fn().mockReturnThis()
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({ format: 'png' }),
        resize: vi.fn().mockReturnThis(),
        jpeg: mockJpeg,
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('jpeg image')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { convertImageFormat } = await import('../image-processing.server')

      const buffer = Buffer.from('png image')
      const result = await convertImageFormat(buffer, 'jpeg', { quality: 85 })

      expect(result).toBeInstanceOf(Buffer)
      expect(mockJpeg).toHaveBeenCalledWith({ quality: 85 })
    })

    it('should convert image to WebP format', async () => {
      const sharp = (await import('sharp')).default
      const mockWebp = vi.fn().mockReturnThis()
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({ format: 'jpeg' }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: mockWebp,
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('webp image')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { convertImageFormat } = await import('../image-processing.server')

      const buffer = Buffer.from('jpeg image')
      const result = await convertImageFormat(buffer, 'webp', { quality: 80 })

      expect(result).toBeInstanceOf(Buffer)
      expect(mockWebp).toHaveBeenCalledWith({ quality: 80 })
    })

    it('should convert image to PNG format', async () => {
      const sharp = (await import('sharp')).default
      const mockPng = vi.fn().mockReturnThis()
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({ format: 'jpeg' }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: mockPng,
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('png image')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { convertImageFormat } = await import('../image-processing.server')

      const buffer = Buffer.from('jpeg image')
      await convertImageFormat(buffer, 'png')

      expect(mockPng).toHaveBeenCalled()
    })
  })

  describe('processUploadedImage', () => {
    it('should process and optimise an uploaded image', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 4000,
          height: 3000,
          format: 'jpeg',
          density: 300,
          size: 5000000,
        }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { processUploadedImage } = await import('../image-processing.server')

      const buffer = Buffer.from('original uploaded image')
      const result = await processUploadedImage(buffer)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.width).toBeDefined()
      expect(result.metadata.height).toBeDefined()
    })

    it('should respect maximum dimension constraints', async () => {
      const sharp = (await import('sharp')).default
      const mockResize = vi.fn().mockReturnThis()
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          width: 8000,
          height: 6000,
          format: 'jpeg',
          density: 300,
          size: 20000000,
        }),
        resize: mockResize,
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { processUploadedImage } = await import('../image-processing.server')

      await processUploadedImage(Buffer.from('huge image'), {
        maxWidth: 4096,
        maxHeight: 4096,
      })

      expect(mockResize).toHaveBeenCalled()
    })
  })

  describe('generateThumbnail', () => {
    it('should generate a thumbnail image', async () => {
      const sharp = (await import('sharp')).default
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({ format: 'jpeg' }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('thumbnail')),
        toFormat: vi.fn().mockReturnThis(),
      } as any)

      const { generateThumbnail } = await import('../image-processing.server')

      const buffer = Buffer.from('original image')
      const result = await generateThumbnail(buffer, { width: 200, height: 200 })

      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('calculatePrintDimensions', () => {
    it('should calculate print dimensions in inches', async () => {
      const { calculatePrintDimensions } = await import(
        '../image-processing.server'
      )

      const dimensions = calculatePrintDimensions(3000, 2000, 300)

      expect(dimensions.widthInches).toBe(10)
      expect(dimensions.heightInches).toBeCloseTo(6.67, 1)
    })

    it('should provide quality recommendation based on print size', async () => {
      const { calculatePrintDimensions } = await import(
        '../image-processing.server'
      )

      // High quality: 300 DPI
      const highQuality = calculatePrintDimensions(3000, 2000, 300)
      expect(highQuality.quality).toBe('high')

      // Medium quality: 150 DPI
      const medQuality = calculatePrintDimensions(1500, 1000, 300)
      expect(medQuality.quality).toBe('medium')
    })
  })
})
