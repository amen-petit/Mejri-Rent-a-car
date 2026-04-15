import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    const response = NextResponse.next();
    if (pathname.startsWith("/admin")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return response;
  }

  const isValid = token
    ? await verifyAdminSessionToken(token, sessionSecret)
    : null;
  const loginUrl = new URL("/admin/login", request.url);
  if (search) {
    loginUrl.searchParams.set("next", pathname + search);
  }

  if (pathname === "/admin/login") {
    if (isValid) {
      const response = NextResponse.redirect(new URL("/admin", request.url));
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!isValid) {
      const response = NextResponse.redirect(loginUrl);
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
