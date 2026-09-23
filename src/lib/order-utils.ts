/**
 * Valid status transitions for order lifecycle.
 * This file is safe for both server and client imports.
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["design_review", "production", "cancelled"],
  design_review: ["design_approved", "confirmed", "cancelled"],
  design_approved: ["production", "cancelled"],
  production: ["quality_control", "cancelled"],
  quality_control: ["ready", "production"],
  ready: ["shipping", "completed"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
