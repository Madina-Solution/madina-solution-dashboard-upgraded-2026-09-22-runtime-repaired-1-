# Fix TypeScript & React Compiler — 2026-09-18

Fixed from the user's latest local validation output:

1. `products/[slug]/page.tsx`
   - Explicitly typed the fulfillment icon tuple with `typeof Clock3`.
   - Keeps Lucide icon components renderable as JSX and resolves `string | ForwardRefExoticComponent` ReactNode errors.

2. `src/instrumentation.ts`
   - Normalizes the `unknown` request error before reading `message`.
   - Safely reads optional `digest`.
   - Accepts optional values in the request header dictionary without unsafe casting.

3. `products/[slug]/product-gallery.tsx`
   - Removed manual `useCallback` memoization that React Compiler could not preserve.
   - Uses stable `mediaKey` for effect dependencies instead of the freshly-created media array.
   - Navigation still works for buttons, keyboard arrows, touch swipe and autoplay.

No database reset, seed or destructive migration is included.
