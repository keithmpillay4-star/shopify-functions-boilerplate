# Wholesale tag discount

Gives a percentage off the whole order to customers carrying a tag such as `wholesale`. Handy for B2B pricing, VIP members or staff discounts, managed entirely with customer tags in the Shopify admin.

- **Target:** `cart.lines.discounts.generate.run`
- **Discount class:** order
- **Config:** optional metafield for the percentage

## How it works

1. Exits early unless the discount was created with the **order** class.
2. Checks `buyerIdentity.customer.hasAnyTag(tag: "wholesale")`, aliased to `isWholesale`. Guests have no customer, so they never qualify.
3. Reads the percentage from the metafield `$app:wholesale` / `percentage`. Missing or invalid values fall back to `DEFAULT_PERCENTAGE` (15).
4. Returns one `orderDiscountsAdd` operation targeting the order subtotal.

## Configuration

- **Tag:** change `"wholesale"` in `src/cart_lines_discounts_generate_run.graphql`.
- **Percentage:** set the metafield `$app:wholesale.percentage` on the discount, for example `20`.
- **Customers:** add the tag to a customer in the Shopify admin. The customer must be logged in at checkout.

## Example output

```json
{
  "operations": [{
    "orderDiscountsAdd": {
      "selectionStrategy": "FIRST",
      "candidates": [{
        "message": "Wholesale pricing: 20% off",
        "targets": [{ "orderSubtotal": { "excludedCartLineIds": [] } }],
        "value": { "percentage": { "value": "20" } }
      }]
    }
  }]
}
```

## Customising

- Exclude lines (for example already-discounted items) by listing their IDs in `excludedCartLineIds`.
- To support several tiers (`wholesale`, `vip`), query each tag with its own alias and pick the highest percentage in the JS.

## Test

```bash
npm test
```
