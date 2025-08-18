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

      // 프로덕션에서는 항상 기본 도메인 사용
      if (process.env.NODE_ENV === "production") {
        const productionUrl = "https://secondchap.vercel.app";
        console.log("🔄 Production redirect - using:", productionUrl);

        if (url.startsWith("/")) return `${productionUrl}${url}`;
        else if (new URL(url).origin === productionUrl) return url;
        return productionUrl;
      }

      // 로컬에서는 localhost 사용
      console.log("🔄 Local redirect - using:", baseUrl);
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
