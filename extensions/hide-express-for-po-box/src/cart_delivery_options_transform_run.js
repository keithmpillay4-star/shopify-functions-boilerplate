// @ts-check

/**
 * Delivery customization: hide express options for PO Box addresses and
 * rename a shipping rate.
 *
 * Target: cart.delivery-options.transform.run
 *
 * Couriers usually cannot deliver express or courier services to a PO Box,
 * so offering them leads to failed deliveries and support tickets.
 */

/** Matches "PO Box", "P.O. Box", "Post Office Box", "Private Bag" (case-insensitive). */
export const PO_BOX_PATTERN =
  /\b(p\.?\s?o\.?\s?box|post\s+office\s+box|private\s+bag)\b/i;

/** Delivery option titles containing this text are hidden for PO Boxes. */
export const HIDE_KEYWORD = /express|courier|overnight/i;

/**
 * @param {string | null | undefined} address1
 */
export function isPoBox(address1) {
  return !!address1 && PO_BOX_PATTERN.test(address1);
}

/**
 * @param {any} input Result of cart_delivery_options_transform_run.graphql
 */
export function cartDeliveryOptionsTransformRun(input) {
  const operations = [];

  for (const group of input.cart.deliveryGroups) {
    const poBox = isPoBox(group.deliveryAddress?.address1);

    for (const option of group.deliveryOptions) {
      if (poBox && option.title && HIDE_KEYWORD.test(option.title)) {
        operations.push({
          deliveryOptionHide: { deliveryOptionHandle: option.handle },
        });
      }
    }
  }

  return { operations };
}
