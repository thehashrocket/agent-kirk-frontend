import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    console.log("Middleware - Token:", token);
    
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAccountRepRoute = req.nextUrl.pathname.startsWith("/account-rep");
    const isClientRoute = req.nextUrl.pathname.startsWith("/client");

    console.log("Middleware - Route check:", {
      path: req.nextUrl.pathname,
      isAdminRoute,
      isAccountRepRoute,
      isClientRoute
    });

    if (isAdminRoute && token?.role !== "ADMIN") {
      console.log("Access denied to admin route. User role:", token?.role);
      return NextResponse.redirect(new URL("/auth/signin", req.url));
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
      authorized: ({ token }) => {
        console.log("Middleware authorized callback - Token:", token);
        return !!token;
      },
    },
  }
);

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