# Madina Solution — Access Control Contract

## Role boundaries

| Role | Primary scope | Restricted |
|---|---|---|
| Super Admin | Full platform, roles, settings, audit, finance | None |
| Admin | Full operations, content, media, settings; manage lower-level users | Super Admin management, role escalation to Admin |
| Manager | Commerce, customers, coupons, design, production, content, media | Roles, site settings, critical finance |
| Staff | Orders/customers operations, catalog/content read, media upload | Settings, roles, destructive content actions |
| Designer | Design workspace, revisions, design assets | Finance, roles, settings |
| Production | Production pipeline, QC, production assets | Finance, roles, settings |
| Customer | Own account, cart, checkout and own orders | Admin resources |

Server APIs must use `hasPermission()` / `hasAnyPermission()` rather than hard-coded role arrays. Role assignment uses hierarchy checks and prevents Super Admin escalation.
