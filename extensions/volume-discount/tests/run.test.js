import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartLinesDiscountsGenerateRun,
  parseTiers,
  pickTier,
  DEFAULT_TIERS,
} from "../src/cart_lines_discounts_generate_run.js";

const input = (lines, { classes = ["PRODUCT"], tiers = null } = {}) => ({
  cart: { lines },
  discount: {
    discountClasses: classes,
    metafield: tiers === null ? null : { value: JSON.stringify(tiers) },
  },
});

test("no discount below the lowest tier", () => {
  const out = cartLinesDiscountsGenerateRun(input([{ id: "l1", quantity: 2 }]));
  assert.deepEqual(out, { operations: [] });
});

test("applies the best qualifying default tier per line", () => {
  const out = cartLinesDiscountsGenerateRun(
    input([
      { id: "l1", quantity: 3 },
      { id: "l2", quantity: 12 },
    ]),
  );
  const { candidates, selectionStrategy } = out.operations[0].productDiscountsAdd;
  assert.equal(selectionStrategy, "ALL");
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].value.percentage.value, "5");
  assert.equal(candidates[1].value.percentage.value, "15");
  assert.deepEqual(candidates[1].targets, [{ cartLine: { id: "l2" } }]);
});

test("uses merchant tiers from the metafield", () => {
  const out = cartLinesDiscountsGenerateRun(
    input([{ id: "l1", quantity: 2 }], {
      tiers: [{ minQuantity: 2, percentage: 20 }],
    }),
  );
  assert.equal(
    out.operations[0].productDiscountsAdd.candidates[0].value.percentage.value,
    "20",
  );
});

test("does nothing when the discount is not a product discount", () => {
  const out = cartLinesDiscountsGenerateRun(
    input([{ id: "l1", quantity: 10 }], { classes: ["ORDER"] }),
  );
  assert.deepEqual(out, { operations: [] });
});

test("falls back to defaults on bad metafield data", () => {
  assert.deepEqual(parseTiers("not json").map((t) => t.minQuantity), [10, 5, 3]);
  assert.deepEqual(parseTiers('{"a":1}').length, DEFAULT_TIERS.length);
  assert.deepEqual(parseTiers('[{"minQuantity":0,"percentage":500}]').length, 3);
  assert.deepEqual(parseTiers(null).length, 3);
});

test("pickTier returns the highest tier reached", () => {
  const tiers = parseTiers(null);
  assert.equal(pickTier(5, tiers)?.percentage, 10);
  assert.equal(pickTier(1, tiers), undefined);
});
