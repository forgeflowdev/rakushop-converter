ForgeFlow v3.9.0 GA4

# ForgeFlow - RakShop Converter

Rakuten CSV → Shopify CSV converter.

Website: https://forgeflowtools.com

Status: Beta

## v3.9.0 - Google Analytics 4
- Added Google tag to all public HTML pages.
- Measurement ID: G-BM155CWDQR
- Updated Privacy Policy to disclose Google Analytics usage.
- No converter logic, license API, checkout URL, or plan-limit behavior changed.

## v3.8.9 - Lemon Squeezy Merchant of Record alignment
- Clarified that Lemon Squeezy processes Standard purchases as Merchant of Record.
- Clarified ForgeFlow's role as the product/Supplier and license provider.
- Aligned refund wording with Lemon Squeezy's Merchant of Record and refund/chargeback process.
- Added a concise payment/MoR notice below the pricing cards.
- No converter logic, license API, checkout URL, or plan-limit behavior changed.

## v3.8.8 - Legal pages update
- Expanded Terms of Service for Free/Standard plan terms, license conditions, payments, refunds, prohibited use, disclaimers, and service changes.
- Expanded Privacy Policy to accurately describe browser-only CSV processing, license activation data, localStorage, Cloudflare Worker, and Lemon Squeezy checkout.
- No converter, license API, checkout URL, or plan-limit behavior changed.

## v3 changes
- Correct variant handling
- Auto-clean Japanese price formatting
- Classify Error / Warning / Auto-fix / Info
- Disable conversion while fatal errors remain

## v3.1 changes
- Exact `SKU` header is prioritized over `商品管理番号`
- `商品管理番号` remains the preferred Handle source
- v3 validation and auto-fix behavior is unchanged

## v3.2 changes
- Add a clear Shopify CSV review step directly below validation
- Remove the easy-to-miss conversion button from the upper status card
- Show preview row count
- Smooth-scroll to the generated preview
- Keep download action inside the preview card

## v3.3 changes
- Output headers now follow the uploaded Shopify official template exactly (57 columns)
- Export uses `URL handle`, `Description`, `SKU`, `Price`, `Inventory quantity`, and other current template columns when present
- CSV column order matches Shopify official `product_template.csv`
- Existing Rakuten parsing, validation, preview, and Free 20-product limit remain unchanged

## v3.4 changes
- Sanitize Shopify option names and values
- Replace unsupported slash separator sequences such as `カラー / サイズ` with `カラー・サイズ`
- Show these changes as Auto-fix messages during validation
- Keep Shopify official 57-column export from v3.3

## v3.5 changes
- Fixed Shopify current inventory-policy field mapping.
- Writes `DENY` to `Continue selling when out of stock`, matching the uploaded official Shopify 57-column sample.
- Keeps backward-compatible aliases for older Shopify CSV formats.

## v3.6 changes
- Shopify products default to Draft / unpublished for safer migration testing.
- Combined Rakuten options such as `カラー・サイズ` + `ブラック・M` are split into Shopify Option1/Option2 when the part counts match.
- Supports up to 3 split options.
- Invalid/non-http(s) image URLs are omitted from Shopify output instead of being sent as broken media references.
- Retains v3.5 inventory-policy compatibility.

## v3.6.1 hotfix
- Shopify `Published on online store` now outputs `FALSE`.
- Shopify `Status` now outputs `draft`.
- This fixes test imports appearing as Active / published.

## v3.6.2 hotfix
- Fixed validation summary counters.
- Error / Warning / Auto-fix / Info counts are now recalculated directly from the displayed issue list.
- No converter or Shopify export behavior changed.

## v3.7 - Rakuten RMS SKU compatibility
- Prioritizes `商品管理番号（商品URL）` as Shopify Handle.
- Prioritizes `システム連携用SKU番号` as Shopify SKU.
- Supports RMS `バリエーション項目名1/2/3` and `バリエーション項目選択肢1/2/3`.
- Keeps one Rakuten product grouped as one Shopify product with multiple variants.
- Prioritizes `SKU画像パス`, with fallback to `商品画像パス1`.
- Prioritizes `PC用商品説明文` / `スマートフォン用商品説明文`.
- Retains Draft / unpublished safety behavior and v3.6.2 validation.

## v3.7.1 - RMS SKU priority fix
- Fixes auto-mapping priority so candidate order is actually respected.
- Shopify SKU now prefers `システム連携用SKU番号`.
- Falls back to `SKU`, then `SKU管理番号` when the preferred column is unavailable.
- Keeps the v3.7 RMS Handle and multi-variation mappings unchanged.

## v3.7.2 - Current Shopify product CSV headers
- Aligns generated CSV column names with Shopify's current product CSV vocabulary.
- Uses `Title` and `URL handle`, which Shopify currently requires for variant imports.
- Renames legacy Shopify headers such as `Body (HTML)` / `Variant SKU` / `Image Src`
  to current equivalents such as `Description` / `SKU` / `Product image URL`.
- Retains RMS SKU priority and multi-variation behavior from v3.7.1.

## v3.7.3 - Multiple product images + SKU images
- Detects RMS `商品画像パス1`, `商品画像パス2`, `商品画像パス3` and higher numbered image columns.
- Outputs extra Shopify image-only rows for product images after the first image.
- Maps `SKU画像パス` to Shopify `Variant image URL`.
- Validates all RMS product/SKU image URLs and warns on non-http(s) values.
- Image-less products remain valid.
- Keeps RMS SKU / Handle / multi-variation behavior from v3.7.2.

## v3.7.4 - Preview crash fix for multiple images
- Rebuilt `toShopifyRows()` to avoid undefined `validProductImages` references.
- Keeps first valid product image on the variant row.
- Adds product image 2+ as Shopify image-only rows once per product.
- Maps `SKU画像パス` to `Variant image URL`.
- Keeps invalid-image warnings, Draft status, RMS SKU priority, and multi-variation mapping.

## v3.7.5 TEST - Large catalog stress test
- TEST BUILD ONLY: temporarily disables the Free 20-product export limit.
- Raises export ceiling to 1,000 products for load testing.
- Intended to validate 100 products / 250+ SKU imports in Shopify Dev Store.
- Do not use this build as the public Free version.
- All v3.7.4 RMS, image, HTML, Draft, and Shopify compatibility behavior remains unchanged.

## v3.7.5 TEST2
- Fixes the remaining hard-coded 20-product export limit in `js/app.js`.
- Stress-test export ceiling remains 1,000 products.
- Expected result for `rakuten-rms-bulk-100-products.csv`: 100 products / 250 SKU rows before any image-only rows.

## v3.7.7 TEST
Additional boundary-value warnings:
- Price = 0 => Warning
- Blank inventory => Warning
- Keeps all v3.7.6 abnormal-data checks.
- Keeps the TEST export ceiling of 1,000 products.


## v3.8.0 - Sales preparation
- Restores the public Free export limit at 100 products.
- Updates public-facing TEST wording to the Free plan.
- Adds Standard plan presentation: JPY 2,980 / 30 days / up to 1,000 products.
- Standard purchase remains disabled while payment-provider review is pending.
- Shows a Free-limit notice when a catalog contains more than 100 products.
- Payment and license activation are not implemented in this build.


## v3.8.1 — Free 20 product limit
- Free export limit changed from 100 products to 20 products.
- Updated landing page, pricing copy, metadata, and converter notices to 20 products.
- Standard remains planned at up to 1,000 products / 30 days / ¥2,980.

## v3.8.2 LICENSE PREP
- Free plan remains 20 products.
- Adds Standard license UI and plan badge.
- Adds local verified-license state with 30-day expiry support.
- Export ceiling automatically switches:
  - Free: 20 products
  - Standard: 1,000 products
- License activation endpoint is intentionally NOT connected yet.
- After Lemon Squeezy approval, set `window.FORGEFLOW_LICENSE_API_BASE`
  to a Cloudflare Worker endpoint that verifies Lemon Squeezy licenses server-side.
- No secret keys are stored in the browser.

## v3.8.3 - Lemon Squeezy lifetime license integration prep
- Standard is now ¥2,980 one-time purchase / no recurring fee.
- Removes the old 30-day expiry UI and local expiry requirement.
- Adds purchase buttons driven by `window.FORGEFLOW_CHECKOUT_URL`.
- License activation asks for the purchase email + license key.
- Stores Lemon Squeezy `instance_id` locally after activation.
- Validates the stored instance on later visits.
- Deactivation now calls Lemon Squeezy before clearing local state, so the 1-activation slot is released correctly.
- Adds a Cloudflare Worker proxy in `/worker`.
- Worker verifies the Lemon Squeezy product ID (and optionally variant/store ID) and customer email before granting Standard.

### Remaining setup before end-to-end testing
1. Copy the Lemon Squeezy TEST checkout/share URL and set `FORGEFLOW_CHECKOUT_URL` in `js/config.js`.
2. Copy the Lemon Squeezy TEST product ID and set `EXPECTED_PRODUCT_ID` in the Worker environment.
3. Deploy `/worker/worker.js` to Cloudflare Workers and set `ALLOWED_ORIGIN` to your ForgeFlow domain.
4. Set the deployed Worker URL as `FORGEFLOW_LICENSE_API_BASE` in `js/config.js`.
5. Upload this build, purchase in Test mode, then activate with the receipt email and test license key.
6. Before production, repeat the IDs/checkout URL using Live mode values.


## v3.8.6 - License state sync fix
- If a license activation is manually deactivated in Lemon Squeezy, the next validation now clears stale local Standard state and returns ForgeFlow to Free.
- The in-app "この端末の認証を解除" action now also succeeds locally when Lemon Squeezy reports that the instance is already missing/deactivated.
- Temporary network or 5xx server failures still keep the local activation so users can retry without losing the instance reference.


## v3.8.7
- Switched the Standard purchase checkout URL from Lemon Squeezy Test Mode to the Live Mode checkout.
- License API endpoint remains the deployed Cloudflare Worker.
