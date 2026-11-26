# Hide COD on high-value carts

Hides the Cash on Delivery payment method when the cart total is above a limit, so risky high-value orders must be prepaid.

- **Target:** `cart.payment-methods.transform.run`

## How it works

1. Reads `cart.cost.totalAmount.amount` and compares it to `COD_MAX_TOTAL` (default `1000`).
2. At or below the limit, or if the total is unreadable, it returns no operations and checkout is unchanged.
3. Above the limit, it hides every payment method whose name matches `COD_PATTERN` ("Cash on Delivery" or "COD").

## Example output

```json
{
  "operations": [
    { "paymentMethodHide": { "paymentMethodId": "gid://shopify/PaymentCustomizationPaymentMethod/2" } }
  ]
}
```

## Customising

- Change `COD_MAX_TOTAL` in `src/cart_payment_methods_transform_run.js`. It is in the cart's presentment currency, so adjust if you sell in several currencies.
- Change `COD_PATTERN` to match the exact name of your manual payment method.
- Other operations available in this target: `paymentMethodRename` and `paymentMethodMove`.

## Test

```bash
npm test
```
