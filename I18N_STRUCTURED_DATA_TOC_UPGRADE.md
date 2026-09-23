# Internationalization + Structured Product Data + Active TOC

- Added next-intl 4.14.5 foundation with `id` and `en` messages.
- Locale is selected through `NEXT_LOCALE` cookie; current public URLs remain unchanged.
- Product MPN and GTIN are emitted in Product JSON-LD using the most specific gtin8/12/13/14 key where a valid numeric length is available.
- Product condition is emitted as Offer.itemCondition.
- Blog TOC now uses IntersectionObserver and highlights the active H2/H3.
- Desktop Blog TOC remains in the existing right sidebar.

Google recommends Product structured data with identifiers such as MPN and GTIN where applicable, and recommends specific GTIN properties when the format is known.
