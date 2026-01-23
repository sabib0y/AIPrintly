/**
 * Storage Service
 *
 * R2/S3-compatible storage client for managing file uploads, downloads, and deletions.
 * Supports Cloudflare R2 as the primary storage backend with S3 API compatibility.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

/**
 * Environment variable validation
 */
function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

/**
 * Get storage configuration from environment
 */
function getStorageConfig() {
  return {
    accountId: getRequiredEnvVar('R2_ACCOUNT_ID'),
    accessKeyId: getRequiredEnvVar('R2_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnvVar('R2_SECRET_ACCESS_KEY'),
    bucketName: getRequiredEnvVar('R2_BUCKET_NAME'),
    publicUrl: process.env.R2_PUBLIC_URL,
  }
}

/**
 * Create and cache the S3 client
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
 * Mime type to file extension mapping
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

/**
 * Generate a unique storage key for a file
 *
 * @param contentType - The MIME type of the file
 * @param prefix - Optional prefix (defaults to 'uploads')
 * @returns A unique storage key with appropriate extension
 */
export function generateStorageKey(
  contentType: string,
  prefix: string = 'uploads'
): string {
  const extension = MIME_TO_EXTENSION[contentType] || 'bin'
  const uniqueId = nanoid(21)
  return `${prefix}/${uniqueId}.${extension}`
}

/**
 * Upload file options
 */
export interface UploadFileOptions {
  /** File buffer to upload */
  buffer: Buffer
  /** Storage key (path in bucket). If not provided, a unique key will be generated */
  key?: string
  /** MIME content type */
  contentType: string
  /** Custom metadata to attach to the file */
  metadata?: Record<string, string>
  /** Cache-Control header value */
  cacheControl?: string
}

/**
 * Upload file result
 */
export interface UploadFileResult {
  /** Storage key (path in bucket) */
  key: string
  /** Public URL to access the file */
  url: string
  /** File size in bytes */
  size: number
}

/**
 * Upload a file to R2 storage
 *
 * @param options - Upload options including buffer, key, and content type
 * @returns Upload result with key and URL
 * @throws Error if upload fails
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadFileResult> {
  const { buffer, contentType, metadata, cacheControl } = options
  const key = options.key || generateStorageKey(contentType)
  const config = getStorageConfig()
  const client = getS3Client()

  const params: PutObjectCommandInput = {
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
    CacheControl: cacheControl || 'max-age=31536000, immutable',
  }

  await client.send(new PutObjectCommand(params))

  return {
    key,
    url: getPublicUrl(key),
    size: buffer.length,
  }
}

/**
 * Delete a file from R2 storage
 *
 * @param key - Storage key (path in bucket) to delete
 * @throws Error if deletion fails (except for non-existent files)
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client()

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    )
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as { name?: string })?.name === 'NoSuchKey') {
      return
    }
    throw error
  }
}

/**
 * Delete multiple files from R2 storage
 *
 * @param keys - Array of storage keys to delete
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => deleteFile(key)))
}

/**
 * Get a signed download URL for a file
 *
 * @param key - Storage key (path in bucket)
 * @param expiresIn - URL expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL for downloading the file
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getStorageConfig()
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Get the public CDN URL for a file
 *
 * @param key - Storage key (path in bucket)
 * @returns Public URL to access the file
 */
export function getPublicUrl(key: string): string {
  const config = getStorageConfig()

  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`
  }

  // Fallback to R2 public URL format
  return `https://${config.bucketName}.${config.accountId}.r2.dev/${key}`
}

/**
 * Check if a file exists in R2 storage
 *
 * @param key - Storage key (path in bucket)
 * @returns True if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  const config = getStorageConfig()
  const client = getS3Client()

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

/**
 * Get file metadata from R2 storage
 *
 * @param key - Storage key (path in bucket)
 * @returns File metadata including size, content type, and custom metadata
 */
export async function getFileMetadata(key: string): Promise<{
  size: number
  contentType: string | undefined
  metadata: Record<string, string> | undefined
  lastModified: Date | undefined
} | null> {
  const config = getStorageConfig()
  const client = getS3Client()

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    )

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType,
      metadata: response.Metadata,
      lastModified: response.LastModified,
    }
  } catch {
    return null
  }
}

/**
 * Copy a file within R2 storage
 *
 * @param sourceKey - Source storage key
 * @param destinationKey - Destination storage key
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client()

  // R2 doesn't support CopyObject directly, so we read and write
  const getResponse = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: sourceKey,
    })
  )

  if (!getResponse.Body) {
    throw new Error(`Source file not found: ${sourceKey}`)
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  const reader = getResponse.Body.transformToWebStream().getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const buffer = Buffer.concat(chunks)

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: destinationKey,
      Body: buffer,
      ContentType: getResponse.ContentType,
      Metadata: getResponse.Metadata,
    })
  )
}

/**
 * Calculate retention expiry date based on asset type and user status
 *
 * @param isAuthenticated - Whether the user is authenticated
 * @param assetType - Type of asset (upload, generated, story, mockup)
 * @returns Expiry date for the asset
 */
export function calculateRetentionExpiry(
  isAuthenticated: boolean,
  assetType: 'upload' | 'generated' | 'story' | 'mockup'
): Date {
  const now = new Date()

  // Retention rules based on storage policy
  const retentionDays: Record<string, { guest: number; authenticated: number }> =
    {
      upload: { guest: 1, authenticated: 30 }, // 24h guest, 30 days authenticated
      generated: { guest: 7, authenticated: 7 }, // 7 days for AI-generated images
      story: { guest: 14, authenticated: 14 }, // 14 days for stories
      mockup: { guest: 3, authenticated: 7 }, // 3-7 days for mockups
    }

  const days = isAuthenticated
    ? retentionDays[assetType].authenticated
    : retentionDays[assetType].guest

  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Get the storage tier based on asset age
 *
 * @param createdAt - Asset creation date
 * @param isOrdered - Whether the asset is linked to an order
 * @returns Recommended storage tier
 */
export function getRecommendedStorageTier(
  createdAt: Date,
  isOrdered: boolean
): 'HOT' | 'WARM' | 'COLD' {
  if (!isOrdered) {
    return 'HOT' // Unordered assets stay hot until deletion
  }

  const now = new Date()
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (daysSinceCreation < 30) {
    return 'HOT'
  } else if (daysSinceCreation < 90) {
    return 'WARM'
  } else {
    return 'COLD'
  }
}

/**
 * Get proxy URL for an asset
 *
 * This returns a URL to the asset proxy endpoint instead of direct R2 URL.
 * The proxy endpoint enforces authentication and prevents direct downloads.
 *
 * @param assetId - The asset ID
 * @returns Proxy URL for the asset
 */
export function getProxyUrl(assetId: string): string {
  const appUrl = process.env.APP_URL || 'http://localhost:5173'
  return `${appUrl}/api/assets/${assetId}/image`
}
