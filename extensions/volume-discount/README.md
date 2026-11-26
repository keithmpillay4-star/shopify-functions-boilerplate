# Volume discount

Percentage off a cart line that grows with the quantity bought, for example 5% at 3+, 10% at 5+, 15% at 10+.

- **Target:** `cart.lines.discounts.generate.run`
- **Discount class:** product
- **Config:** optional JSON metafield on the discount, no redeploy needed

## How it works

1. Exits early unless the discount was created with the **product** class.
2. Reads tiers from the discount metafield `$app:volume-discount` / `tiers`. Invalid or missing data falls back to `DEFAULT_TIERS`, so a bad config can never break checkout.
3. For each cart line, picks the highest tier the quantity reaches.
4. Returns one `productDiscountsAdd` operation with a candidate per qualifying line (`selectionStrategy: "ALL"`).

## Configuration

Metafield `$app:volume-discount.tiers` (type `json`):

```json
[
  { "minQuantity": 3, "percentage": 5 },
  { "minQuantity": 10, "percentage": 15 }
]
```

Rules: `minQuantity` is a positive integer, `percentage` is above 0 and at most 100. Invalid entries are dropped.

## Example

Input (simplified):

```json
{
  "cart": { "lines": [{ "id": "gid://shopify/CartLine/1", "quantity": 5 }] },
  "discount": { "discountClasses": ["PRODUCT"], "metafield": null }
}
```

Output:

```json
{
  "operations": [{
    "productDiscountsAdd": {
      "selectionStrategy": "ALL",
      "candidates": [{
        "message": "10% off when you buy 5+",
        "targets": [{ "cartLine": { "id": "gid://shopify/CartLine/1" } }],
        "value": { "percentage": { "value": "10" } }
      }]
    }
  }]
}
```

## Test

```bash
npm test
```
