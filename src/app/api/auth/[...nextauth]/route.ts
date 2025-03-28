/**
 * @fileoverview NextAuth.js Authentication Route Handler
 * 
 * This module implements the Next.js route handlers for NextAuth.js authentication.
 * It provides the core authentication functionality for the application by exposing
 * the necessary endpoints that NextAuth.js needs to handle all authentication flows.
 * 
 * Features:
 * - OAuth provider authentication
 * - Session management
 * - JWT handling
 * - Callback processing
 * - API route protection
 * - Custom authentication flows
 * 
 * The route is automatically handled by NextAuth.js and supports:
 * - GET /api/auth/signin - Sign in page
 * - GET /api/auth/signout - Sign out page
 * - GET /api/auth/session - Session data
 * - GET /api/auth/csrf - CSRF token
 * - GET /api/auth/providers - List of providers
 * - POST /api/auth/signin/:provider - Provider sign in
 * - POST /api/auth/callback/:provider - Provider callback
 * 
 * @see {@link https://next-auth.js.org/configuration/pages}
 * @see {@link https://next-auth.js.org/configuration/options}
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js handler configured with application-specific authentication options.
 * This handler processes all authentication-related requests including:
 * - Sign in/out flows
 * - Session handling
 * - Callbacks processing
 * - JWT operations
 * - Provider authentication
 * 
 * The handler is exported as both GET and POST to support all NextAuth.js routes.
 * 
 * @see {@link https://next-auth.js.org/configuration/initialization}
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 