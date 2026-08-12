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
