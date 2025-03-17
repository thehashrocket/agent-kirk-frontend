import "next-auth";
import { Role, User, Account } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: Role;
    accounts: Account[];
  }
} 