/**
 * @file src/app/api/auth/[...nextauth]/route.ts
 * NextAuth.js authentication handler for managing authentication routes.
 * This file exports the necessary GET and POST handlers for NextAuth.js to handle
 * all authentication-related requests (sign in, sign out, session handling, etc.).
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js handler configured with application-specific authentication options.
 * Handles all authentication flows including:
 * - OAuth provider authentication (Google)
 * - Magic link authentication
 * - Session management
 * - Callbacks and events
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 