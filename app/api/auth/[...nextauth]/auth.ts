import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
  },
  debug: process.env.NODE_ENV === "development",

  callbacks: {
    async signIn({ user }) {
      if (user) {
        console.log("SignIn callback - user:", user);
      }
      return true;
    },
    async jwt({ token, user }) {
      console.log("JWT callback - token:", token, "user:", user);
      if (user) {
        token.userId = user.id;
        console.log("JWT callback - set userId:", user.id);
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session, "token:", token);
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
        console.log("Session callback - set user.id:", token.userId);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);

      // 프로덕션에서는 현재 요청된 도메인 자동 감지
      if (process.env.NODE_ENV === "production") {
        // 현재 요청된 도메인을 자동으로 감지
        const currentDomain = baseUrl;
        console.log(
          "🔄 Production redirect - auto-detected domain:",
          currentDomain
        );

        if (url.startsWith("/")) return `${currentDomain}${url}`;
        else if (new URL(url).origin === currentDomain) return url;
        return currentDomain;
      }

      // 로컬에서는 localhost 사용
      console.log("🔄 Local redirect - using:", baseUrl);
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
