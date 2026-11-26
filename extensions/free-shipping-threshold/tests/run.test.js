import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartDeliveryOptionsDiscountsGenerateRun,
  parseThreshold,
  DEFAULT_MINIMUM_SUBTOTAL,
} from "../src/cart_delivery_options_discounts_generate_run.js";

const input = (
  subtotal,
  { classes = ["SHIPPING"], threshold = null, groups = ["g1"] } = {},
) => ({
  cart: {
    cost: { subtotalAmount: { amount: String(subtotal) } },
    deliveryGroups: groups.map((id) => ({ id })),
  },
  discount: {
    discountClasses: classes,
    metafield:
      threshold === null
        ? null
        : { value: JSON.stringify({ minimumSubtotal: threshold }) },
  },
});

test("no discount below the default threshold", () => {
  const out = cartDeliveryOptionsDiscountsGenerateRun(input(99.99));
  assert.deepEqual(out, { operations: [] });
});

test("100% shipping discount at the threshold", () => {
  const out = cartDeliveryOptionsDiscountsGenerateRun(input(DEFAULT_MINIMUM_SUBTOTAL));
  const { candidates } = out.operations[0].deliveryDiscountsAdd;
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].value.percentage.value, "100");
  assert.deepEqual(candidates[0].targets, [{ deliveryGroup: { id: "g1" } }]);
});

test("uses the merchant threshold", () => {
  assert.deepEqual(
    cartDeliveryOptionsDiscountsGenerateRun(input(60, { threshold: 75 })),
    { operations: [] },
  );
  const out = cartDeliveryOptionsDiscountsGenerateRun(input(80, { threshold: 75 }));
  assert.equal(out.operations[0].deliveryDiscountsAdd.candidates.length, 1);
});

test("discounts every delivery group", () => {
  const out = cartDeliveryOptionsDiscountsGenerateRun(input(500, { groups: ["a", "b"] }));
  assert.equal(out.operations[0].deliveryDiscountsAdd.candidates.length, 2);
});

test("does nothing when the discount is not a shipping discount", () => {
  const out = cartDeliveryOptionsDiscountsGenerateRun(input(500, { classes: ["PRODUCT"] }));
  assert.deepEqual(out, { operations: [] });
});

test("falls back to the default on bad metafield data", () => {
  assert.equal(parseThreshold("nope"), DEFAULT_MINIMUM_SUBTOTAL);
  assert.equal(parseThreshold('{"minimumSubtotal":-5}'), DEFAULT_MINIMUM_SUBTOTAL);
  assert.equal(parseThreshold(null), DEFAULT_MINIMUM_SUBTOTAL);
  assert.equal(parseThreshold('{"minimumSubtotal":40}'), 40);
});
