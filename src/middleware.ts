import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "default-secret");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
