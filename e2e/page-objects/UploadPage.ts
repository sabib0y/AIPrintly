/**
 * Upload Page Object
 *
 * Page object for image upload functionality.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import * as path from 'path'

export class UploadPage extends BasePage {
  // Upload elements
  readonly dropZone: Locator
  readonly fileInput: Locator
  readonly uploadButton: Locator
  readonly uploadProgress: Locator

  // Preview elements
  readonly imagePreview: Locator
  readonly qualityIndicator: Locator
  readonly dimensionsDisplay: Locator

  // Actions
  readonly continueButton: Locator
  readonly cancelButton: Locator

  // Error elements
  readonly errorMessage: Locator
  readonly successIndicator: Locator

  // Aliases for backward compatibility
  readonly uploadSuccess: Locator
  readonly uploadError: Locator

  constructor(page: Page) {
    super(page)
    this.dropZone = page.getByTestId('upload-dropzone')
    this.fileInput = page.locator('input[type="file"]')
    this.uploadButton = page.getByTestId('upload-button')
    this.uploadProgress = page.getByTestId('upload-progress')
    this.imagePreview = page.getByTestId('image-preview')
    this.qualityIndicator = page.getByTestId('quality-indicator')
    this.dimensionsDisplay = page.getByTestId('dimensions-display')
    this.continueButton = page.getByTestId('continue-button')
    this.cancelButton = page.getByTestId('cancel-button')
    this.errorMessage = page.getByTestId('upload-error')
    this.successIndicator = page.getByTestId('upload-success')

    // Aliases
    this.uploadSuccess = this.successIndicator
    this.uploadError = this.errorMessage
  }

  get urlPattern(): RegExp {
    return /\/create\/upload/
  }

  async goto(): Promise<void> {
    await this.page.goto('/create/upload')
    await this.waitForLoad()
  }

  /**
   * Upload an image file
   */
  async uploadImage(filePath: string): Promise<void> {
    const absolutePath = path.resolve(process.cwd(), 'e2e', filePath)
    await this.fileInput.setInputFiles(absolutePath)
  }

  /**
   * Drag and drop an image file
   */
  async dragAndDropImage(filePath: string): Promise<void> {
    const absolutePath = path.resolve(process.cwd(), 'e2e', filePath)

    // Create a DataTransfer object and dispatch drop event
    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer())

    // Dispatch dragenter, dragover, and drop events
    await this.dropZone.dispatchEvent('dragenter', { dataTransfer })
    await this.dropZone.dispatchEvent('dragover', { dataTransfer })

    // Set the file
    await this.fileInput.setInputFiles(absolutePath)
  }

  /**
   * Wait for upload to complete
   */
  async waitForUploadComplete(): Promise<void> {
    await this.uploadProgress.waitFor({ state: 'hidden', timeout: 60000 })
    // Wait for either success or error
    await Promise.race([
      this.successIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ])
  }

  /**
   * Click continue to proceed to builder
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click()
  }

  /**
   * Check if upload was successful
   */
  async isUploadSuccessful(): Promise<boolean> {
    return this.successIndicator.isVisible()
  }

  /**
   * Get quality assessment text
   */
  async getQualityText(): Promise<string | null> {
    return this.qualityIndicator.textContent()
  }

  /**
   * Get image dimensions
   */
  async getDimensions(): Promise<{ width: number; height: number } | null> {
    const text = await this.dimensionsDisplay.textContent()
    const match = text?.match(/(\d+)\s*x\s*(\d+)/)
    if (match) {
      return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
    }
    return null
  }

  /**
   * Check if there's an error
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible()
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string | null> {
    return this.errorMessage.textContent()
  }
}
