/**
 * @file src/lib/auth.ts
 * Authentication configuration and type definitions for NextAuth.js.
 * Implements role-based authentication with Google OAuth provider and Prisma adapter.
 * 
 * Features:
 * - Google OAuth integration
 * - Role-based access control
 * - JWT session handling
 * - Custom session and user types
 * - Prisma database integration
 */

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import type { Account, DefaultSession, Session, User, AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import { JWT } from "next-auth/jwt";

/**
 * Extended types for NextAuth.js session and user.
 * Adds custom fields for role-based authentication.
 */
declare module "next-auth" {
  /**
   * Extends the default session type with custom user fields.
   * @property {object} user - User information in the session
   * @property {string} user.id - Unique identifier for the user
   * @property {string} user.role - User's role in the system
   */
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * Extends the default user type with custom fields.
   * @property {string} id - Unique identifier for the user
   * @property {Role} role - User's role enum value
   * @property {string} [roleId] - Optional reference to role record
   * @property {string} email - User's email address
   * @property {string} [name] - Optional user's display name
   * @property {string} [image] - Optional user's profile image URL
   */
  interface User {
    id: string;
    role: Role;
    roleId?: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

/**
 * Extends the JWT type with custom fields.
 * @property {string} [role] - User's role stored in the JWT
 * @property {string} sub - Subject identifier (user ID)
 */
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sub: string;
  }
}

/**
 * NextAuth.js configuration options.
 * Sets up authentication with Google provider and custom callbacks.
 */
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    /**
     * Handles the sign-in process and user creation/validation.
     * Verifies user existence and role assignment.
     * 
     * @param {object} params - Sign in callback parameters
     * @param {User} params.user - User attempting to sign in
     * @param {Account} params.account - OAuth account information
     * @param {any} params.profile - OAuth profile data
     * @returns {Promise<boolean>} Whether to allow sign in
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists in the database with any email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { 
              role: true,
              accounts: true 
            },
          });

          console.log("Found existing user:", existingUser);

          if (!existingUser) {
            // Check if there's a manually created user with this email
            const manualUser = await prisma.user.findFirst({
              where: { email: user.email },
              include: { role: true },
            });

            // If there's a manually created user, use their role
            const roleToUse = manualUser?.roleId;

            if (roleToUse) {
              // Create the user with the same role as the manual user
              const newUser = await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name || null,
                  image: user.image || null,
                  roleId: roleToUse,
                  accounts: {
                    create: {
                      type: account.type,
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                      access_token: account.access_token,
                      token_type: account.token_type,
                      scope: account.scope,
                      id_token: account.id_token,
                    }
                  }
                },
                include: {
                  role: true,
                },
              });

              // Update the user object to be used by NextAuth
              Object.assign(user, {
                id: newUser.id,
                roleId: newUser.roleId,
                role: newUser.role,
              });
            } else {
              // If no manual user exists, create with CLIENT role (default behavior)
              const clientRole = await prisma.role.findUnique({
                where: { name: "CLIENT" },
              });

              if (!clientRole) {
                console.error("Client role not found");
                return false;
              }

              // Create the user with the CLIENT role
              const newUser = await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name || null,
                  image: user.image || null,
                  roleId: clientRole.id,
                  accounts: {
                    create: {
                      type: account.type,
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                      access_token: account.access_token,
                      token_type: account.token_type,
                      scope: account.scope,
                      id_token: account.id_token,
                    }
                  }
                },
                include: {
                  role: true,
                },
              });

              // Update the user object to be used by NextAuth
              Object.assign(user, {
                id: newUser.id,
                roleId: newUser.roleId,
                role: newUser.role,
              });
            }
          } else {
            // Check if this OAuth account is already linked
            const existingAccount = existingUser.accounts.find(
              acc => acc.provider === account.provider && 
                    acc.providerAccountId === account.providerAccountId
            );

            if (!existingAccount) {
              // Link the new OAuth account
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                }
              });
            }

            // Update user profile if needed
            if (user.name !== existingUser.name || user.image !== existingUser.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                }
              });
            }

            // Update the user object with existing user's role
            Object.assign(user, {
              id: existingUser.id,
              roleId: existingUser.roleId,
              role: existingUser.role,
            });
          }
          console.log("Updated user:", user);
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    /**
     * Customizes the JWT token creation.
     * Adds user role and other custom claims to the token.
     * 
     * @param {object} params - JWT callback parameters
     * @param {JWT} params.token - Current JWT token
     * @param {User} params.user - User object (only on sign in)
     * @returns {Promise<JWT>} Modified JWT token
     */
    async jwt({ token, user }) {
      console.log("JWT Callback - Input:", { token, user });
      
      if (user?.roleId) {
        // Fetch role if not present in user object
        if (!user.role) {
          const userWithRole = await prisma.user.findUnique({
            where: { id: user.id },
            include: { role: true },
          });
          if (userWithRole?.role) {
            token.role = userWithRole.role.name;
          }
        } else {
          token.role = user.role.name;
        }
      }

      // Ensure role persists in token
      if (!token.role && user?.id) {
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        if (userWithRole?.role) {
          token.role = userWithRole.role.name;
        }
      }
      
      console.log("JWT Callback - Output token:", token);
      return token;
    },
    /**
     * Customizes the session object available to the client.
     * Adds user role and ID from the JWT token.
     * 
     * @param {object} params - Session callback parameters
     * @param {Session} params.session - Current session
     * @param {JWT} params.token - Current JWT token
     * @returns {Promise<Session>} Modified session object
     */
    async session({ session, token }) {
      console.log("Session Callback - Input:", { session, token });
      
      if (session.user) {
        session.user.id = token.sub;
        if (token.role) {
          session.user.role = token.role;
          console.log("Setting role in session:", token.role);
        } else {
          console.log("No role found in token");
          // Attempt to fetch role from database
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            include: { role: true },
          });
          if (user?.role) {
            session.user.role = user.role.name;
            console.log("Retrieved role from database:", user.role.name);
          }
        }
      }
      
      console.log("Session Callback - Output session:", session);
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
} as const;

export const { auth, signIn, signOut } = NextAuth(authOptions);