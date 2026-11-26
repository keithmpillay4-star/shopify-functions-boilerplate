// @ts-check

/**
 * Payment customization: hide Cash on Delivery for high-value carts.
 *
 * Target: cart.payment-methods.transform.run
 *
 * COD orders above a threshold carry a high risk of refusal at the door,
 * so we only offer prepaid methods once the cart total passes the limit.
 */

/** Cart total (in the shop's presentment currency) above which COD is hidden. */
export const COD_MAX_TOTAL = 1000;

/** Matches payment method names such as "Cash on Delivery" or "COD". */
export const COD_PATTERN = /cash\s+on\s+delivery|\bcod\b/i;

/**
 * @param {any} input Result of cart_payment_methods_transform_run.graphql
 */
export function cartPaymentMethodsTransformRun(input) {
  const total = parseFloat(input.cart.cost.totalAmount.amount);

  if (!Number.isFinite(total) || total <= COD_MAX_TOTAL) {
    return { operations: [] };
  }

  const operations = input.paymentMethods
    .filter((method) => COD_PATTERN.test(method.name))
    .map((method) => ({ paymentMethodHide: { paymentMethodId: method.id } }));

  return { operations };
}
