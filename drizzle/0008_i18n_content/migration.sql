ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "navigation_items" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;

UPDATE "articles"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'title', "title",
    'excerpt', "excerpt",
    'content', "content",
    'category', "category",
    'tags', COALESCE("tags", '[]'::jsonb)
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;

UPDATE "navigation_items"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'name', "name",
    'description', "description"
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;

UPDATE "navigation_items"
SET "translations" = jsonb_set("translations", '{en}', CASE "href"
  WHEN '/services/logo-design' THEN jsonb_build_object('name','Logo Design','description','Create a clear visual identity for your brand')
  WHEN '/services/brand-identity' THEN jsonb_build_object('name','Brand Identity','description','A complete visual system for your brand')
  WHEN '/services/social-media-design' THEN jsonb_build_object('name','Social Media Design','description','Visual content for social channels')
  WHEN '/services/packaging-design' THEN jsonb_build_object('name','Packaging Design','description','Product packaging designed to stand out')
  WHEN '/products?category=banner' THEN jsonb_build_object('name','Banners & Signage','description','Large-format print for promotion and events')
  WHEN '/products?category=sticker' THEN jsonb_build_object('name','Stickers','description','Custom stickers for products and promotion')
  WHEN '/products?category=kartu-nama' THEN jsonb_build_object('name','Business Cards','description','Professional cards for everyday networking')
  WHEN '/products?category=brosur' THEN jsonb_build_object('name','Brochures','description','Print brochures for campaigns and sales')
  WHEN '/products?category=undangan' THEN jsonb_build_object('name','Invitations','description','Invitations for events and celebrations')
  WHEN '/products?category=poster' THEN jsonb_build_object('name','Posters','description','High-impact promotional posters')
  WHEN '/products?category=kalender' THEN jsonb_build_object('name','Calendars','description','Branded calendars for business and gifts')
  WHEN '/products?category=signage' THEN jsonb_build_object('name','Signage','description','Indoor and outdoor business signage')
  WHEN '/portfolio' THEN jsonb_build_object('name','Portfolio','description','Selected work and visual case studies')
  WHEN '/blog' THEN jsonb_build_object('name','Articles & Insight','description','Practical design and printing guidance')
  WHEN '/faq' THEN jsonb_build_object('name','FAQ','description','Frequently asked questions')
  WHEN '/about' THEN jsonb_build_object('name','About Us','description','Learn about Madina Solution')
  WHEN '/contact' THEN jsonb_build_object('name','Contact','description','Talk to our team')
  ELSE COALESCE("translations"->'en', '{}'::jsonb)
END, true)
WHERE "translations"->'en' IS NULL OR jsonb_typeof("translations"->'en') <> 'object' OR COALESCE("translations"->'en'->>'name','') = '';
