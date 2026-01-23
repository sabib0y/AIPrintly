/**
 * Print Quality Generation Simple Tests
 *
 * Simplified tests for print-quality generation functionality.
 */

import { describe, it, expect } from 'vitest'
import { PREVIEW_RESOLUTION, PRINT_RESOLUTION } from '~/services/ai/provider.interface'

describe('Print Quality Constants', () => {
  it('should have correct preview resolution', () => {
    expect(PREVIEW_RESOLUTION).toBe(1024)
  })

  it('should have correct print resolution', () => {
    expect(PRINT_RESOLUTION).toBe(2048)
  })

  it('should have print resolution 4x the area of preview', () => {
    const previewArea = PREVIEW_RESOLUTION * PREVIEW_RESOLUTION
    const printArea = PRINT_RESOLUTION * PRINT_RESOLUTION
    expect(printArea).toBe(previewArea * 4)
  })

  it('should export print-quality generation functions', async () => {
    const ai = await import('~/services/ai')
    expect(ai.generatePrintQuality).toBeDefined()
    expect(ai.batchGeneratePrintQuality).toBeDefined()
  })
})
