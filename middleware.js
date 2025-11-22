import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // Halaman login TIDAK boleh diakses jika sudah login
  if (path.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Halaman public (root)
  if (path === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Semua halaman protected → butuh token
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate token
  try {
    const decoded = jwtDecode(token);
    if (decoded.role !== "parent") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/devices/:path*",
    "/location/:path*"
  ]
};
