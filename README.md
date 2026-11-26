# Shopify Functions Examples

Small, readable, tested [Shopify Functions](https://shopify.dev/docs/apps/build/functions) written in JavaScript. Each one solves a real store problem, is commented line by line where it matters, and ships with unit tests you can run with plain Node (no Shopify CLI needed).

| Function | Target | What it does |
|---|---|---|
| [volume-discount](extensions/volume-discount) | `cart.lines.discounts.generate.run` | Bigger percentage off as quantity rises, tiers configurable via metafield |
| [cart-quantity-limit](extensions/cart-quantity-limit) | `cart.validations.generate.run` | Blocks checkout when a line exceeds a maximum quantity |
| [hide-express-for-po-box](extensions/hide-express-for-po-box) | `cart.delivery-options.transform.run` | Hides express and courier rates for PO Box addresses |
| [hide-cod-high-value](extensions/hide-cod-high-value) | `cart.payment-methods.transform.run` | Hides Cash on Delivery above a cart total |
| [free-shipping-threshold](extensions/free-shipping-threshold) | `cart.delivery-options.discounts.generate.run` | Free shipping once the cart subtotal reaches a threshold (shipping discount) |
| [wholesale-tag-discount](extensions/wholesale-tag-discount) | `cart.lines.discounts.generate.run` | Percentage off the whole order for customers with a `wholesale` tag (order discount) |

## Structure

Every function follows the same layout:

```
extensions/<name>/
  shopify.extension.toml   extension config: target, input query, export
  src/<target>.js          the function: pure input -> output
  src/<target>.graphql     the data the function asks Shopify for
  tests/run.test.js        unit tests (node:test)
  README.md                how it works, example output, how to customise
```

A Shopify Function is a pure function. Shopify runs your GraphQL query, passes the result in as `input`, and applies the `operations` you return. Because the logic is pure, it is easy to test without a store.

## Run the tests

```bash
npm test           # unit tests for every function
npm run validate   # checks config, query file and export names agree
```

Requires Node 20 or newer. There are no dependencies.

These checks cover the logic and the project wiring. They do not compile to WebAssembly or check the GraphQL against Shopify's schema: use `shopify app function run` in your app for that.

## Use one in your app

1. In your app, generate a function of the matching type:
   `shopify app generate extension` and choose the function type (discount, cart validation, delivery customization or payment customization).
2. Copy the `src/*.js` and `src/*.graphql` files from the example over the generated ones, matching the file names the generator created.
3. Keep the generated `shopify.extension.toml` if it differs from the example. Its `export` and `input_query` paths must match your files.
4. `shopify app deploy`, then activate the function in the Shopify admin (for example, create the discount, or add the customization).

## Notes

- Examples target API version `2025-07`. Check the [Functions reference](https://shopify.dev/docs/api/functions) if you use a newer version, as field names occasionally change between versions.
- The `.toml` files here are reference configs. The generator's version is authoritative for build settings.
- Defaults like thresholds and keywords are constants at the top of each file, with a note on where to change them.

## License

MIT
