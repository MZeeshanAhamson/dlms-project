import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/db/schema";

declare module "next-auth" {
  interface User {
    role: Role;
    branchId: string | null;
    authVersion: number;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      branchId: string | null;
      authVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    branchId?: string | null;
    authVersion?: number;
  }
}
