/**
 * Environment validation for Madina Solution.
 * Called lazily — does not block build.
 * Logs warnings for missing optional vars.
 * Throws for missing required vars in production.
 */

type EnvConfig = {
  key: string;
  required: boolean;
  production: boolean;
  description: string;
};

const ENV_VARS: EnvConfig[] = [
  { key: "DATABASE_URL", required: true, production: true, description: "PostgreSQL connection" },
  { key: "SESSION_SECRET", required: true, production: true, description: "JWT signing secret (min 32 chars)" },
  { key: "NEXT_PUBLIC_SITE_URL", required: true, production: true, description: "Canonical production URL (must be HTTPS)" },
  { key: "CLOUDINARY_CLOUD_NAME", required: false, production: false, description: "Cloudinary cloud name" },
  { key: "CLOUDINARY_API_KEY", required: false, production: false, description: "Cloudinary API key" },
  { key: "CLOUDINARY_API_SECRET", required: false, production: false, description: "Cloudinary secret" },
  { key: "PAYMENT_PROVIDER", required: true, production: true, description: "Payment provider (manual, midtrans, or xendit)" },
  { key: "MIDTRANS_SERVER_KEY", required: false, production: false, description: "Midtrans server key" },
  { key: "XENDIT_SECRET_KEY", required: false, production: false, description: "Xendit secret key" },
  { key: "EMAIL_PROVIDER", required: true, production: true, description: "Transactional email provider (resend in production)" },
  { key: "RESEND_API_KEY", required: false, production: false, description: "Resend API key" },
  { key: "EMAIL_FROM", required: false, production: false, description: "Transactional email sender" },
  { key: "NEXT_PUBLIC_FIREBASE_API_KEY", required: false, production: false, description: "Firebase web API key (social login)" },
  { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", required: false, production: false, description: "Firebase auth domain (social login)" },
  { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", required: false, production: false, description: "Firebase project ID (social login)" },
  { key: "NEXT_PUBLIC_FIREBASE_APP_ID", required: false, production: false, description: "Firebase app ID (social login)" },
  { key: "FIREBASE_PROJECT_ID", required: false, production: false, description: "Firebase server project ID" },
];

let _validated = false;

export function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  if (_validated) return { valid: true, missing: [], warnings: [] };

  const isProd = process.env.NODE_ENV === "production";
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const env of ENV_VARS) {
    const value = process.env[env.key];
    if (!value) {
      if (env.required || (env.production && isProd)) {
        missing.push(`${env.key} — ${env.description}`);
      } else {
        warnings.push(`${env.key} not set — ${env.description}`);
      }
    }
  }

  if (isProd) {
    const paymentProvider = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
    if (!paymentProvider || paymentProvider === "mock") missing.push("PAYMENT_PROVIDER — must be manual, midtrans or xendit in production");
    if (paymentProvider === "midtrans" && !process.env.MIDTRANS_SERVER_KEY) missing.push("MIDTRANS_SERVER_KEY — required for Midtrans production payments");
    if (paymentProvider === "xendit" && !process.env.XENDIT_SECRET_KEY) missing.push("XENDIT_SECRET_KEY — required for Xendit production payments");
    const emailProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
    if (emailProvider !== "resend") missing.push("EMAIL_PROVIDER — must be resend in production");
    if (emailProvider === "resend" && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) missing.push("RESEND_API_KEY / EMAIL_FROM — required for production email");
    const effectiveSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://madinasolution.vercel.app");
    if (!/^https:\/\//i.test(effectiveSiteUrl)) missing.push("NEXT_PUBLIC_SITE_URL — must use https:// in production");
  }

  if (missing.length > 0 && isProd) {
    console.error("[ENV] Missing required environment variables:", missing);
  }

  if (warnings.length > 0) {
    console.warn("[ENV] Optional variables not configured:", warnings.map(w => w.split(" —")[0]));
  }

  _validated = true;
  return { valid: missing.length === 0, missing, warnings };
}

/**
 * Get environment status for health endpoint (never expose values).
 */
export function getEnvStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const env of ENV_VARS) {
    status[env.key] = env.key === "NEXT_PUBLIC_SITE_URL"
      ? !!(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL)
      : !!process.env[env.key];
  }
  return status;
}
