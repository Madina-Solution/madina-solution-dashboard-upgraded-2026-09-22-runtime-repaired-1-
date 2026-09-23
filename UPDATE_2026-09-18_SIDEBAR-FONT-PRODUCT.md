# MADINA SOLUTION — Sidebar TOC, Deduplication & Product Layout Fix

## Changes
- Blog Table of Contents is now in the existing right sidebar on desktop; mobile remains collapsible.
- Blog main content is widened to use the freed left column.
- Removed duplicate author profile/sidebar metadata; author E-E-A-T profile remains once at the end of the article.
- Product hero grid now uses `items-start` to prevent the left gallery column from stretching and leaving a blank white area below the gallery.
- Product identifiers (MPN, GTIN/barcode, condition) are consolidated into Technical Specifications instead of a separate duplicate card.
- Product review rating summary appears only in the hero; reviews section shows review count.
- Global typography is unified to Inter; Plus Jakarta Sans is removed from the Next font bundle.
- Existing product pricing migration is retained; no destructive migration is introduced by this patch.

## Verification
Modified TS/TSX files pass TypeScript syntax/transpile parsing in the build workspace.
Full dependency-backed `typecheck/lint/build` should be run in the project directory after `npm install`.
