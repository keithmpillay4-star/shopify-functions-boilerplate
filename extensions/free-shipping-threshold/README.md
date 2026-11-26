# Free shipping threshold

Gives free shipping once the cart subtotal reaches a set amount. One of the most common conversion boosters in e-commerce, and a good example of a **shipping discount** function.

- **Target:** `cart.delivery-options.discounts.generate.run`
- **Discount class:** shipping
- **Config:** optional JSON metafield on the discount, no redeploy needed

## How it works

1. Exits early unless the discount was created with the **shipping** class.
2. Reads the threshold from the metafield `$app:free-shipping` / `threshold`. Missing or invalid data falls back to `DEFAULT_MINIMUM_SUBTOTAL` (100).
3. Compares `cart.cost.subtotalAmount` to the threshold.
4. At or above it, returns a `deliveryDiscountsAdd` operation with a 100% candidate for every delivery group.

## Configuration

Metafield `$app:free-shipping.threshold` (type `json`):

```json
{ "minimumSubtotal": 75 }
```

The value is in the cart's presentment currency.

## Example output

```json
{
  "operations": [{
    "deliveryDiscountsAdd": {
      "selectionStrategy": "ALL",
      "candidates": [{
        "message": "Free shipping on orders over 75",
        "targets": [{ "deliveryGroup": { "id": "gid://shopify/CartDeliveryGroup/0" } }],
        "value": { "percentage": { "value": "100" } }
      }]
    }
  }]
}
```

## Customising

- Use a percentage below 100 for a shipping *discount* rather than free shipping.
- Use `subtotalAmount` (before discounts, as here) or `totalAmount` depending on whether you want the threshold to include other discounts.
- Add a `deliveryAddress { countryCode }` field to the query to limit free shipping to certain countries.

## Test

```bash
npm test
```
