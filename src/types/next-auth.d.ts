/**
 * @file src/types/next-auth.d.ts
 * Type declarations for NextAuth.js authentication.
 * Extends default NextAuth types with custom user and session properties.
 */

import "next-auth";
import { Role, Account } from "@prisma/client";

/**
 * NextAuth.js module augmentation.
 * Extends default types with custom properties for role-based authentication.
 */
declare module "next-auth" {
  /**
   * Extends the default session type with custom user properties.
   * Used for client-side session management and type safety.
   * 
   * @property {object} user - User information in the session
   * @property {string} user.id - Unique identifier for the user
   * @property {string} user.email - User's email address
   * @property {string} [user.name] - Optional user's display name
   * @property {string} [user.image] - Optional user's profile image URL
   * @property {string} user.role - User's role (e.g., "ADMIN", "CLIENT", "ACCOUNT_REP")
   * @property {string} [user.impersonatedUserId] - Impersonated user ID
   * @property {string} [user.originalRole] - Original role when impersonating
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: string;
      impersonatedUserId?: string;
      originalRole?: string;
    };
  }

  /**
   * Extends the default user type with custom properties.
   * Used for database user model and authentication.
   * 
   * @property {string} id - Unique identifier for the user
   * @property {string} email - User's email address
   * @property {string} [name] - Optional user's display name
   * @property {string} [image] - Optional user's profile image URL
   * @property {Role} role - User's role from Prisma Role enum
   * @property {Account[]} accounts - Associated OAuth accounts
   */
  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: Role;
    accounts: Account[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: string;
    impersonatedUserId?: string;
    originalRole?: string;
  }
} 