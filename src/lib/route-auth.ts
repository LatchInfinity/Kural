import type { NextRequest } from "next/server";

function hasBearerSecret(request: NextRequest, secret?: string): boolean {
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // Local developer convenience: allow manual refresh without a secret only in dev.
  if (process.env.NODE_ENV !== "production" && !secret) return true;

  // Production cron must use the CRON_SECRET bearer token. Vercel automatically
  // sends this Authorization header when CRON_SECRET is configured.
  return hasBearerSecret(request, secret);
}

export function isAdminApiEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_ADMIN_API === "true";
}

export function isAdminAuthorized(request: NextRequest): boolean {
  if (!isAdminApiEnabled()) return false;
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (process.env.NODE_ENV !== "production" && !secret) return true;
  return hasBearerSecret(request, secret);
}
