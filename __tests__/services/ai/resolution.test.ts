/**
 * Resolution Configuration Tests
 *
 * Tests for low-resolution preview and print-quality generation.
 */

import { describe, it, expect } from 'vitest'
import {
  PREVIEW_RESOLUTION,
  PRINT_RESOLUTION,
  getResolutionDimensions,
  isPreviewResolution,
  isPrintResolution,
} from '~/services/ai/provider.interface'

describe('Resolution Configuration', () => {
  describe('Constants', () => {
    it('should define PREVIEW_RESOLUTION as 1024', () => {
      expect(PREVIEW_RESOLUTION).toBe(1024)
    })

    it('should define PRINT_RESOLUTION as 2048', () => {
      expect(PRINT_RESOLUTION).toBe(2048)
    })

    it('should have PRINT_RESOLUTION as 4x the area of PREVIEW_RESOLUTION', () => {
      const previewArea = PREVIEW_RESOLUTION * PREVIEW_RESOLUTION
      const printArea = PRINT_RESOLUTION * PRINT_RESOLUTION
      expect(printArea).toBe(previewArea * 4)
    })
  })

  describe('getResolutionDimensions', () => {
    it('should return preview dimensions for preview resolution', () => {
      const dims = getResolutionDimensions('preview')
      expect(dims).toEqual({ width: 1024, height: 1024 })
    })

    it('should return print dimensions for print resolution', () => {
      const dims = getResolutionDimensions('print')
      expect(dims).toEqual({ width: 2048, height: 2048 })
    })

    it('should return preview dimensions as default', () => {
      const dims = getResolutionDimensions()
      expect(dims).toEqual({ width: 1024, height: 1024 })
    })

    it('should support custom aspect ratios for preview', () => {
      const dims = getResolutionDimensions('preview', 16 / 9)
      expect(dims.width).toBeGreaterThan(dims.height)
      expect(Math.max(dims.width, dims.height)).toBe(1024)
    })

    it('should support custom aspect ratios for print', () => {
      const dims = getResolutionDimensions('print', 9 / 16)
      expect(dims.height).toBeGreaterThan(dims.width)
      expect(Math.max(dims.width, dims.height)).toBe(2048)
    })
  })

  describe('isPreviewResolution', () => {
    it('should return true for 1024x1024', () => {
      expect(isPreviewResolution(1024, 1024)).toBe(true)
    })

    it('should return false for 2048x2048', () => {
      expect(isPreviewResolution(2048, 2048)).toBe(false)
    })

    it('should return false for other dimensions', () => {
      expect(isPreviewResolution(512, 512)).toBe(false)
      expect(isPreviewResolution(1536, 1536)).toBe(false)
    })
  })

  describe('isPrintResolution', () => {
    it('should return true for 2048x2048', () => {
      expect(isPrintResolution(2048, 2048)).toBe(true)
    })

    it('should return false for 1024x1024', () => {
      expect(isPrintResolution(1024, 1024)).toBe(false)
    })

    it('should return false for other dimensions', () => {
      expect(isPrintResolution(512, 512)).toBe(false)
      expect(isPrintResolution(4096, 4096)).toBe(false)
    })
  })
})
