// [기능] NextAuth 세션/토큰 타입 확장 - role, storeId, vendorId, organizationId를
// 세션 어디서든(서버 컴포넌트, API 라우트, 클라이언트 useSession) 타입 안전하게
// 쓸 수 있도록 라이브러리 기본 타입에 필드를 추가합니다.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    storeId?: string;
    vendorId?: string;
    organizationId?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      storeId?: string;
      vendorId?: string;
      organizationId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    storeId?: string;
    vendorId?: string;
    organizationId?: string;
  }
}
