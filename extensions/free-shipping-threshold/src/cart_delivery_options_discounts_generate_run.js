// @ts-check

/**
 * Free shipping over a spend threshold.
 *
 * Target: cart.delivery-options.discounts.generate.run
 *
 * When the cart subtotal reaches the threshold, every delivery group gets a
 * 100% shipping discount. The threshold comes from the discount's metafield
 * so merchants can change it without a redeploy.
 *
 * Metafield: namespace "$app:free-shipping", key "threshold", type json.
 * Example value: { "minimumSubtotal": 75 }
 */

/** Used when the metafield is missing or invalid. */
export const DEFAULT_MINIMUM_SUBTOTAL = 100;

/**
 * @param {string | null | undefined} raw JSON string from the metafield
 * @returns {number}
 */
export function parseThreshold(raw) {
  if (!raw) return DEFAULT_MINIMUM_SUBTOTAL;
  try {
    const value = JSON.parse(raw)?.minimumSubtotal;
    return typeof value === "number" && value > 0
      ? value
      : DEFAULT_MINIMUM_SUBTOTAL;
  } catch {
    return DEFAULT_MINIMUM_SUBTOTAL;
  }
}

/**
 * @param {any} input Result of cart_delivery_options_discounts_generate_run.graphql
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  // Only run if the merchant created this as a shipping discount.
  if (!input.discount.discountClasses.includes("SHIPPING")) {
    return { operations: [] };
  }

  const subtotal = parseFloat(input.cart.cost.subtotalAmount.amount);
  const threshold = parseThreshold(input.discount.metafield?.value);

  if (!Number.isFinite(subtotal) || subtotal < threshold) {
    return { operations: [] };
  }

  const candidates = input.cart.deliveryGroups.map((group) => ({
    message: `Free shipping on orders over ${threshold}`,
    targets: [{ deliveryGroup: { id: group.id } }],
    value: { percentage: { value: "100" } },
  }));

  if (candidates.length === 0) return { operations: [] };

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates,
          selectionStrategy: "ALL",
        },
      },
    ],
  };
}
