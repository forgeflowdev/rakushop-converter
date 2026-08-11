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
