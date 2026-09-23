import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getEnvStatus, validateEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    status: "ok",
    version: "1.0.0",
    level: process.env.NODE_ENV === "production" ? "PRODUCTION CANDIDATE" : "DEVELOPMENT",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    iterations: 8,
  };

  // Database
  try {
    await db.execute(sql`select 1`);
    checks.database = "connected";
  } catch {
    checks.database = "error";
    checks.status = "degraded";
  }

  // Environment config status (booleans only, never values)
  checks.config = getEnvStatus();
  const env = validateEnvironment();
  if (process.env.NODE_ENV === "production" && !env.valid) {
    checks.status = "degraded";
    checks.environmentValidation = { valid: false, missingCount: env.missing.length };
  } else {
    checks.environmentValidation = { valid: true, missingCount: 0 };
  }

  // Provider status
  checks.providers = {
    payment: process.env.PAYMENT_PROVIDER || (process.env.NODE_ENV === "production" ? "unconfigured" : "mock"),
    storage: process.env.CLOUDINARY_CLOUD_NAME ? "cloudinary" : (process.env.NODE_ENV === "production" ? "unconfigured" : "local"),
    email: process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "unconfigured" : "console"),
  };

  const statusCode = checks.status === "ok" ? 200 : 503;
  return Response.json(checks, { status: statusCode });
}
