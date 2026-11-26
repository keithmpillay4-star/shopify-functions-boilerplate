import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartValidationsGenerateRun,
  MAX_QUANTITY_PER_LINE,
} from "../src/cart_validations_generate_run.js";

const line = (quantity, title = "Tote Bag") => ({
  quantity,
  merchandise: { __typename: "ProductVariant", product: { title } },
});

test("allows a cart at or under the limit", () => {
  const out = cartValidationsGenerateRun({
    cart: { lines: [line(1), line(MAX_QUANTITY_PER_LINE)] },
  });
  assert.deepEqual(out, { operations: [] });
});

test("blocks a line over the limit with a named message", () => {
  const out = cartValidationsGenerateRun({
    cart: { lines: [line(MAX_QUANTITY_PER_LINE + 1, "Duffel")] },
  });
  const errors = out.operations[0].validationAdd.errors;
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Duffel/);
  assert.equal(errors[0].target, "$.cart");
});

test("reports one error per offending line", () => {
  const out = cartValidationsGenerateRun({
    cart: { lines: [line(11, "A"), line(2, "B"), line(50, "C")] },
  });
  assert.equal(out.operations[0].validationAdd.errors.length, 2);
});

test("handles non-variant merchandise", () => {
  const out = cartValidationsGenerateRun({
    cart: { lines: [{ quantity: 99, merchandise: { __typename: "CustomProduct" } }] },
  });
  assert.match(out.operations[0].validationAdd.errors[0].message, /this item/);
});
