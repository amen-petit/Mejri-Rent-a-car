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
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  return Boolean(await verifyAdminSessionToken(token, secret));
}
