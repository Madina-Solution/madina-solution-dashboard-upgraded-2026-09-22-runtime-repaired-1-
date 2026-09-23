# Release Fix — TypeScript/ESLint + Mega Menu Width

Date: 2026-09-18

## Fixed from latest terminal log

1. `src/app/(public)/products/[slug]/page.tsx`
   - The fulfillment cards array is explicitly typed with `LucideIcon`, removing the tuple-union inference that caused `TS2322` on `<Icon />`.

2. `src/instrumentation.ts`
   - `safeHeaders()` now accepts the runtime request header shape safely and normalizes unknown values before `Object.fromEntries`, removing `TS18046`/`TS2345` from the request-error instrumentation path.

3. `src/app/(public)/products/[slug]/product-gallery.tsx`
   - Media length is captured as a stable primitive (`mediaCount`) for effects. This avoids the React Compiler `preserve-manual-memoization` errors caused by depending directly on `media.length`.

4. Mega Menu width
   - The menu is no longer positioned relative to the narrower center navigation column.
   - It is rendered as a sibling overlay inside the header's shared `max-w-7xl` container, so the menu width follows the same header/screen margins.
   - The menu component itself now uses `w-full` instead of a separate `1120px` cap.
