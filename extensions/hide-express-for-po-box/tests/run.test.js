import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartDeliveryOptionsTransformRun,
  isPoBox,
} from "../src/cart_delivery_options_transform_run.js";

const group = (address1, titles) => ({
  deliveryAddress: address1 === undefined ? null : { address1 },
  deliveryOptions: titles.map((title, i) => ({ handle: `h${i}`, title })),
});

test("detects common PO Box spellings", () => {
  for (const a of ["PO Box 123", "P.O. Box 9", "p o box 5", "Post Office Box 7", "Private Bag X1"]) {
    assert.equal(isPoBox(a), true, a);
  }
  for (const a of ["12 Main Street", "Boxwood Lane 4", "", null, undefined]) {
    assert.equal(isPoBox(a), false, String(a));
  }
});

test("hides express and courier options for a PO Box", () => {
  const out = cartDeliveryOptionsTransformRun({
    cart: {
      deliveryGroups: [group("PO Box 42", ["Standard", "Express Courier", "Overnight"])],
    },
  });
  assert.deepEqual(out.operations, [
    { deliveryOptionHide: { deliveryOptionHandle: "h1" } },
    { deliveryOptionHide: { deliveryOptionHandle: "h2" } },
  ]);
});

test("leaves street addresses alone", () => {
  const out = cartDeliveryOptionsTransformRun({
    cart: { deliveryGroups: [group("1 High Street", ["Standard", "Express"])] },
  });
  assert.deepEqual(out, { operations: [] });
});

test("handles a missing delivery address", () => {
  const out = cartDeliveryOptionsTransformRun({
    cart: { deliveryGroups: [group(undefined, ["Express"])] },
  });
  assert.deepEqual(out, { operations: [] });
});
