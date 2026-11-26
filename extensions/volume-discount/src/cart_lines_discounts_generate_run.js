// @ts-check

/**
 * Volume discount: buy more of the same line, get a bigger percentage off.
 *
 * Target: cart.lines.discounts.generate.run
 *
 * Tiers come from the discount's metafield (JSON) so merchants can change them
 * without redeploying. If the metafield is missing or invalid we fall back to
 * DEFAULT_TIERS, so the function never crashes checkout.
 *
 * Metafield: namespace "$app:volume-discount", key "tiers", type json.
 * Example value:
 *   [{ "minQuantity": 3, "percentage": 5 }, { "minQuantity": 10, "percentage": 15 }]
 */

/**
 * @typedef {{ minQuantity: number, percentage: number }} Tier
 */

/** @type {Tier[]} Used when the merchant has not configured tiers. */
export const DEFAULT_TIERS = [
  { minQuantity: 3, percentage: 5 },
  { minQuantity: 5, percentage: 10 },
  { minQuantity: 10, percentage: 15 },
];

/**
 * Parse and validate the tiers metafield. Returns tiers sorted from the
 * highest minQuantity to the lowest, so the first match is the best tier.
 *
 * @param {string | null | undefined} raw JSON string from the metafield
 * @returns {Tier[]}
 */
export function parseTiers(raw) {
  if (!raw) return sortTiers(DEFAULT_TIERS);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return sortTiers(DEFAULT_TIERS);
    const valid = parsed.filter(
      (t) =>
        t &&
        Number.isInteger(t.minQuantity) &&
        t.minQuantity > 0 &&
        typeof t.percentage === "number" &&
        t.percentage > 0 &&
        t.percentage <= 100,
    );
    return valid.length ? sortTiers(valid) : sortTiers(DEFAULT_TIERS);
  } catch {
    return sortTiers(DEFAULT_TIERS);
  }
}

/** @param {Tier[]} tiers */
function sortTiers(tiers) {
  return [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
}

/**
 * Best tier the quantity qualifies for, or undefined.
 *
 * @param {number} quantity
 * @param {Tier[]} tiers sorted by minQuantity descending
 */
export function pickTier(quantity, tiers) {
  return tiers.find((t) => quantity >= t.minQuantity);
}

/**
 * @param {any} input Result of cart_lines_discounts_generate_run.graphql
 */
export function cartLinesDiscountsGenerateRun(input) {
  // Only run if the merchant created this as a product discount.
  if (!input.discount.discountClasses.includes("PRODUCT")) {
    return { operations: [] };
  }

  const tiers = parseTiers(input.discount.metafield?.value);

  const candidates = [];
  for (const line of input.cart.lines) {
    const tier = pickTier(line.quantity, tiers);
    if (!tier) continue;
    candidates.push({
      message: `${tier.percentage}% off when you buy ${tier.minQuantity}+`,
      targets: [{ cartLine: { id: line.id } }],
      // Decimal values are sent as strings.
      value: { percentage: { value: String(tier.percentage) } },
    });
  }

  if (candidates.length === 0) return { operations: [] };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          // ALL: every qualifying line gets its own discount.
          selectionStrategy: "ALL",
        },
      },
    ],
  };
}
