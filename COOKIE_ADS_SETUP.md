# Cookie & Google AdSense setup

## Admin settings
Use `/admin/settings` → Google AdSense to configure:
- `AdSense Client`: `ca-pub-...`
- `Publisher ID`: `pub-...` (or the numeric publisher id)
- `Slot Top`: responsive display unit shown below the header
- `Slot Footer`: responsive display unit shown before the footer
- `Slot Produk`: optional unit on product detail
- `Slot Artikel`: optional unit inside article detail

Ads are disabled by default. They only load after the site's non-essential cookie consent is accepted. `/ads.txt` is generated from the configured publisher id.

## Cookie policy
- Essential session cookies remain functional.
- Non-essential ad technology is gated behind the site's consent signal.
- `/privacy` and `/cookies` explain the use of cookies and advertising.

For EEA, UK and Switzerland traffic, Google requires a certified consent management platform integrated with the IAB Transparency and Consent Framework when serving personalised ads. Configure Google's certified CMP/Privacy & messaging in AdSense as required; the site's lightweight consent banner is not a substitute for that regional requirement.
