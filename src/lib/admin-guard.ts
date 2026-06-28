/**
 * Server-side admin authorization guard.
 *
 * Use inside Route Handlers / Server Components to verify the caller holds a
 * valid admin session cookie BEFORE performing any privileged operation. This
 * is the real protection: the middleware only gates which pages render, not the
 * data layer.
 */
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function isAdminRequest(): Promise<boolean> {
  return Boolean(await getAdminIdentity());
}

/**
 * Returns the authenticated admin's identity (the session `sub`, i.e. the
 * username) or null if the caller is not a valid admin. Use this when an action
 * needs to be attributed to an actor — e.g. audit logging of mutations.
 */
export async function getAdminIdentity(): Promise<string | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAdminSessionToken(token, secret);
  return payload?.sub ?? null;
}
