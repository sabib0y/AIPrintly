/**
 * Add to Cart API
 *
 * POST /api/cart/add
 *
 * Creates a product configuration and adds it to the cart in a single action.
 * This is the primary endpoint for the Build → Cart flow.
 */

import type { ActionFunctionArgs } from 'react-router'
import { data } from 'react-router'
import { z } from 'zod'
import { getSession, commitSession } from '~/services/session.server'
import {
  createConfiguration,
  type Customisation,
} from '~/services/configuration.server'
import { addToCart } from '~/services/cart.server'

/**
 * Request body schema
 */
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  assetId: z.string().uuid(),
  customisation: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    scale: z.number().min(0.1).max(10),
    rotation: z.number().min(-360).max(360),
  }),
  mockupUrl: z.string().url().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  qualityWarnings: z.array(z.string()).optional(),
})

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    )
  }

  const session = await getSession(request)
  const sessionId = session.get('id')

  if (!sessionId) {
    return data(
      { success: false, error: 'Session not found' },
      {
        status: 401,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }

  try {
    // Parse request body
    const body = await request.json()
    const parseResult = addToCartSchema.safeParse(body)

    if (!parseResult.success) {
      return data(
        {
          success: false,
          error: 'Invalid request data',
          errors: parseResult.error.errors.map((e) => e.message),
        },
        {
          status: 400,
          headers: { 'Set-Cookie': await commitSession(session) },
        }
      )
    }

    const {
      productId,
      variantId,
      assetId,
      customisation,
      mockupUrl,
      quantity,
      qualityWarnings,
    } = parseResult.data

    // Create the configuration with quality warnings if present
    const fullCustomisation: Customisation = {
      ...customisation,
      ...(qualityWarnings && qualityWarnings.length > 0 && { qualityWarnings }),
    }

    // Create the configuration
    const configuration = await createConfiguration({
      sessionId,
      productId,
      variantId,
      assetId,
      customisation: fullCustomisation,
      mockupUrl,
    })

    // Add to cart
    const cartItem = await addToCart(sessionId, configuration.id, quantity)

    return data(
      {
        success: true,
        configurationId: configuration.id,
        cartItemId: cartItem.id,
        message: 'Added to basket',
      },
      {
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to cart'
    console.error('Add to cart error:', error)

    return data(
      { success: false, error: message },
      {
        status: 400,
        headers: { 'Set-Cookie': await commitSession(session) },
      }
    )
  }
}
