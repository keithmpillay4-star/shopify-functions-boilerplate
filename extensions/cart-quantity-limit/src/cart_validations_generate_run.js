// @ts-check

/**
 * Cart validation: cap how many units of a single line can be bought.
 *
 * Target: cart.validations.generate.run
 *
 * If any line exceeds MAX_QUANTITY_PER_LINE, checkout is blocked and the
 * customer sees an error message. Useful for limited drops, wholesale caps
 * or reselling protection.
 */

export const MAX_QUANTITY_PER_LINE = 10;

/**
 * @param {any} input Result of cart_validations_generate_run.graphql
 */
export function cartValidationsGenerateRun(input) {
  const errors = [];

  for (const line of input.cart.lines) {
    if (line.quantity > MAX_QUANTITY_PER_LINE) {
      const name =
        line.merchandise?.__typename === "ProductVariant"
          ? line.merchandise.product.title
          : "this item";
      errors.push({
        message: `You can buy at most ${MAX_QUANTITY_PER_LINE} of ${name}. Please reduce the quantity.`,
        // "$.cart" shows the error at cart level. Use a more specific path
        // to attach it to a field if you need to.
        target: "$.cart",
      });
    }
  }

  return {
    operations: errors.length ? [{ validationAdd: { errors } }] : [],
  };
}
