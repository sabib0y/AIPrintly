/**
 * Asset Upload API Endpoint
 *
 * POST /api/assets/upload - Upload an image file
 *
 * Handles file upload with validation, processing, storage, and database recording.
 * Implements the storage policy for retention tracking.
 */

import type { ActionFunctionArgs } from 'react-router'
import { prisma } from '~/services/prisma.server'
import { getSessionId, getUserIdFromSession } from '~/services/session.server'
import {
  uploadFile,
  generateStorageKey,
  calculateRetentionExpiry,
  getProxyUrl,
} from '~/services/storage.server'
import {
  processUploadedImage,
  validateImageQuality,
  isSupportedMimeType,
  SUPPORTED_MIME_TYPES,
} from '~/services/image-processing.server'
import { checkUploadRateLimit } from '~/services/rate-limiter.server'

/**
 * Maximum file size in bytes (25MB)
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024

/**
 * API response types
 */
interface UploadSuccessResponse {
  success: true
  asset: {
    id: string
    storageUrl: string
    width: number
    height: number
    mimeType: string
    fileSize: number
    expiresAt: string | null
  }
  warnings?: string[]
}

interface UploadErrorResponse {
  success: false
  error: string
  errors?: string[]
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse

/**
 * Create a JSON response with appropriate headers
 */
function jsonResponse(data: UploadResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Handle file upload
 *
 * POST /api/assets/upload
 * Content-Type: multipart/form-data
 *
 * Form fields:
 * - file: The image file to upload
 * - originalFilename (optional): Original filename if different from file name
 * - consentGiven (required): Boolean indicating user consent
 * - consentTimestamp (required): ISO timestamp of when consent was given
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed' },
      405
    )
  }

  try {
    // Get session information
    const sessionId = await getSessionId(request)
    if (!sessionId) {
      return jsonResponse(
        { success: false, error: 'Session required' },
        401
      )
    }

    const userId = await getUserIdFromSession(request)
    const isAuthenticated = !!userId

    // Check rate limits
    const rateLimitResult = await checkUploadRateLimit(sessionId, request)
    if (!rateLimitResult.allowed) {
      return jsonResponse(
        {
          success: false,
          error: `Too many uploads. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        },
        429
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')
    const consentGiven = formData.get('consentGiven')
    const consentTimestamp = formData.get('consentTimestamp')

    // Validate consent
    if (consentGiven !== 'true' || !consentTimestamp) {
      return jsonResponse(
        {
          success: false,
          error: 'User consent is required before uploading photos',
        },
        400
      )
    }

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return jsonResponse(
        { success: false, error: 'No file provided in request' },
        400
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
      return jsonResponse(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${maxMB}MB`,
        },
        400
      )
    }

    // Validate MIME type
    if (!isSupportedMimeType(file.type)) {
      return jsonResponse(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
        },
        400
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate image quality
    const validationResult = await validateImageQuality(buffer, {
      minWidth: 300,
      minHeight: 300,
      maxFileSize: MAX_FILE_SIZE,
      minDpi: 150,
    })

    if (!validationResult.isValid) {
      return jsonResponse(
        {
          success: false,
          error: 'Image validation failed',
          errors: validationResult.errors,
        },
        400
      )
    }

    // Process the image (resize, optimise, extract metadata)
    const processedImage = await processUploadedImage(buffer, {
      maxWidth: 4096,
      maxHeight: 4096,
      quality: 85,
    })

    // Generate storage key and upload
    const storageKey = generateStorageKey(processedImage.mimeType, 'uploads')

    const uploadResult = await uploadFile({
      buffer: processedImage.buffer,
      key: storageKey,
      contentType: processedImage.mimeType,
      metadata: {
        originalFilename: file.name,
        sessionId,
        userId: userId || '',
      },
    })

    // Calculate retention expiry based on storage policy
    const expiresAt = calculateRetentionExpiry(isAuthenticated, 'upload')
    const retentionDays = isAuthenticated ? 30 : 1

    // Store asset record in database with consent metadata
    const asset = await prisma.asset.create({
      data: {
        sessionId,
        userId,
        source: 'UPLOAD',
        assetType: 'IMAGE',
        storageKey: uploadResult.key,
        storageUrl: uploadResult.url,
        mimeType: processedImage.mimeType,
        width: processedImage.metadata.width,
        height: processedImage.metadata.height,
        fileSize: uploadResult.size,
        originalFilename: file.name,
        metadata: {
          dpi: processedImage.metadata.dpi,
          originalWidth: validationResult.metadata.width,
          originalHeight: validationResult.metadata.height,
          originalFormat: validationResult.metadata.format,
          processedAt: new Date().toISOString(),
          consent: {
            consentGiven: true,
            consentTimestamp: consentTimestamp.toString(),
            consentType: 'photo_upload',
          },
        } as any,
        status: 'TEMPORARY',
        storageTier: 'HOT',
        expiresAt,
        retentionDays,
      },
    })

    // Build response with proxy URL instead of direct storage URL
    const response: UploadSuccessResponse = {
      success: true,
      asset: {
        id: asset.id,
        storageUrl: getProxyUrl(asset.id),
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        expiresAt: asset.expiresAt?.toISOString() || null,
      },
    }

    // Include quality warnings if any
    if (validationResult.warnings.length > 0) {
      response.warnings = validationResult.warnings
    }

    return jsonResponse(response, 200)
  } catch (error) {
    console.error('Upload error:', error)

    // Determine error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return jsonResponse(
      {
        success: false,
        error: `Failed to upload file: ${errorMessage}`,
      },
      500
    )
  }
}
