"use client";

// [디자인] PC 대시보드용 로그아웃 버튼 - 모바일 화면은 MobileHeader가 이미
// 로그아웃 버튼을 포함하지만, 본사 대시보드(/hq, /hq/settlements)는 서버
// 컴포넌트 + 별도 헤더를 쓰고 있어서 이 버튼을 따로 둡니다.
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5 text-gray-600"
    >
      로그아웃
    </button>
  );
}
