# Product Editor / WYSIWYG Upgrade

## Admin product editor
- WYSIWYG HTML editor: headings, emphasis, lists, quote, code, links, images, table, alignment, divider, undo/redo, clean formatting, HTML source, fullscreen.
- Product information tabs: General, Content, Pricing, Inventory, Shipping, SEO, Variants.
- Commerce metadata is stored in `products.metadata` as JSONB to remain backward-compatible.
- Wholesale price tiers support minimum quantity + unit price.
- Variant matrix supports attribute values with price modifier, SKU, stock, and image fields.
- SEO fields include title, meta description, keywords, canonical URL, noindex, OpenGraph and structured-data identifiers.
- Content fields include highlights, FAQ, tags, warranty, return policy, video URL and related product IDs.

## Storefront product detail
- Rich HTML product description is sanitized before rendering.
- Variant attributes are converted to customer-facing option selectors and participate in existing price calculation.
- Wholesale tiers, stock state, SKU and compare-at price are surfaced.
- Product JSON-LD receives SKU and availability.
- Product metadata can control page title, description, canonical, image, keywords and noindex.

## Security / accessibility
- Rich text is sanitized server-side and client-side.
- Dangerous HTML tags, event attributes and javascript/data HTML URLs are removed.
- Toolbar uses accessible labels/roles; editor uses textbox semantics.
- Media images use lazy loading.
- Form labels, status controls and action buttons expose accessible names.

## Database sync
`npm run db:sync` now ensures:
- `products.metadata` JSONB
- `articles.metadata` JSONB

No third-party editor dependency was added; the editor remains lightweight and uses the browser editing surface so the admin bundle stays small.
