/**
 * Format price in cents to MWK (Malawi Kwacha)
 * @param {number} priceCents - Price in cents
 * @returns {string} Formatted price with MWK symbol
 */
export function formatMWK(priceCents) {
  const kwacha = (priceCents / 100).toFixed(2)
  return `MK${kwacha}`
}

/**
 * Get just the numeric value in MWK
 * @param {number} priceCents - Price in cents
 * @returns {string} Numeric value
 */
export function getMWKValue(priceCents) {
  return (priceCents / 100).toFixed(2)
}
