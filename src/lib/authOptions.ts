import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { User } from "@/models/user.model";
import Database from "@/lib/database";
import { verifyPassword } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "evro-desert-production-auth-secret-key-3605903",
    session: {
        strategy: "jwt",
    },
    providers: [
        ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
            ? [
                  GoogleProvider({
                      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
                  }),
              ]
            : []),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    await Database();
                    const user = await User.findOne({ email: credentials.email });
                    if (!user) return null;
                    const valid = await verifyPassword(credentials.password, user.password);
                    if (user && valid) {
                        return user;
                    }
                    return null;
                } catch {
                    return null;
                }
            },
        }),
    ],
};
