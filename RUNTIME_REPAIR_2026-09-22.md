# Runtime repair — 22 September 2026

- Restored the AdminShell NotificationBell import.
- Added `/admin/notifications` because the header notification link must resolve to a real route.
- Added root Apple touch and favicon fallbacks.
- Standardized hero image quality from 78 to 75 and explicitly configured Next Image quality 75.
- PWA metadata now prefers PNG application icons; SVG site icons are not used as Android install icons.
- Runtime validator is included in `validate:release`.
