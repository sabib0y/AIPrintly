/**
 * Print Quality Generation Service
 *
 * Handles generation of high-resolution print-quality versions
 * after payment has been confirmed. This is used during order fulfilment.
 */

import {
  getPrimaryProvider,
  getFallbackProvider,
  PRINT_RESOLUTION,
  type ImageGenerationRequest,
  type ImageGenerationResult,
} from '~/services/ai'
import { prisma } from '~/services/prisma.server'
import {
  uploadFile,
  generateStorageKey,
  calculateRetentionExpiry,
} from '~/services/storage.server'

/**
 * Download image from URL to buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate print-quality version of a preview asset
 *
 * This function is called during order processing after payment confirmation.
 * It takes an existing preview-quality asset and generates a high-resolution
 * print-quality version using the same prompt and parameters.
 *
 * @param assetId - ID of the preview asset to upgrade
 * @param userId - User ID (must be authenticated for print quality)
 * @returns Print-quality asset record
 */
export async function generatePrintQuality(
  assetId: string,
  userId: string
): Promise<{
  success: boolean
  asset?: {
    id: string
    storageUrl: string
    width: number
    height: number
  }
  error?: string
}> {
  try {
    // Fetch the original asset
    const originalAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!originalAsset) {
      return {
        success: false,
        error: 'Original asset not found',
      }
    }

    // Verify the asset belongs to the user
    if (originalAsset.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorised: asset does not belong to user',
      }
    }

    // Check if already print quality
    const metadata = originalAsset.metadata as Record<string, unknown>
    if (metadata.isPrintQuality === true) {
      return {
        success: true,
        asset: {
          id: originalAsset.id,
          storageUrl: originalAsset.storageUrl,
          width: originalAsset.width,
          height: originalAsset.height,
        },
      }
    }

    // Extract generation parameters from metadata
    const prompt = metadata.prompt as string
    const style = metadata.style as string
    const negativePrompt = metadata.negativePrompt as string | undefined
    const seed = metadata.seed as number | undefined

    if (!prompt || !style) {
      return {
        success: false,
        error: 'Missing generation parameters in asset metadata',
      }
    }

    // Get AI provider
    const provider = getPrimaryProvider()
    if (!provider) {
      return {
        success: false,
        error: 'AI generation service unavailable',
      }
    }

    // Create job record for print-quality generation
    const job = await prisma.generationJob.create({
      data: {
        sessionId: originalAsset.sessionId,
        type: 'IMAGE',
        status: 'PENDING',
        provider: provider.name,
        inputParams: {
          prompt,
          style,
          width: PRINT_RESOLUTION,
          height: PRINT_RESOLUTION,
          negativePrompt,
          seed,
          isPrintQuality: true,
          originalAssetId: assetId,
        },
      },
    })

    // Update job to processing
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', startedAt: new Date() },
    })

    // Generate print-quality image
    const request: ImageGenerationRequest = {
      prompt,
      style,
      width: PRINT_RESOLUTION,
      height: PRINT_RESOLUTION,
      negativePrompt,
      seed,
    }

    let result = await provider.generateImage(request)

    // Try fallback if primary failed
    if (!result.success) {
      const fallback = getFallbackProvider(provider.name)
      if (fallback) {
        result = await fallback.generateImage(request)
      }
    }

    // Handle failure
    if (!result.success) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: result.error,
          completedAt: new Date(),
        },
      })

      return {
        success: false,
        error: result.error,
      }
    }

    // Download and store the generated image
    const imageBuffer = await downloadImage(result.imageUrl)

    const storageKey = generateStorageKey('image/png', 'generated')
    const uploadResult = await uploadFile({
      buffer: imageBuffer,
      key: storageKey,
      contentType: 'image/png',
      metadata: {
        jobId: job.id,
        prompt,
        style,
        provider: result.provider,
        resolution: String(PRINT_RESOLUTION),
        isPrintQuality: 'true',
        originalAssetId: assetId,
      },
    })

    // Calculate retention (permanent for paid assets)
    const expiresAt = calculateRetentionExpiry(true, 'generated')

    // Create print-quality asset record
    const printAsset = await prisma.asset.create({
      data: {
        sessionId: originalAsset.sessionId,
        userId,
        source: 'GENERATED',
        assetType: 'IMAGE',
        storageKey: uploadResult.key,
        storageUrl: uploadResult.url,
        mimeType: 'image/png',
        width: result.width,
        height: result.height,
        fileSize: uploadResult.size,
        metadata: {
          jobId: job.id,
          prompt,
          style,
          provider: result.provider,
          providerJobId: result.providerJobId,
          resolution: PRINT_RESOLUTION,
          isPrintQuality: 'true',
          originalAssetId: assetId,
        },
        status: 'TEMPORARY',
        storageTier: 'HOT',
        expiresAt,
        retentionDays: 365,
      },
    })

    // Update job as completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        providerJobId: result.providerJobId,
        output: {
          assetId: printAsset.id,
          imageUrl: printAsset.storageUrl,
          width: result.width,
          height: result.height,
          isPrintQuality: true,
        },
        completedAt: new Date(),
      },
    })

    return {
      success: true,
      asset: {
        id: printAsset.id,
        storageUrl: printAsset.storageUrl,
        width: printAsset.width,
        height: printAsset.height,
      },
    }
  } catch (error) {
    console.error('Print quality generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: `Print quality generation failed: ${errorMessage}`,
    }
  }
}

/**
 * Batch generate print-quality versions for multiple assets
 *
 * Useful for orders containing multiple generated images.
 *
 * @param assetIds - Array of asset IDs to upgrade
 * @param userId - User ID (must be authenticated)
 * @returns Results for each asset
 */
export async function batchGeneratePrintQuality(
  assetIds: string[],
  userId: string
): Promise<
  Array<{
    assetId: string
    success: boolean
    printAsset?: {
      id: string
      storageUrl: string
      width: number
      height: number
    }
    error?: string
  }>
> {
  const results = await Promise.allSettled(
    assetIds.map((assetId) => generatePrintQuality(assetId, userId))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        assetId: assetIds[index],
        success: result.value.success,
        printAsset: result.value.asset,
        error: result.value.error,
      }
    }

    return {
      assetId: assetIds[index],
      success: false,
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    }
  })
}
