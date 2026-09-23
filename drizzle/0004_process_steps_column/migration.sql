-- services.process_steps was defined in src/db/schema.ts but was never added by
-- migrations 0001-0003 or by scripts/ensure-db-schema.mjs. The required-columns
-- validator (scripts/validate-db-schema.mjs) checks for it, so validation could
-- never pass until this column actually exists.
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "process_steps" jsonb DEFAULT '[]'::jsonb;
