/**
 * @file src/middleware.ts
 * Next.js middleware for role-based route protection and authentication.
 * Implements route-specific access control based on user roles.
 * 
 * Features:
 * - Role-based access control (RBAC)
 * - Protected route handling
 * - Authentication verification
 * - Automatic redirection
 * - Route-specific middleware
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const privilegedCompanyName = "1905 New Media";

/**
 * Authentication and authorization middleware.
 * Protects routes based on user roles and authentication status.
 * 
 * Route Protection:
 * - /admin/* routes require ADMIN role
 * - /account-rep/* routes require ACCOUNT_REP role
 * - /client/* routes require CLIENT role
 * 
 * Behavior:
 * - Unauthenticated users are redirected to sign-in
 * - Authenticated users without proper role are redirected to sign-in
 * - Successful auth with proper role allows access
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    // console.log("Middleware - Token:", token);
    
    const pathname = req.nextUrl.pathname;
    const isAdminRoute = pathname.startsWith("/admin");
    const isAccountRepRoute = req.nextUrl.pathname.startsWith("/account-rep");
    const isClientRoute = req.nextUrl.pathname.startsWith("/client");
    const isManualEntryRoute =
      pathname === "/admin/direct-mail/manual-entry" ||
      pathname.startsWith("/admin/direct-mail/manual-entry/");

    const hasPrivilegedCompany =
      token?.companyName?.toLowerCase() === privilegedCompanyName.toLowerCase();

    // console.log("Middleware - Route check:", {
    //   path: req.nextUrl.pathname,
    //   isAdminRoute,
    //   isAccountRepRoute,
    //   isClientRoute
    // });

    if (isAdminRoute && token?.role !== "ADMIN") {
      if (!isManualEntryRoute || !hasPrivilegedCompany) {
        console.log("Access denied to admin route. User role:", token?.role);
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
    }

    if (isAccountRepRoute && token?.role !== "ACCOUNT_REP") {
      console.log("Access denied to account rep route. User role:", token?.role);
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (isClientRoute && token?.role !== "CLIENT") {
      console.log("Access denied to client route. User role:", token?.role);
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    console.log("Access granted to route");
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Authorization callback to verify token existence.
       * @param {object} params - Callback parameters
       * @param {any} params.token - JWT token from session
       * @returns {boolean} Whether the request is authorized
       */
      authorized: ({ token }) => {
        console.log("Middleware authorized callback - Token:", token);
        return !!token;
      },
    },
  }
);

/**
 * Middleware configuration for route matching.
 * Specifies which routes should be protected by the middleware.
 * 
 * Protected Routes:
 * - All admin routes (/admin/*)
 * - All account rep routes (/account-rep/*)
 * - All client routes (/client/*)
 * - Specific dashboard routes for each role
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/account-rep/:path*",
    "/client/:path*",
    "/admin/dashboard",
    "/account-rep/dashboard",
    "/client/dashboard"
  ],
}; 
