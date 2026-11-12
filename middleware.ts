import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const AUTH_COOKIE_NAME = "kgz_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "khushi-gaming-zone-super-secret-jwt-key-min-32-chars-long!"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths requiring staff authentication
  const isProtectedPath =
    pathname.startsWith("/reception") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/platform");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as any).role;

    // RBAC path matching
    if (pathname.startsWith("/platform")) {
      if (role !== "super_admin" && role !== "reseller") {
        return NextResponse.redirect(new URL("/owner", request.url));
      }
    }

    if (pathname.startsWith("/owner")) {
      if (role !== "super_admin" && role !== "owner" && role !== "manager") {
        return NextResponse.redirect(new URL("/reception", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/reception/:path*",
    "/owner/:path*",
    "/platform/:path*",
  ],
};
