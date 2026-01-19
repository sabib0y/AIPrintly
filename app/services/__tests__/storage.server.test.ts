/**
 * Storage Service Tests
 *
 * Tests for R2/S3 storage operations including upload, delete, and URL generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the AWS SDK before importing the storage module
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn()
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: vi.fn().mockImplementation((params) => ({
      type: 'PutObjectCommand',
      params,
    })),
    DeleteObjectCommand: vi.fn().mockImplementation((params) => ({
      type: 'DeleteObjectCommand',
      params,
    })),
    GetObjectCommand: vi.fn().mockImplementation((params) => ({
      type: 'GetObjectCommand',
      params,
    })),
    HeadObjectCommand: vi.fn().mockImplementation((params) => ({
      type: 'HeadObjectCommand',
      params,
    })),
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com/file'),
}))

// Set environment variables before importing storage module
beforeEach(() => {
  vi.stubEnv('R2_ACCOUNT_ID', 'test-account-id')
  vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key')
  vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key')
  vi.stubEnv('R2_BUCKET_NAME', 'test-bucket')
  vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Storage Service', () => {
  describe('uploadFile', () => {
    it('should upload a file buffer to R2 storage', async () => {
      const { uploadFile } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockResolvedValue({})
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      const buffer = Buffer.from('test content')
      const result = await uploadFile({
        buffer,
        key: 'uploads/test-file.png',
        contentType: 'image/png',
      })

      expect(result).toBeDefined()
      expect(result.key).toBe('uploads/test-file.png')
      expect(result.url).toContain('test-file.png')
    })

    it('should generate a unique key if none provided', async () => {
      const { uploadFile } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockResolvedValue({})
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      const buffer = Buffer.from('test content')
      const result = await uploadFile({
        buffer,
        contentType: 'image/jpeg',
      })

      expect(result.key).toMatch(/^uploads\/[a-z0-9-]+\.jpg$/)
    })

    it('should throw error on upload failure', async () => {
      const { uploadFile } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockRejectedValue(new Error('Upload failed'))
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      const buffer = Buffer.from('test content')
      await expect(
        uploadFile({
          buffer,
          key: 'uploads/test-file.png',
          contentType: 'image/png',
        })
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('deleteFile', () => {
    it('should delete a file from R2 storage', async () => {
      const { deleteFile } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockResolvedValue({})
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      await expect(deleteFile('uploads/test-file.png')).resolves.not.toThrow()
    })

    it('should not throw if file does not exist', async () => {
      const { deleteFile } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockRejectedValue({ name: 'NoSuchKey' })
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      await expect(deleteFile('uploads/nonexistent.png')).resolves.not.toThrow()
    })
  })

  describe('getSignedDownloadUrl', () => {
    it('should generate a signed download URL', async () => {
      const { getSignedDownloadUrl } = await import('../storage.server')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

      const result = await getSignedDownloadUrl('uploads/test-file.png')

      expect(result).toBe('https://presigned-url.example.com/file')
      expect(getSignedUrl).toHaveBeenCalled()
    })

    it('should accept custom expiry time', async () => {
      const { getSignedDownloadUrl } = await import('../storage.server')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

      await getSignedDownloadUrl('uploads/test-file.png', 7200)

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 7200 })
      )
    })
  })

  describe('getPublicUrl', () => {
    it('should return public CDN URL', async () => {
      const { getPublicUrl } = await import('../storage.server')

      const result = getPublicUrl('uploads/test-file.png')

      expect(result).toBe('https://cdn.example.com/uploads/test-file.png')
    })
  })

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const { fileExists } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockResolvedValue({})
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      const result = await fileExists('uploads/test-file.png')

      expect(result).toBe(true)
    })

    it('should return false if file does not exist', async () => {
      const { fileExists } = await import('../storage.server')
      const { S3Client } = await import('@aws-sdk/client-s3')

      const mockSend = vi.fn().mockRejectedValue({ name: 'NotFound' })
      vi.mocked(S3Client).mockImplementation(() => ({
        send: mockSend,
      }) as any)

      const result = await fileExists('uploads/nonexistent.png')

      expect(result).toBe(false)
    })
  })

  describe('generateStorageKey', () => {
    it('should generate a unique storage key with correct extension', async () => {
      const { generateStorageKey } = await import('../storage.server')

      const key1 = generateStorageKey('image/png')
      const key2 = generateStorageKey('image/jpeg')
      const key3 = generateStorageKey('image/webp')

      expect(key1).toMatch(/^uploads\/[a-z0-9-]+\.png$/)
      expect(key2).toMatch(/^uploads\/[a-z0-9-]+\.jpg$/)
      expect(key3).toMatch(/^uploads\/[a-z0-9-]+\.webp$/)
    })

    it('should allow custom prefix', async () => {
      const { generateStorageKey } = await import('../storage.server')

      const key = generateStorageKey('image/png', 'generated')

      expect(key).toMatch(/^generated\/[a-z0-9-]+\.png$/)
    })
  })
})
