/**
 * UploadDropzone Component
 *
 * A drag & drop file upload component with progress indicator, validation feedback,
 * and accessibility support.
 */

import { useCallback, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

/**
 * Uploaded asset data returned from the API
 */
export interface UploadedAsset {
  id: string
  storageUrl: string
  width: number
  height: number
  mimeType: string
  fileSize: number
  expiresAt: string | null
}

/**
 * Upload response from the API
 */
interface UploadResponse {
  success: boolean
  asset?: UploadedAsset
  error?: string
  errors?: string[]
  warnings?: string[]
}

/**
 * Upload state enum
 */
type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

/**
 * UploadDropzone props
 */
export interface UploadDropzoneProps {
  /** Callback when upload completes successfully */
  onUploadComplete: (asset: UploadedAsset) => void
  /** Callback when an error occurs */
  onError?: (error: string) => void
  /** Additional CSS class names */
  className?: string
  /** Maximum file size in MB (default: 25) */
  maxSizeMB?: number
  /** Whether the dropzone is disabled */
  disabled?: boolean
}

/**
 * Supported MIME types
 */
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * UploadDropzone - Drag & drop file upload component
 */
export function UploadDropzone({
  onUploadComplete,
  onError,
  className,
  maxSizeMB = 25,
  disabled = false,
}: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!SUPPORTED_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported file type: ${file.type}. Please use JPG, PNG, or WebP.`,
        }
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File is too large (${formatFileSize(file.size)}). Maximum size is ${maxSizeMB} MB.`,
        }
      }

      return { valid: true }
    },
    [maxSizeBytes, maxSizeMB]
  )

  /**
   * Upload the file to the server
   */
  const uploadFile = useCallback(
    async (file: File) => {
      setCurrentFile(file)
      setState('uploading')
      setError(null)
      setErrors([])
      setWarnings([])

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        })

        const data: UploadResponse = await response.json()

        if (!response.ok || !data.success) {
          setState('error')
          const errorMessage = data.error || 'Upload failed'
          setError(errorMessage)
          setErrors(data.errors || [])
          onError?.(errorMessage)
          return
        }

        // Handle success
        if (data.asset) {
          setState('success')
          setUploadedAsset(data.asset)
          setWarnings(data.warnings || [])
          onUploadComplete(data.asset)
        }
      } catch (err) {
        setState('error')
        const errorMessage =
          err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    },
    [onUploadComplete, onError]
  )

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0 || disabled) return

      const file = files[0]
      const validation = validateFile(file)

      if (!validation.valid) {
        setState('error')
        setError(validation.error || 'Invalid file')
        return
      }

      uploadFile(file)

      // Reset input value to allow selecting the same file again
      event.target.value = ''
    },
    [disabled, validateFile, uploadFile]
  )

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return
      setState('dragging')
    },
    [disabled]
  )

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return
      setState('idle')
    },
    [disabled]
  )

  /**
   * Handle drag over (required for drop to work)
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (disabled) {
        setState('idle')
        return
      }

      setState('idle')

      const files = event.dataTransfer.files
      if (!files || files.length === 0) return

      const file = files[0]
      const validation = validateFile(file)

      if (!validation.valid) {
        setState('error')
        setError(validation.error || 'Invalid file')
        return
      }

      uploadFile(file)
    },
    [disabled, validateFile, uploadFile]
  )

  /**
   * Handle click to open file picker
   */
  const handleClick = useCallback(() => {
    if (disabled || state === 'uploading') return
    fileInputRef.current?.click()
  }, [disabled, state])

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  /**
   * Reset to allow another upload
   */
  const handleReset = useCallback(() => {
    setState('idle')
    setCurrentFile(null)
    setError(null)
    setErrors([])
    setWarnings([])
    setUploadedAsset(null)
  }, [])

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="sr-only"
        data-testid="file-input"
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Dropzone */}
      <div
        data-testid="dropzone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload image. Drag and drop or click to browse. Supported formats: JPG, PNG, WebP. Maximum size: ${maxSizeMB} MB.`}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all',
          // Base styles
          'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
          // Drag state
          state === 'dragging' && 'border-sky-500 bg-sky-50',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-50 hover:border-gray-300 hover:bg-gray-50',
          // Upload/success states
          state === 'uploading' && 'pointer-events-none',
          state === 'success' && 'border-green-500 bg-green-50',
          state === 'error' && 'border-red-500 bg-red-50'
        )}
      >
        {/* Status announcement for screen readers */}
        <div role="status" aria-live="polite" className="sr-only">
          {state === 'uploading' && `Uploading ${currentFile?.name}`}
          {state === 'success' && 'Upload successful'}
          {state === 'error' && `Upload failed: ${error}`}
        </div>

        {/* Idle state */}
        {state === 'idle' && (
          <>
            <Upload className="mb-4 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-center text-sm font-medium text-gray-700">
              Drag and drop your image here, or{' '}
              <span className="text-sky-600">click to browse</span>
            </p>
            <p className="text-center text-xs text-gray-500">
              Supports JPG, PNG, WebP (max {maxSizeMB} MB)
            </p>
          </>
        )}

        {/* Dragging state */}
        {state === 'dragging' && (
          <>
            <Upload className="mb-4 h-10 w-10 text-sky-500" />
            <p className="text-center text-sm font-medium text-sky-700">
              Drop your image here
            </p>
          </>
        )}

        {/* Uploading state */}
        {state === 'uploading' && currentFile && (
          <>
            <Spinner size="lg" className="mb-4" />
            <p className="mb-2 text-center text-sm font-medium text-gray-700">
              Uploading...
            </p>
            <p className="text-center text-xs text-gray-500">
              {currentFile.name} ({formatFileSize(currentFile.size)})
            </p>
          </>
        )}

        {/* Success state */}
        {state === 'success' && (
          <>
            <CheckCircle className="mb-4 h-10 w-10 text-green-500" />
            <p className="mb-2 text-center text-sm font-medium text-green-700">
              Upload successful!
            </p>
            {warnings.length > 0 && (
              <div className="mb-3 rounded-md bg-amber-50 p-2">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-amber-700"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              aria-label="Upload another file"
            >
              Upload another
            </Button>
          </>
        )}

        {/* Error state */}
        {state === 'error' && (
          <>
            <XCircle className="mb-4 h-10 w-10 text-red-500" />
            <p className="mb-2 text-center text-sm font-medium text-red-700">
              {error}
            </p>
            {errors.length > 0 && (
              <ul className="mb-3 list-inside list-disc text-xs text-red-600">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default UploadDropzone
