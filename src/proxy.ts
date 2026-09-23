import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { getAdminRoutePermission } from "@/lib/auth/admin-routes";
import { hasPermission } from "@/lib/auth/permissions";

const SESSION_COOKIE = "madina_session";

function getContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagmanager.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.google.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    "media-src 'self' blob: https://res.cloudinary.com",
    "connect-src 'self' https://*.googleapis.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.sentry.io",
    "frame-src 'self' https://googleads.g.doubleclick.net https://accounts.google.com https://*.firebaseapp.com https://*.google.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join('; ');
}


export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const applySecurityHeaders = (target: NextResponse) => {
    target.headers.set("X-Content-Type-Options", "nosniff");
    target.headers.set("X-Frame-Options", "DENY");
    target.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    target.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      target.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      target.headers.set("Content-Security-Policy", getContentSecurityPolicy());
    }
    if (pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) {
      target.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    return target;
  };

  const response = applySecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    const permission = getAdminRoutePermission(pathname);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (!hasPermission(session.role, permission)) {
      const forbiddenUrl = new URL("/admin", request.url);
      forbiddenUrl.searchParams.set("forbidden", "1");
      return applySecurityHeaders(NextResponse.redirect(forbiddenUrl));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
