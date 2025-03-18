import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import type { Account, DefaultSession, Session, User, AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import { JWT } from "next-auth/jwt";

// Define custom types for the session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    roleId?: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sub: string;
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  debug: true,
  session: {
    strategy: "jwt" as const,
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
    async signIn({ user, account }: { user: User; account: Account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { role: true },
          });

          console.log("Found existing user:", existingUser);

          if (!existingUser) {
            // Create new user with CLIENT role
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
                password: "", // Required by schema
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
    async jwt({ token, user }: { token: JWT; user: User }) {
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
    async session({ session, token }: { session: Session; token: JWT }) {
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
    },
  },
  events: {
    async createUser({ user }: { user: User & { id: string } }) {
      // Ensure new users have the CLIENT role if no role is set
      if (!user.role) {
        const clientRole = await prisma.role.findUnique({
          where: { name: "CLIENT" },
        });

        if (clientRole) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { roleId: clientRole.id },
            });
          } catch (error) {
            console.error("Error setting user role:", error);
          }
        }
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  }
};

export const { auth, signIn, signOut } = NextAuth(authOptions as AuthOptions);