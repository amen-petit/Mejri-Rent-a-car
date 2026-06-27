import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  constantTimeEqual,
  createAdminSessionToken,
} from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    // Brute-force protection: 5 attempts per IP per minute.
    const ip = getClientIp(req);
    const limit = await rateLimit(`login:${ip}`, 5, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Missing ADMIN_USERNAME or ADMIN_PASSWORD." },
        { status: 500 },
      );
    }

    const { username, password } = (await req.json()) as LoginBody;

    // Evaluate both comparisons (no short-circuit) to avoid timing side channels.
    const usernameOk = constantTimeEqual(username ?? "", adminUsername);
    const passwordOk = constantTimeEqual(password ?? "", adminPassword);
    if (!usernameOk || !passwordOk) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!sessionSecret) {
      return NextResponse.json(
        { error: "Missing ADMIN_SESSION_SECRET." },
        { status: 500 },
      );
    }

    const token = await createAdminSessionToken(adminUsername, sessionSecret);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
