import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );
  const hasSessionCookie = request.cookies.has("life_rpg_logged_in");
  const isAuthenticated = hasSupabaseAuth || hasSessionCookie;

  // 1. If user is logged in and visits "/" (home/landing), automatically send them to "/dashboard"
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect authenticated routes (/dashboard, /profile, /community, /settings)
  const protectedRoutes = ["/dashboard", "/profile", "/community", "/settings"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If user is already logged in and visits "/login", redirect to "/dashboard"
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/community/:path*",
    "/settings/:path*",
    "/login",
  ],
};
