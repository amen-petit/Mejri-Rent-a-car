import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const cookieStore = await import("next/headers").then((mod) => mod.cookies());
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = token
    ? await verifyAdminSessionToken(token, sessionSecret)
    : null;

  return NextResponse.json({ authenticated: Boolean(authenticated) });
}
