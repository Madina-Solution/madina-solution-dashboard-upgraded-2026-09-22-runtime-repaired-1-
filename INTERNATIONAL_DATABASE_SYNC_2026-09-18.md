# International database synchronization

The public content model now supports ID/EN translations for categories, products, services, portfolio, FAQs, articles, and managed navigation items. Existing canonical Indonesian fields are copied into `translations.id` by additive migrations; English fields are optional and fall back to the canonical/Indonesian value when not yet translated.

Admin editing surfaces now expose English fields for products, services, portfolio, FAQs, articles, and navigation. Public pages resolve the correct locale through the same `next-intl` locale cookie.

Migrations are non-destructive and use `IF NOT EXISTS`; do not truncate or seed/reset production data during deployment.
