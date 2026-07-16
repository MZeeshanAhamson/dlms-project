import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getDatabase } from "@/lib/db";
import { auditLogs, users, type Role } from "@/lib/db/schema";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST !== "false",
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const input = loginSchema.safeParse(credentials);
        if (!input.success) return null;

        const database = getDatabase();
        const [user] = await database.select().from(users).where(eq(users.email, input.data.email)).limit(1);
        if (!user?.isActive || !(await compare(input.data.password, user.passwordHash))) return null;

        await database.transaction(async (tx) => {
          await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
          await tx.insert(auditLogs).values({
            actorUserId: user.id,
            branchId: user.branchId,
            action: "AUTH_SUCCESS",
            entityType: "USER",
            entityId: user.id,
          });
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role, branchId: user.branchId, authVersion: user.authVersion };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.authVersion = user.authVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as Role;
      session.user.branchId = typeof token.branchId === "string" ? token.branchId : null;
      session.user.authVersion = typeof token.authVersion === "number" ? token.authVersion : 0;
      return session;
    },
  },
});
