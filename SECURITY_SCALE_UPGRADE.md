# Security & Scale Upgrade

## Distributed rate limiting
Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel/production. The app uses one atomic Redis EVAL counter per identifier. Without these variables, a local fallback remains active and logs a production warning.

## Monitoring
`src/instrumentation.ts` uses Next.js `onRequestError` and emits structured JSON to the hosting logs. Set `ERROR_MONITORING_WEBHOOK_URL` to forward events to an external monitoring collector.

## CSP
Production responses include a CSP from `src/proxy.ts`. Third-party sources currently allowed cover Cloudinary, Firebase/Google APIs, Google AdSense, and optional Sentry collection. Review the allowlist if another external service is added.

## Detail-page caching
Public detail routes for product, blog, portfolio, and service export `revalidate = 60`. Product personalization is loaded client-side from authenticated APIs so the public product page itself does not require a session cookie during server rendering.
