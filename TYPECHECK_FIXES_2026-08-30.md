# Typecheck fixes — 2026-08-30

This release fixes the exact TypeScript errors reported by the user's release run:

- Blog detail: removed access to nonexistent `article.authorName`; ArticleSchema uses the managed site name as fallback author.
- FAQ page: uses the schema's `faqs.order` field instead of nonexistent `faqs.sortOrder`.
- Media upload: imports `eq` from `drizzle-orm`.
- Session: imports `jwtVerify` from `jose`.
- Manifest: uses Next.js-compatible icon purpose `any`.
- Root metadata: explicitly types the merged site metadata configuration so database strings are assignable.
- `.env.example`: documents `NEXT_PUBLIC_SITE_URL`, which is required for production SEO configuration.

Validation performed in the build artifact:
- navigation contract: PASS
- integrity contract: PASS
- media contract: PASS
- social auth contract: PASS
- access/RBAC contract: PASS
- persistence contract: PASS
- UI/branding/admin architecture contract: PASS (10/10)

A full `npm run typecheck` / `npm run build` must be rerun on a machine after `npm install` because this artifact intentionally excludes `node_modules`. The provided source fixes correspond to the seven compiler errors reported in the release log.
