# Cart quantity limit

Blocks checkout when any single cart line has more than a set number of units, and tells the customer why.

- **Target:** `cart.validations.generate.run`
- **Use cases:** limited drops, wholesale caps, reseller protection

## How it works

1. Loops over `cart.lines`.
2. For each line above `MAX_QUANTITY_PER_LINE` (default `10`), adds an error naming the product.
3. Returns one `validationAdd` operation holding all errors, or no operations if the cart is fine.

## Example output

```json
{
  "operations": [{
    "validationAdd": {
      "errors": [{
        "message": "You can buy at most 10 of Duffel. Please reduce the quantity.",
        "target": "$.cart"
      }]
    }
  }]
}
```

## Important: enable blocking

Shopify only stops checkout if the validation is set to block on failure. When you create the validation (in the admin, or with the `validationCreate` mutation), set `blockOnFailure: true`. Otherwise errors are logged but the customer can still check out.

## Customising

- Change `MAX_QUANTITY_PER_LINE` in `src/cart_validations_generate_run.js`.
- To make the limit per product, add a product metafield to the input query and read it per line.
- A validation error blocks checkout progress, so keep messages short and actionable.

## Test

```bash
npm test
```
