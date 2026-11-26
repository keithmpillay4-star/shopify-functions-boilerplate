import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartLinesDiscountsGenerateRun,
  parsePercentage,
  DEFAULT_PERCENTAGE,
} from "../src/cart_lines_discounts_generate_run.js";

const input = ({
  customer = { isWholesale: true },
  classes = ["ORDER"],
  percentage = null,
} = {}) => ({
  cart: { buyerIdentity: customer === undefined ? undefined : { customer } },
  discount: {
    discountClasses: classes,
    metafield: percentage === null ? null : { value: String(percentage) },
  },
});

test("discounts the whole order for tagged customers", () => {
  const out = cartLinesDiscountsGenerateRun(input());
  const add = out.operations[0].orderDiscountsAdd;
  assert.equal(add.selectionStrategy, "FIRST");
  assert.equal(add.candidates[0].value.percentage.value, String(DEFAULT_PERCENTAGE));
  assert.deepEqual(add.candidates[0].targets, [
    { orderSubtotal: { excludedCartLineIds: [] } },
  ]);
});

test("uses the merchant percentage", () => {
  const out = cartLinesDiscountsGenerateRun(input({ percentage: 25 }));
  assert.equal(
    out.operations[0].orderDiscountsAdd.candidates[0].value.percentage.value,
    "25",
  );
});

test("no discount for customers without the tag", () => {
  const out = cartLinesDiscountsGenerateRun(input({ customer: { isWholesale: false } }));
  assert.deepEqual(out, { operations: [] });
});

test("no discount for guests", () => {
  assert.deepEqual(cartLinesDiscountsGenerateRun(input({ customer: null })), { operations: [] });
  // No buyerIdentity at all.
  const noIdentity = { cart: {}, discount: { discountClasses: ["ORDER"], metafield: null } };
  assert.deepEqual(cartLinesDiscountsGenerateRun(noIdentity), { operations: [] });
});

test("does nothing when the discount is not an order discount", () => {
  const out = cartLinesDiscountsGenerateRun(input({ classes: ["PRODUCT"] }));
  assert.deepEqual(out, { operations: [] });
});

test("falls back to the default on bad percentages", () => {
  for (const bad of ["abc", "0", "-5", "101", "", null]) {
    assert.equal(parsePercentage(bad), DEFAULT_PERCENTAGE, String(bad));
  }
  assert.equal(parsePercentage("20"), 20);
});
