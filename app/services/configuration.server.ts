/**
 * Product Configuration Service
 *
 * Handles creation and management of product configurations.
 * A configuration represents a user's customisation of a product
 * with their chosen variant and design placement.
 */

import { prisma } from './prisma.server'
import type { ProductConfiguration } from '@prisma/client'

/**
 * Customisation data for the design placement
 */
export interface Customisation {
  position: {
    x: number
    y: number
  }
  scale: number
  rotation: number
  qualityWarnings?: string[]
}

/**
 * Configuration with related data
 */
export interface ConfigurationWithRelations extends ProductConfiguration {
  product: {
    id: string
    name: string
    category: string
  }
  variant: {
    id: string
    size: string | null
    colour: string | null
    sellingPricePence: number
    stockStatus: string
  }
  asset: {
    id: string
    storageUrl: string
    width: number
    height: number
  }
}

/**
 * Create configuration input
 */
export interface CreateConfigurationInput {
  sessionId: string
  productId: string
  variantId: string
  assetId: string
  customisation: Customisation
  mockupUrl?: string
}

/**
 * Create a new product configuration
 *
 * @param input - Configuration creation parameters
 * @returns Created configuration with relations
 * @throws Error if product, variant, or asset not found
 */
export async function createConfiguration(
  input: CreateConfigurationInput
): Promise<ConfigurationWithRelations> {
  const { sessionId, productId, variantId, assetId, customisation, mockupUrl } =
    input

  // Verify the product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, name: true, category: true },
  })

  if (!product) {
    throw new Error('Product not found or inactive')
  }

  // Verify the variant exists and belongs to the product
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId, productId },
    select: {
      id: true,
      size: true,
      colour: true,
      sellingPricePence: true,
      stockStatus: true,
    },
  })

  if (!variant) {
    throw new Error('Variant not found or does not belong to product')
  }

  // Verify the asset exists
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      storageUrl: true,
      width: true,
      height: true,
    },
  })

  if (!asset) {
    throw new Error('Asset not found')
  }

  // Check if variant is in stock
  if (variant.stockStatus === 'OUT_OF_STOCK') {
    throw new Error('Selected variant is out of stock')
  }

  // Create the configuration
  const configuration = await prisma.productConfiguration.create({
    data: {
      sessionId,
      productId,
      variantId,
      assetId,
      customisation: customisation as unknown as Record<string, unknown>,
      mockupUrl,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      variant: {
        select: {
          id: true,
          size: true,
          colour: true,
          sellingPricePence: true,
          stockStatus: true,
        },
      },
      asset: {
        select: {
          id: true,
          storageUrl: true,
          width: true,
          height: true,
        },
      },
    },
  })

  return configuration as ConfigurationWithRelations
}

/**
 * Get a configuration by ID
 *
 * @param configurationId - The configuration ID
 * @param sessionId - The session ID (for security)
 * @returns Configuration with relations or null
 */
export async function getConfiguration(
  configurationId: string,
  sessionId: string
): Promise<ConfigurationWithRelations | null> {
  const configuration = await prisma.productConfiguration.findUnique({
    where: {
      id: configurationId,
      sessionId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      variant: {
        select: {
          id: true,
          size: true,
          colour: true,
          sellingPricePence: true,
          stockStatus: true,
        },
      },
      asset: {
        select: {
          id: true,
          storageUrl: true,
          width: true,
          height: true,
        },
      },
    },
  })

  return configuration as ConfigurationWithRelations | null
}

/**
 * Get all configurations for a session
 *
 * @param sessionId - The session ID
 * @returns Array of configurations with relations
 */
export async function getSessionConfigurations(
  sessionId: string
): Promise<ConfigurationWithRelations[]> {
  const configurations = await prisma.productConfiguration.findMany({
    where: { sessionId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      variant: {
        select: {
          id: true,
          size: true,
          colour: true,
          sellingPricePence: true,
          stockStatus: true,
        },
      },
      asset: {
        select: {
          id: true,
          storageUrl: true,
          width: true,
          height: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return configurations as ConfigurationWithRelations[]
}

/**
 * Update a configuration's customisation
 *
 * @param configurationId - The configuration ID
 * @param sessionId - The session ID (for security)
 * @param customisation - New customisation data
 * @param mockupUrl - Optional new mockup URL
 * @returns Updated configuration or null if not found
 */
export async function updateConfiguration(
  configurationId: string,
  sessionId: string,
  customisation: Customisation,
  mockupUrl?: string
): Promise<ConfigurationWithRelations | null> {
  const existing = await prisma.productConfiguration.findUnique({
    where: { id: configurationId, sessionId },
  })

  if (!existing) {
    return null
  }

  const updated = await prisma.productConfiguration.update({
    where: { id: configurationId },
    data: {
      customisation: customisation as unknown as Record<string, unknown>,
      ...(mockupUrl && { mockupUrl }),
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      variant: {
        select: {
          id: true,
          size: true,
          colour: true,
          sellingPricePence: true,
          stockStatus: true,
        },
      },
      asset: {
        select: {
          id: true,
          storageUrl: true,
          width: true,
          height: true,
        },
      },
    },
  })

  return updated as ConfigurationWithRelations
}

/**
 * Delete a configuration
 *
 * @param configurationId - The configuration ID
 * @param sessionId - The session ID (for security)
 * @returns True if deleted, false if not found
 */
export async function deleteConfiguration(
  configurationId: string,
  sessionId: string
): Promise<boolean> {
  const existing = await prisma.productConfiguration.findUnique({
    where: { id: configurationId, sessionId },
  })

  if (!existing) {
    return false
  }

  await prisma.productConfiguration.delete({
    where: { id: configurationId },
  })

  return true
}
