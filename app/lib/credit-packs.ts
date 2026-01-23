/**
 * Credit Pack Constants
 *
 * Defines the available credit packages for purchase.
 */

/**
 * Credit pack definition
 */
export interface CreditPack {
  /** Unique pack identifier */
  readonly id: string
  /** Number of credits in this pack */
  readonly credits: number
  /** Price in pence (GBP) */
  readonly pricePence: number
  /** Display name */
  readonly name: string
  /** Whether this is marked as the best value */
  readonly bestValue?: boolean
}

/**
 * Available credit packs for purchase
 */
export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'pack_100',
    credits: 100,
    pricePence: 499,
    name: '100 Credits',
  },
  {
    id: 'pack_250',
    credits: 250,
    pricePence: 999,
    name: '250 Credits',
  },
  {
    id: 'pack_700',
    credits: 700,
    pricePence: 1999,
    name: '700 Credits',
    bestValue: true,
  },
] as const

/**
 * Find a credit pack by ID
 *
 * @param packId - Pack ID to search for
 * @returns Credit pack or undefined if not found
 */
export function findCreditPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === packId)
}

/**
 * Validate if a pack ID exists
 *
 * @param packId - Pack ID to validate
 * @returns True if pack exists
 */
export function isValidPackId(packId: string): boolean {
  return CREDIT_PACKS.some((pack) => pack.id === packId)
}

/**
 * Format price in pence as pounds with currency symbol
 *
 * @param pence - Price in pence
 * @returns Formatted price string (e.g., "£4.99")
 */
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

/**
 * Calculate price per credit
 *
 * @param pack - Credit pack
 * @returns Price per credit in pence
 */
export function pricePerCredit(pack: CreditPack): number {
  return pack.pricePence / pack.credits
}
