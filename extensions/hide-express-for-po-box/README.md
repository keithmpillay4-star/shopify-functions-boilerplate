# Hide express for PO Box

Hides express, courier and overnight delivery options when the shipping address is a PO Box or private bag.

- **Target:** `cart.delivery-options.transform.run`
- **Why:** couriers rarely deliver to PO Boxes, so offering express leads to failed deliveries and support tickets.

## How it works

1. For each delivery group, tests `deliveryAddress.address1` against `PO_BOX_PATTERN` (PO Box, P.O. Box, Post Office Box, Private Bag).
2. For PO Box addresses, hides every option whose title matches `HIDE_KEYWORD` (`express`, `courier`, `overnight`).
3. Returns a `deliveryOptionHide` operation per hidden option.

## Example output

```json
{
  "operations": [
    { "deliveryOptionHide": { "deliveryOptionHandle": "express-courier-handle" } }
  ]
}
```

## Customising

- Edit `PO_BOX_PATTERN` for your market's wording (for example "Postbus" in NL).
- Edit `HIDE_KEYWORD` to match your own shipping rate names.
- The same operations list can also contain `deliveryOptionRename` and `deliveryOptionMove` entries.

## Test

```bash
npm test
```
