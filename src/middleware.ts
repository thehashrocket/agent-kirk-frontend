import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAccountRepRoute = req.nextUrl.pathname.startsWith("/account-rep");
    const isClientRoute = req.nextUrl.pathname.startsWith("/client");

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (isAccountRepRoute && token?.role !== "ACCOUNT_REP") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (isClientRoute && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/account-rep/:path*", "/client/:path*"],
}; 