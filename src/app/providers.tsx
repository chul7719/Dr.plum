"use client";

// [기능] 클라이언트 컴포넌트에서 useSession()을 쓰기 위한 NextAuth Provider 래퍼
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
