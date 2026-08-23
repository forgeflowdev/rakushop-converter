# ForgeFlow - RakShop Converter

Rakuten CSV → Shopify CSV converter.

Website: https://forgeflowtools.com

Status: Beta

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
