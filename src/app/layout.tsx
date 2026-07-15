// [기능] 루트 레이아웃 - NextAuth SessionProvider로 전체 앱을 감싸 어디서든
// useSession()을 쓸 수 있게 합니다 ([디자인] 전역 폰트/배경은 globals.css 참고).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "설비닥터 · 마트 설비 유지보수 플랫폼",
  description: "마트 설비 유지보수 매칭 플랫폼"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
