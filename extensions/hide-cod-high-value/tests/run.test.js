import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartPaymentMethodsTransformRun,
  COD_MAX_TOTAL,
} from "../src/cart_payment_methods_transform_run.js";

const methods = [
  { id: "pm1", name: "Credit card" },
  { id: "pm2", name: "Cash on Delivery (COD)" },
  { id: "pm3", name: "PayPal" },
];

const input = (amount) => ({
  cart: { cost: { totalAmount: { amount: String(amount) } } },
  paymentMethods: methods,
});

test("hides COD above the threshold", () => {
  const out = cartPaymentMethodsTransformRun(input(COD_MAX_TOTAL + 0.01));
  assert.deepEqual(out.operations, [{ paymentMethodHide: { paymentMethodId: "pm2" } }]);
});

test("keeps COD at or below the threshold", () => {
  assert.deepEqual(cartPaymentMethodsTransformRun(input(COD_MAX_TOTAL)), { operations: [] });
  assert.deepEqual(cartPaymentMethodsTransformRun(input(50)), { operations: [] });
});

test("never hides non-COD methods", () => {
  const out = cartPaymentMethodsTransformRun(input(5000));
  assert.equal(out.operations.length, 1);
  assert.notEqual(out.operations[0].paymentMethodHide.paymentMethodId, "pm1");
});

test("ignores an unparseable total", () => {
  assert.deepEqual(cartPaymentMethodsTransformRun(input("abc")), { operations: [] });
});
