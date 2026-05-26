/**
 * Next.js Middleware for Basic Route Protection
 * Purpose: Provides basic route protection and redirects
 * Note: Session validation is handled client-side by AuthGuard component
 */

import { NextResponse } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/reports",
  "/outstanding",
  "/history",
  "/upload",
  "/users",
];

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/otp", "/unauthorized"];

/**
 * Main middleware function
 * @param {Object} request - Next.js request object
 * @returns {NextResponse} - Response object
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Handle root path - always redirect to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 302,
    });
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, allow the request to proceed
  // The client-side AuthGuard will handle session validation
  if (isProtectedRoute) {
    return NextResponse.next();
  }

  // For all other routes, allow access
  return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
