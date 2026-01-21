/**
 * Product Builder Page Object
 *
 * Page object for the product customisation builder.
 */

import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class BuilderPage extends BasePage {
  // Canvas elements
  readonly canvas: Locator
  readonly printAreaOverlay: Locator
  readonly imageLayer: Locator
  readonly designElement: Locator // Alias for imageLayer

  // Controls
  readonly zoomInButton: Locator
  readonly zoomOutButton: Locator
  readonly rotateButton: Locator
  readonly resetButton: Locator
  readonly zoomSlider: Locator

  // Product options
  readonly colourSelector: Locator
  readonly sizeSelector: Locator
  readonly variantSelector: Locator

  // Quality indicators
  readonly qualityWarning: Locator
  readonly qualityIndicator: Locator
  readonly qualityConfirmDialog: Locator

  // Price and actions
  readonly priceDisplay: Locator
  readonly addToCartButton: Locator
  readonly changeImageButton: Locator

  // Mockup preview
  readonly mockupPreview: Locator
  readonly mockupLoading: Locator

  constructor(page: Page) {
    super(page)
    // Canvas
    this.canvas = page.getByTestId('builder-canvas')
    this.printAreaOverlay = page.getByTestId('print-area-overlay')
    this.imageLayer = page.getByTestId('image-layer')
    this.designElement = this.imageLayer // Alias for tests expecting designElement

    // Controls
    this.zoomInButton = page.getByTestId('zoom-in-button')
    this.zoomOutButton = page.getByTestId('zoom-out-button')
    this.rotateButton = page.getByTestId('rotate-button')
    this.resetButton = page.getByTestId('reset-button')
    this.zoomSlider = page.getByTestId('zoom-slider')

    // Product options
    this.colourSelector = page.getByTestId('colour-selector')
    this.sizeSelector = page.getByTestId('size-selector')
    this.variantSelector = page.getByTestId('variant-selector')

    // Quality
    this.qualityWarning = page.getByTestId('quality-warning')
    this.qualityIndicator = page.getByTestId('quality-indicator')
    this.qualityConfirmDialog = page.getByTestId('quality-confirm-dialog')

    // Price and actions
    this.priceDisplay = page.getByTestId('price-display')
    this.addToCartButton = page.getByTestId('add-to-cart-button')
    this.changeImageButton = page.getByTestId('change-image-button')

    // Mockup
    this.mockupPreview = page.getByTestId('mockup-preview')
    this.mockupLoading = page.getByTestId('mockup-loading')
  }

  get urlPattern(): RegExp {
    return /\/build\/.+/
  }

  async goto(productType: string, assetId?: string): Promise<void> {
    const url = assetId ? `/build/${productType}?assetId=${assetId}` : `/build/${productType}`
    await this.page.goto(url)
    await this.waitForLoad()
  }

  /**
   * Select a product type
   */
  async selectProduct(type: 'mug' | 'tshirt' | 'print' | 'storybook'): Promise<void> {
    await this.page.getByTestId(`product-${type}`).click()
  }

  /**
   * Select colour variant
   */
  async selectColour(colour: string): Promise<void> {
    await this.colourSelector.click()
    await this.page.getByTestId(`colour-${colour.toLowerCase()}`).click()
  }

  /**
   * Select size variant
   */
  async selectSize(size: string): Promise<void> {
    await this.sizeSelector.click()
    await this.page.getByTestId(`size-${size.toLowerCase()}`).click()
  }

  /**
   * Click zoom in button
   */
  async clickZoomIn(): Promise<void> {
    await this.zoomInButton.click()
  }

  /**
   * Click zoom out button
   */
  async clickZoomOut(): Promise<void> {
    await this.zoomOutButton.click()
  }

  /**
   * Click reset button
   */
  async clickReset(): Promise<void> {
    await this.resetButton.click()
  }

  /**
   * Rotate image by clicking rotate button
   */
  async rotateImage(degrees: number): Promise<void> {
    const clicks = Math.round(degrees / 15) // Assuming 15 degree increments
    for (let i = 0; i < clicks; i++) {
      await this.rotateButton.click()
    }
  }

  /**
   * Drag image within canvas
   */
  async dragImage(options: { deltaX: number; deltaY: number }): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) return

    const startX = canvasBox.x + canvasBox.width / 2
    const startY = canvasBox.y + canvasBox.height / 2

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX + options.deltaX, startY + options.deltaY)
    await this.page.mouse.up()
  }

  /**
   * Adjust image position using transform controls
   */
  async adjustImagePosition(options: { x?: number; y?: number; scale?: number }): Promise<void> {
    if (options.scale !== undefined) {
      // Use slider to set scale
      await this.zoomSlider.fill(options.scale.toString())
    }
    if (options.x !== undefined || options.y !== undefined) {
      await this.dragImage({
        deltaX: options.x ? (options.x - 0.5) * 200 : 0,
        deltaY: options.y ? (options.y - 0.5) * 200 : 0,
      })
    }
  }

  /**
   * Get current image position (normalised 0-1)
   */
  async getImagePosition(): Promise<{ x: number; y: number }> {
    const positionData = await this.imageLayer.getAttribute('data-position')
    if (positionData) {
      const [x, y] = positionData.split(',').map(Number)
      return { x, y }
    }
    return { x: 0.5, y: 0.5 }
  }

  /**
   * Get current image scale
   */
  async getImageScale(): Promise<number> {
    const scaleData = await this.imageLayer.getAttribute('data-scale')
    return scaleData ? parseFloat(scaleData) : 1
  }

  /**
   * Get current image rotation
   */
  async getImageRotation(): Promise<number> {
    const rotationData = await this.imageLayer.getAttribute('data-rotation')
    return rotationData ? parseFloat(rotationData) : 0
  }

  /**
   * Wait for mockup to be generated
   */
  async waitForMockupGenerated(): Promise<void> {
    await this.mockupLoading.waitFor({ state: 'hidden', timeout: 30000 })
    await this.mockupPreview.waitFor({ state: 'visible' })
  }

  /**
   * Add product to cart
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }

  /**
   * Quick add to cart (for test setup)
   */
  async quickAddToCart(): Promise<void> {
    await this.addToCartButton.click()
    // If quality warning appears, confirm it
    if (await this.qualityConfirmDialog.isVisible()) {
      await this.confirmQualityWarning()
    }
  }

  /**
   * Confirm quality warning dialog
   */
  async confirmQualityWarning(): Promise<void> {
    await this.page.getByTestId('confirm-quality-warning').click()
  }

  /**
   * Dismiss quality warning dialog
   */
  async dismissQualityWarning(): Promise<void> {
    await this.page.getByTestId('cancel-quality-warning').click()
  }

  /**
   * Get displayed price text
   */
  async getPrice(): Promise<string | null> {
    return this.priceDisplay.textContent()
  }

  /**
   * Mobile: Pinch to zoom
   */
  async pinchZoom(scaleFactor: number): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) return

    const centerX = canvasBox.x + canvasBox.width / 2
    const centerY = canvasBox.y + canvasBox.height / 2

    // Simulate pinch gesture
    await this.page.touchscreen.tap(centerX, centerY)
    // Note: Full pinch zoom would require more complex touch event simulation
  }

  /**
   * Mobile: Two-finger rotate
   */
  async twoFingerRotate(degrees: number): Promise<void> {
    // Simulate rotation gesture
    // Note: Full rotation gesture would require complex touch event simulation
    await this.rotateImage(degrees)
  }
}
