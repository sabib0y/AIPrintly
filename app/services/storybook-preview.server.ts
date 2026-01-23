/**
 * Storybook Preview Service
 *
 * Manages free watermarked storybook previews and preview tracking.
 * Users get 1 free watermarked storybook generation before needing credits.
 */

import { prisma } from './prisma.server'

/**
 * Check if user has used their free storybook preview
 *
 * @param sessionId - Session ID
 * @param userId - User ID (optional)
 * @returns True if user has already used their free preview
 */
export async function hasUsedFreePreview(
  sessionId: string,
  userId: string | null
): Promise<boolean> {
  // Count completed STORY generation jobs for this session/user
  const completedStoryJobs = await prisma.generationJob.count({
    where: {
      sessionId,
      type: 'STORY',
      status: 'COMPLETED',
    },
  })

  return completedStoryJobs > 0
}

/**
 * Check if user is eligible for free watermarked preview
 *
 * @param sessionId - Session ID
 * @param userId - User ID (optional)
 * @returns True if eligible for free preview
 */
export async function isEligibleForFreePreview(
  sessionId: string,
  userId: string | null
): Promise<boolean> {
  const used = await hasUsedFreePreview(sessionId, userId)
  return !used
}

/**
 * Result of preview eligibility check
 */
export interface PreviewEligibilityResult {
  /** Whether generation should be free */
  isFree: boolean
  /** Whether preview should be watermarked */
  shouldWatermark: boolean
  /** Reason for the decision */
  reason: string
}

/**
 * Determine if storybook generation should be free and watermarked
 *
 * Logic:
 * - First storybook generation is FREE but WATERMARKED
 * - Subsequent generations require credits and are NOT watermarked
 *
 * @param sessionId - Session ID
 * @param userId - User ID (optional)
 * @returns Eligibility result
 */
export async function checkStorybookPreviewEligibility(
  sessionId: string,
  userId: string | null
): Promise<PreviewEligibilityResult> {
  const eligible = await isEligibleForFreePreview(sessionId, userId)

  if (eligible) {
    return {
      isFree: true,
      shouldWatermark: true,
      reason: 'First storybook preview is free but watermarked',
    }
  }

  return {
    isFree: false,
    shouldWatermark: false,
    reason: 'Free preview already used. Subsequent generations require credits.',
  }
}

/**
 * Count total storybook generations for a session
 *
 * @param sessionId - Session ID
 * @returns Number of completed storybook generations
 */
export async function getStorybookGenerationCount(
  sessionId: string
): Promise<number> {
  return prisma.generationJob.count({
    where: {
      sessionId,
      type: 'STORY',
      status: 'COMPLETED',
    },
  })
}

/**
 * Check if asset is a watermarked preview
 *
 * @param assetId - Asset ID
 * @returns True if asset is watermarked
 */
export async function isWatermarkedPreview(assetId: string): Promise<boolean> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { metadata: true },
  })

  if (!asset) {
    return false
  }

  const metadata = asset.metadata as Record<string, unknown>
  return metadata.isWatermarked === true
}

/**
 * Get list of watermarked preview assets for a session
 *
 * @param sessionId - Session ID
 * @returns Array of watermarked asset IDs
 */
export async function getWatermarkedPreviews(
  sessionId: string
): Promise<string[]> {
  const assets = await prisma.asset.findMany({
    where: {
      sessionId,
      source: 'GENERATED',
      assetType: 'IMAGE',
    },
    select: { id: true, metadata: true },
  })

  return assets
    .filter((asset) => {
      const metadata = asset.metadata as Record<string, unknown>
      return metadata.isWatermarked === true
    })
    .map((asset) => asset.id)
}
