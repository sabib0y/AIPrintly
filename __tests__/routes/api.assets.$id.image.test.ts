/**
 * Asset Image Proxy Endpoint Tests
 *
 * Tests for GET /api/assets/:id/image
 * Verifies session ownership validation, download prevention headers,
 * and secure image delivery.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LoaderFunctionArgs } from 'react-router'
import { S3Client } from '@aws-sdk/client-s3'

// Set up environment variables before imports
process.env.R2_ACCOUNT_ID = 'test-account'
process.env.R2_ACCESS_KEY_ID = 'test-access-key'
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key'
process.env.R2_BUCKET_NAME = 'test-bucket'

// Mock Prisma
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    asset: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock session
vi.mock('~/services/session.server', () => ({
  getSessionId: vi.fn(),
  getUserIdFromSession: vi.fn(),
}))

const mockPrisma = await import('~/services/prisma.server')
const mockSession = await import('~/services/session.server')

describe('GET /api/assets/:id/image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when session is missing', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue(null)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/test-id/image')

      const response = await loader({
        request,
        params: { id: 'test-id' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorised')
    })

    it('should return 404 when asset does not exist', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue(null)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/nonexistent/image')

      const response = await loader({
        request,
        params: { id: 'nonexistent' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Asset not found')
    })

    it('should return 403 when session does not own asset (guest)', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue(null)
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'different-session',
        userId: null,
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Access denied')
    })

    it('should return 403 when user does not own asset', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue('user-123')
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'session-456',
        userId: 'user-456',
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Access denied')
    })

    it('should allow access when session matches (guest user)', async () => {
      const mockImageData = Buffer.from('test-image-content')

      // Mock the stream
      const mockBody = {
        transformToWebStream: () => ({
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(mockImageData) })
              .mockResolvedValueOnce({ done: true }),
          }),
        }),
      }

      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue(null)
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'session-123',
        userId: null,
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      // Mock S3 send
      const mockSend = vi.fn().mockResolvedValue({
        Body: mockBody,
        ContentType: 'image/png',
      })

      vi.spyOn(S3Client.prototype, 'send').mockImplementation(mockSend)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Disposition')).toBe('inline')
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate')
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
      expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    it('should allow access when userId matches (authenticated user)', async () => {
      const mockImageData = Buffer.from('test-image-content')

      const mockBody = {
        transformToWebStream: () => ({
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(mockImageData) })
              .mockResolvedValueOnce({ done: true }),
          }),
        }),
      }

      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue('user-123')
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'session-456',
        userId: 'user-123',
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      const mockSend = vi.fn().mockResolvedValue({
        Body: mockBody,
        ContentType: 'image/png',
      })

      vi.spyOn(S3Client.prototype, 'send').mockImplementation(mockSend)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(200)
    })
  })

  describe('Download Prevention Headers', () => {
    it('should set all download prevention headers correctly', async () => {
      const mockImageData = Buffer.from('test-image-content')

      const mockBody = {
        transformToWebStream: () => ({
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(mockImageData) })
              .mockResolvedValueOnce({ done: true }),
          }),
        }),
      }

      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue(null)
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'session-123',
        userId: null,
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      const mockSend = vi.fn().mockResolvedValue({
        Body: mockBody,
        ContentType: 'image/png',
      })

      vi.spyOn(S3Client.prototype, 'send').mockImplementation(mockSend)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      // Verify all download prevention headers
      expect(response.headers.get('Content-Disposition')).toBe('inline')
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate')
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
      expect(response.headers.get('Content-Type')).toBe('image/png')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 if R2 retrieval fails', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')
      vi.mocked(mockSession.getUserIdFromSession).mockResolvedValue(null)
      vi.mocked(mockPrisma.prisma.asset.findUnique).mockResolvedValue({
        id: 'asset-1',
        sessionId: 'session-123',
        userId: null,
        storageKey: 'uploads/test.png',
        mimeType: 'image/png',
      } as any)

      const mockSend = vi.fn().mockRejectedValue(new Error('S3 connection failed'))
      vi.spyOn(S3Client.prototype, 'send').mockImplementation(mockSend)

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets/asset-1/image')

      const response = await loader({
        request,
        params: { id: 'asset-1' },
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to retrieve image')
    })

    it('should handle missing asset ID parameter', async () => {
      vi.mocked(mockSession.getSessionId).mockResolvedValue('session-123')

      const { loader } = await import('~/routes/api.assets.$id.image')
      const request = new Request('http://localhost/api/assets//image')

      const response = await loader({
        request,
        params: {},
      } as unknown as LoaderFunctionArgs)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Asset ID is required')
    })
  })
})
