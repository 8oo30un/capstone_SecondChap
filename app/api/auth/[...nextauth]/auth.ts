import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          const { PrismaClient } = await import("@prisma/client");
          const prisma = new PrismaClient();

          // 사용자가 이미 존재하는지 확인
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          // 사용자가 존재하지 않으면 생성
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image!,
              },
            });
            console.log("✅ 새 사용자 생성됨:", dbUser.id);
          }

          // token에 userId 설정
          user.id = dbUser.id;
          await prisma.$disconnect();
        } catch (error) {
          console.error("❌ 사용자 생성/조회 오류:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  debug: true,
};
