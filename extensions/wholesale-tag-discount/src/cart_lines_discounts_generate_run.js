// @ts-check

/**
 * Wholesale discount: a percentage off the whole order for customers who
 * carry a specific tag (default "wholesale").
 *
 * Target: cart.lines.discounts.generate.run
 *
 * The customer tag is set in the Shopify admin (Customers > tags), so this
 * works for B2B pricing, VIP members or staff discounts without an app UI.
 *
 * Metafield: namespace "$app:wholesale", key "percentage", type number_integer
 * or json. Example value: 20
 */

/** Used when the metafield is missing or invalid. */
export const DEFAULT_PERCENTAGE = 15;

/**
 * Accepts "20", 20 or a JSON string; returns a percentage in (0, 100].
 *
 * @param {string | null | undefined} raw
 * @returns {number}
 */
export function parsePercentage(raw) {
  if (raw === null || raw === undefined || raw === "") return DEFAULT_PERCENTAGE;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 100
    ? value
    : DEFAULT_PERCENTAGE;
}

/**
 * @param {any} input Result of cart_lines_discounts_generate_run.graphql
 */
export function cartLinesDiscountsGenerateRun(input) {
  // Only run if the merchant created this as an order discount.
  if (!input.discount.discountClasses.includes("ORDER")) {
    return { operations: [] };
  }

  // Guests have no customer, so buyerIdentity.customer is null.
  const isWholesale = input.cart.buyerIdentity?.customer?.isWholesale === true;
  if (!isWholesale) return { operations: [] };

  const percentage = parsePercentage(input.discount.metafield?.value);

  return {
    operations: [
      {
        orderDiscountsAdd: {
          candidates: [
            {
              message: `Wholesale pricing: ${percentage}% off`,
              // Apply to the whole order subtotal, excluding nothing.
              targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
              value: { percentage: { value: String(percentage) } },
            },
          ],
          // FIRST: take the single best candidate for the order.
          selectionStrategy: "FIRST",
        },
      },
    ],
  };
}
