// [기능] 역할 분기(1단계) - 로그인 여부와 role(MART_MANAGER/TECHNICIAN/HQ_ADMIN)에
// 따라 URL 진입 자체를 막습니다. API 라우트 내부의 session.user.role 재검증과
// 함께 "이중 방어"를 구성합니다 (README "아키텍처 핵심 포인트" 참고).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  MART_MANAGER: "/mart",
  TECHNICIAN: "/technician",
  HQ_ADMIN: "/hq"
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // [기능] 회원가입 페이지도 로그인 페이지와 동일하게: 비로그인 상태는 통과,
  // 이미 로그인된 상태면 자기 역할 홈으로 돌려보냅니다.
  const isPublicAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!token) {
    if (isPublicAuthPage) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const home = ROLE_HOME[role] ?? "/login";

  if (isPublicAuthPage) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith("/mart") && role !== "MART_MANAGER") {
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (pathname.startsWith("/technician") && role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (pathname.startsWith("/hq") && role !== "HQ_ADMIN") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/mart/:path*", "/technician/:path*", "/hq/:path*", "/login", "/signup"]
};
