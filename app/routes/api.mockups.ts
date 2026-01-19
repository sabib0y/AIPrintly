/**
 * Mockups API Endpoint
 *
 * POST /api/mockups - Generate a product mockup
 *
 * Request Body:
 * - productId: Product ID
 * - variantId: Variant ID
 * - assetId: Asset ID
 * - customisation: { position: { x, y }, scale, rotation }
 *
 * Returns:
 * - 200: Generated mockup result
 * - 400: Invalid request body
 * - 404: Product/variant/asset not found
 * - 500: Server error
 */

import type { ActionFunctionArgs } from 'react-router';
import { generateMockup, validateMockupQuality, type MockupRequest } from '~/services/mockup.server';
import { z } from 'zod';

/**
 * Request body schema for mockup generation
 */
const mockupRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID'),
  assetId: z.string().uuid('Invalid asset ID'),
  customisation: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    scale: z.number().positive().max(10),
    rotation: z.number().min(0).max(360),
  }),
  options: z
    .object({
      highResolution: z.boolean().optional(),
      view: z.enum(['front', 'back', 'side', 'all']).optional(),
      backgroundColor: z.string().optional(),
      validateQuality: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Action function for POST /api/mockups
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const parseResult = mockupRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = parseResult.data;
    const mockupRequest: MockupRequest = {
      productId: data.productId,
      variantId: data.variantId,
      assetId: data.assetId,
      customisation: data.customisation,
    };

    // Optionally validate quality before generating
    if (data.options?.validateQuality) {
      // Get product external ID for quality validation
      // This would typically come from database lookup
      const qualityValidation = await validateMockupQuality(
        data.assetId,
        '', // Would need product external ID
        data.customisation
      );

      if (!qualityValidation.isValid) {
        return new Response(
          JSON.stringify({
            error: 'Quality validation failed',
            validation: qualityValidation,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generate mockup
    const result = await generateMockup(mockupRequest, data.options);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating mockup:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Resource not found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        error: 'Failed to generate mockup',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Loader function for GET /api/mockups/preview (handled separately)
 * This would serve cached mockup previews
 */
export async function loader() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to generate mockups.' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
