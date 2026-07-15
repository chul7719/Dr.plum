import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// [기능] 로그인/세션 - 이메일+비밀번호 검증 후 역할(role)과
// 소속 정보(storeId/vendorId/organizationId)를 세션에 실어 보냅니다.
// 미들웨어와 각 API 라우트는 이 세션 값만으로 접근 범위를 판단합니다.
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId ?? undefined,
          vendorId: user.vendorId ?? undefined,
          organizationId: user.organizationId ?? undefined
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.storeId = user.storeId;
        token.vendorId = user.vendorId;
        token.organizationId = user.organizationId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.storeId = token.storeId as string | undefined;
        session.user.vendorId = token.vendorId as string | undefined;
        session.user.organizationId = token.organizationId as string | undefined;
      }
      return session;
    }
  }
};
