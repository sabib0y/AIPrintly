/**
 * UploadDropzone Component Tests
 *
 * Tests for drag & drop upload UI including file selection, progress display,
 * validation feedback, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadDropzone } from '../UploadDropzone'

// Mock fetch for upload requests
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('UploadDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          asset: {
            id: 'test-asset-id',
            storageUrl: 'https://cdn.example.com/test.jpg',
            width: 2000,
            height: 1500,
            mimeType: 'image/jpeg',
            fileSize: 500000,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the dropzone with instructions', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText(/click to browse/i)).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(
        <UploadDropzone onUploadComplete={vi.fn()} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should show supported file types', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      expect(screen.getByText(/jpg|png|webp/i)).toBeInTheDocument()
    })

    it('should show maximum file size', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} maxSizeMB={25} />)

      expect(screen.getByText(/25\s*MB/i)).toBeInTheDocument()
    })
  })

  describe('File Input', () => {
    it('should have a hidden file input', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveClass('sr-only')
    })

    it('should accept only image files', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    })

    it('should trigger file input when clicking dropzone', async () => {
      const user = userEvent.setup()
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const input = screen.getByTestId('file-input') as HTMLInputElement

      const clickSpy = vi.spyOn(input, 'click')

      await user.click(dropzone)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('Drag and Drop', () => {
    it('should highlight when dragging over', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { types: ['Files'] },
      })

      expect(dropzone).toHaveClass('border-sky-500')
    })

    it('should remove highlight when dragging leaves', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { types: ['Files'] },
      })
      fireEvent.dragLeave(dropzone)

      expect(dropzone).not.toHaveClass('border-sky-500')
    })

    it('should handle file drop', async () => {
      const onUploadComplete = vi.fn()
      render(<UploadDropzone onUploadComplete={onUploadComplete} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  describe('Upload Progress', () => {
    it('should show progress indicator during upload', async () => {
      // Delay the fetch response
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      asset: { id: 'test' },
                    }),
                }),
              100
            )
          )
      )

      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })
    })

    it('should show file name during upload', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      asset: { id: 'test' },
                    }),
                }),
              100
            )
          )
      )

      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'my-photo.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/my-photo.jpg/i)).toBeInTheDocument()
      })
    })
  })

  describe('Upload Completion', () => {
    it('should call onUploadComplete with asset data', async () => {
      const onUploadComplete = vi.fn()
      render(<UploadDropzone onUploadComplete={onUploadComplete} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-asset-id',
          })
        )
      })
    })

    it('should show success state after upload', async () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message on upload failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Upload failed',
          }),
      })

      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      })
    })

    it('should show validation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Image validation failed',
            errors: ['Image is too small'],
          }),
      })

      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'small.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/too small/i)).toBeInTheDocument()
      })
    })

    it('should call onError callback on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Server error',
          }),
      })

      const onError = vi.fn()
      render(<UploadDropzone onUploadComplete={vi.fn()} onError={onError} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Server error')
      })
    })

    it('should reject unsupported file types client-side', async () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/unsupported/i)).toBeInTheDocument()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject files exceeding size limit client-side', async () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} maxSizeMB={1} />)

      const dropzone = screen.getByTestId('dropzone')
      // Create a 2MB file
      const largeContent = new Array(2 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/too large/i)).toBeInTheDocument()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Warnings', () => {
    it('should display quality warnings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            asset: { id: 'test' },
            warnings: ['Image has low DPI for printing'],
          }),
      })

      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/low DPI/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveAttribute('role', 'button')
      expect(dropzone).toHaveAttribute('aria-label')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const input = screen.getByTestId('file-input') as HTMLInputElement

      dropzone.focus()
      const clickSpy = vi.spyOn(input, 'click')

      await user.keyboard('{Enter}')

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should announce upload status to screen readers', async () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        const statusRegion = screen.getByRole('status')
        expect(statusRegion).toBeInTheDocument()
      })
    })
  })

  describe('Disabled State', () => {
    it('should prevent uploads when disabled', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} disabled />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should show disabled styling', () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} disabled />)

      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveClass('opacity-50')
      expect(dropzone).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Reset', () => {
    it('should allow uploading another file after success', async () => {
      render(<UploadDropzone onUploadComplete={vi.fn()} />)

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // First upload
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument()
      })

      // Click to upload another
      const uploadAnotherButton = screen.getByRole('button', {
        name: /upload another/i,
      })
      fireEvent.click(uploadAnotherButton)

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    })
  })
})
