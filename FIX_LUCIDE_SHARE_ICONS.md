# Release Fix — Article Share Icons

Fixed `src/components/blog/article-reading-tools.tsx` for the project's installed `lucide-react` version.

- Removed non-existent `Facebook` and `Linkedin` Lucide exports.
- Preserved Facebook and LinkedIn share destinations.
- Replaced brand icons with lightweight text glyphs (`f`, `in`) to avoid adding dependencies.
- Kept explicit accessible labels and titles on both controls.
- No database/data migration or destructive operation is included in this fix.
