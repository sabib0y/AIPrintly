/**
 * Single Product API Endpoint
 *
 * GET /api/products/:id - Get a single product by ID with variants
 *
 * Parameters:
 * - id: Product ID (required)
 *
 * Returns:
 * - 200: Product with variants
 * - 400: Missing product ID
 * - 404: Product not found
 * - 500: Server error
 */

import type { LoaderFunctionArgs } from 'react-router';
import { getProductById } from '~/services/products.server';

/**
 * Loader function for GET /api/products/:id
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  // Validate product ID is provided
  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Product ID is required',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Fetch product with variants
    const product = await getProductById(id, { includeInactive: false });

    // Return 404 if product not found
    if (!product) {
      return new Response(
        JSON.stringify({
          error: 'Product not found',
          id,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return product with caching headers
    return new Response(JSON.stringify(product), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
