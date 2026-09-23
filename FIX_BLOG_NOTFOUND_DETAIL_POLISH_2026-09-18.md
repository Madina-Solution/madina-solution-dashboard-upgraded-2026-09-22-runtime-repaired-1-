# Blog Gallery + Detail Hardening — 2026-09-18

- Blog cards now derive a short excerpt when legacy `excerpt` is empty.
- Added `drizzle/0010_blog_integrity/migration.sql` to repair publication metadata, backfill excerpts, and restore the Indonesian translation layer for empty legacy translation objects.
- Runtime schema performs the same repair for deployments that have not run migrations yet.
- Detail-page title now uses a restrained editorial/luxury hero panel.
- Share controls are a normal sidebar card, not fixed/floating.
- Table of contents is a normal sidebar card, not sticky/floating.
- The right rail is a dedicated 320px column and remains at the top of the content layout.
- Mobile keeps the TOC in normal document flow.
- Drafts with no publication signal remain private; English content remains editorial data and is not auto-translated.
