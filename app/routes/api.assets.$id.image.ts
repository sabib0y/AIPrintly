/**
 * Asset Image Proxy Endpoint
 *
 * GET /api/assets/:id/image - Serve asset images through a proxy
 *
 * This endpoint prevents direct download of AI-generated and uploaded images
 * by serving them through an authenticated proxy with download-prevention headers.
 * Images can only be accessed by the session/user that owns them.
 */

import type { LoaderFunctionArgs } from 'react-router'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '~/services/prisma.server'
import { getSessionId, getUserIdFromSession } from '~/services/session.server'

/**
 * Get required environment variables
 */
function getStorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Missing required R2 environment variables')
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName }
}

/**
 * Create S3 client for R2 access
 */
let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (s3Client) return s3Client

  const config = getStorageConfig()

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return s3Client
}

/**
 * Create JSON error response
 */
function errorResponse(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Serve image through authenticated proxy
 *
 * GET /api/assets/:id/image
 */
export async function loader({ request, params }: LoaderFunctionArgs): Promise<Response> {
  try {
    // Validate asset ID parameter
    const assetId = params.id
    if (!assetId) {
      return errorResponse('Asset ID is required', 404)
    }

    // Get session information
    const sessionId = await getSessionId(request)
    if (!sessionId) {
      return errorResponse('Unauthorised', 401)
    }

    const userId = await getUserIdFromSession(request)

    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        storageKey: true,
        mimeType: true,
      },
    })

    if (!asset) {
      return errorResponse('Asset not found', 404)
    }

    // Verify ownership
    // For authenticated users: check userId
    // For guest users: check sessionId
    const hasAccess = userId
      ? asset.userId === userId
      : asset.sessionId === sessionId

    if (!hasAccess) {
      return errorResponse('Access denied', 403)
    }

    // Retrieve image from R2 storage
    const config = getStorageConfig()
    const client = getS3Client()

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: asset.storageKey,
    })

    const response = await client.send(command)

    if (!response.Body) {
      return errorResponse('Failed to retrieve image', 500)
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const imageBuffer = Buffer.concat(chunks)

    // Return image with download-prevention headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        // Prevent download prompt - display inline only
        'Content-Disposition': 'inline',
        // Prevent caching to maintain control
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        // Prevent search engine indexing
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (error) {
    console.error('Asset image proxy error:', error)
    return errorResponse('Failed to retrieve image', 500)
  }
}
