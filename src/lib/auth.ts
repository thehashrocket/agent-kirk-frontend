import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import type { DefaultSession, Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";

// Define custom types for the session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  debug: true,
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
    async signIn({ user, account }: { user: User; account: { provider: string } | null }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { role: true },
          });

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
            user.id = newUser.id;
            user.role = newUser.role;
          } else {
            // Update the user object with existing user's role
            user.id = existingUser.id;
            user.role = existingUser.role;
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async session({ 
      session, 
      user 
    }: { 
      session: Session; 
      user: User & { role: Role; id: string; }
    }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
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

export const { auth, signIn, signOut } = NextAuth(authOptions); 