/**
 * Tests for Storybook Preview Service
 *
 * Test coverage for free watermarked preview tracking and eligibility.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  hasUsedFreePreview,
  isEligibleForFreePreview,
  checkStorybookPreviewEligibility,
  getStorybookGenerationCount,
  isWatermarkedPreview,
  getWatermarkedPreviews,
} from '~/services/storybook-preview.server'
import { prisma } from '~/services/prisma.server'

describe('Storybook Preview Service', () => {
  let testSessionId: string
  const testSessionToken = 'test-session-preview'
  const testUserId = null

  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({
      where: { sessionToken: testSessionToken },
    })

    // Create test session
    const session = await prisma.session.create({
      data: {
        sessionToken: testSessionToken,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
      },
    })

    testSessionId = session.id
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.generationJob.deleteMany({
      where: { sessionId: testSessionId },
    })
    await prisma.asset.deleteMany({
      where: { sessionId: testSessionId },
    })
    await prisma.session.deleteMany({
      where: { id: testSessionId },
    })
  })

  describe('hasUsedFreePreview', () => {
    it('should return false when no story jobs exist', async () => {
      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(false)
    })

    it('should return true when a completed story job exists', async () => {
      // Create a completed story job
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'STORY',
          status: 'COMPLETED',
          provider: 'openai',
          inputParams: {},
          completedAt: new Date(),
        },
      })

      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(true)
    })

    it('should return false when story job is pending', async () => {
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'STORY',
          status: 'PENDING',
          provider: 'openai',
          inputParams: {},
        },
      })

      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(false)
    })

    it('should return false when story job failed', async () => {
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'STORY',
          status: 'FAILED',
          provider: 'openai',
          inputParams: {},
          errorMessage: 'Test error',
        },
      })

      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(false)
    })

    it('should ignore IMAGE type jobs', async () => {
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'IMAGE',
          status: 'COMPLETED',
          provider: 'replicate',
          inputParams: {},
          completedAt: new Date(),
        },
      })

      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(false)
    })

    it('should count multiple completed story jobs as used', async () => {
      // Create multiple completed story jobs
      await prisma.generationJob.createMany({
        data: [
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'COMPLETED',
            provider: 'openai',
            inputParams: {},
            completedAt: new Date(),
          },
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'COMPLETED',
            provider: 'openai',
            inputParams: {},
            completedAt: new Date(),
          },
        ],
      })

      const result = await hasUsedFreePreview(testSessionId, testUserId)

      expect(result).toBe(true)
    })
  })

  describe('isEligibleForFreePreview', () => {
    it('should return true when no previews used', async () => {
      const result = await isEligibleForFreePreview(testSessionId, testUserId)

      expect(result).toBe(true)
    })

    it('should return false when preview already used', async () => {
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'STORY',
          status: 'COMPLETED',
          provider: 'openai',
          inputParams: {},
          completedAt: new Date(),
        },
      })

      const result = await isEligibleForFreePreview(testSessionId, testUserId)

      expect(result).toBe(false)
    })
  })

  describe('checkStorybookPreviewEligibility', () => {
    it('should return free and watermarked for first generation', async () => {
      const result = await checkStorybookPreviewEligibility(testSessionId, testUserId)

      expect(result.isFree).toBe(true)
      expect(result.shouldWatermark).toBe(true)
      expect(result.reason).toContain('free')
      expect(result.reason).toContain('watermarked')
    })

    it('should return not free and not watermarked after first generation', async () => {
      await prisma.generationJob.create({
        data: {
          sessionId: testSessionId,
          type: 'STORY',
          status: 'COMPLETED',
          provider: 'openai',
          inputParams: {},
          completedAt: new Date(),
        },
      })

      const result = await checkStorybookPreviewEligibility(testSessionId, testUserId)

      expect(result.isFree).toBe(false)
      expect(result.shouldWatermark).toBe(false)
      expect(result.reason).toContain('credits')
    })
  })

  describe('getStorybookGenerationCount', () => {
    it('should return 0 for new session', async () => {
      const count = await getStorybookGenerationCount(testSessionId)

      expect(count).toBe(0)
    })

    it('should count completed story jobs', async () => {
      await prisma.generationJob.createMany({
        data: [
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'COMPLETED',
            provider: 'openai',
            inputParams: {},
            completedAt: new Date(),
          },
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'COMPLETED',
            provider: 'openai',
            inputParams: {},
            completedAt: new Date(),
          },
        ],
      })

      const count = await getStorybookGenerationCount(testSessionId)

      expect(count).toBe(2)
    })

    it('should not count pending or failed jobs', async () => {
      await prisma.generationJob.createMany({
        data: [
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'PENDING',
            provider: 'openai',
            inputParams: {},
          },
          {
            sessionId: testSessionId,
            type: 'STORY',
            status: 'FAILED',
            provider: 'openai',
            inputParams: {},
            errorMessage: 'Test',
          },
        ],
      })

      const count = await getStorybookGenerationCount(testSessionId)

      expect(count).toBe(0)
    })
  })

  describe('isWatermarkedPreview', () => {
    it('should return false for non-existent asset', async () => {
      const result = await isWatermarkedPreview('non-existent-id')

      expect(result).toBe(false)
    })

    it('should return true for watermarked asset', async () => {
      const asset = await prisma.asset.create({
        data: {
          sessionId: testSessionId,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'test-key',
          storageUrl: 'https://example.com/image.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {
            isWatermarked: true,
          },
        },
      })

      const result = await isWatermarkedPreview(asset.id)

      expect(result).toBe(true)
    })

    it('should return false for non-watermarked asset', async () => {
      const asset = await prisma.asset.create({
        data: {
          sessionId: testSessionId,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'test-key',
          storageUrl: 'https://example.com/image.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {
            isWatermarked: false,
          },
        },
      })

      const result = await isWatermarkedPreview(asset.id)

      expect(result).toBe(false)
    })

    it('should return false for asset without watermark metadata', async () => {
      const asset = await prisma.asset.create({
        data: {
          sessionId: testSessionId,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'test-key',
          storageUrl: 'https://example.com/image.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {},
        },
      })

      const result = await isWatermarkedPreview(asset.id)

      expect(result).toBe(false)
    })
  })

  describe('getWatermarkedPreviews', () => {
    it('should return empty array for session with no assets', async () => {
      const result = await getWatermarkedPreviews(testSessionId)

      expect(result).toEqual([])
    })

    it('should return watermarked asset IDs', async () => {
      const asset1 = await prisma.asset.create({
        data: {
          sessionId: testSessionId,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'test-key-1',
          storageUrl: 'https://example.com/image1.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {
            isWatermarked: true,
          },
        },
      })

      const asset2 = await prisma.asset.create({
        data: {
          sessionId: testSessionId,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'test-key-2',
          storageUrl: 'https://example.com/image2.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {
            isWatermarked: false,
          },
        },
      })

      const result = await getWatermarkedPreviews(testSessionId)

      expect(result).toContain(asset1.id)
      expect(result).not.toContain(asset2.id)
      expect(result.length).toBe(1)
    })

    it('should only return assets for the specific session', async () => {
      const otherSession = await prisma.session.create({
        data: {
          sessionToken: 'other-session',
          expiresAt: new Date(Date.now() + 86400000),
        },
      })

      await prisma.asset.create({
        data: {
          sessionId: otherSession.id,
          source: 'GENERATED',
          assetType: 'IMAGE',
          storageKey: 'other-key',
          storageUrl: 'https://example.com/other.png',
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          fileSize: 50000,
          metadata: {
            isWatermarked: true,
          },
        },
      })

      const result = await getWatermarkedPreviews(testSessionId)

      expect(result).toEqual([])

      // Clean up
      await prisma.asset.deleteMany({ where: { sessionId: otherSession.id } })
      await prisma.session.delete({ where: { id: otherSession.id } })
    })
  })
})
