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
    async signIn({ user, account, profile }) {
      console.log("SignIn callback - user:", user, "account:", account);
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("JWT callback - token:", token, "user:", user, "account:", account);
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session, "token:", token);
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);
      
      // 상대 URL인 경우 baseUrl과 결합
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // 같은 도메인의 URL인 경우 그대로 반환
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // 기본적으로 baseUrl 반환
      return baseUrl;
    },
  },
};
