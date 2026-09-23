-- Blog integrity hardening. Safe repair of legacy publication metadata and empty excerpts.
UPDATE "articles" SET "is_published" = true WHERE "published_at" IS NOT NULL AND "is_published" = false;
UPDATE "articles" SET "published_at" = COALESCE("published_at", "created_at") WHERE "is_published" = true AND "published_at" IS NULL;
UPDATE "articles"
SET "excerpt" = LEFT(regexp_replace(regexp_replace(COALESCE("content", ''), '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g'), 220)
WHERE COALESCE(trim("excerpt"), '') = '' AND COALESCE(trim("content"), '') <> '';
UPDATE "articles"
SET "translations" = jsonb_build_object('id', jsonb_build_object('title', "title", 'excerpt', COALESCE("excerpt", ''), 'content', COALESCE("content", ''), 'category', COALESCE("category", ''), 'tags', COALESCE("tags", '[]'::jsonb)))
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;
