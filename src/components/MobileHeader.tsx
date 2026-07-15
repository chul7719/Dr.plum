"use client";

// [디자인] 모바일 화면 공용 상단바 - 제목 + (선택)뒤로가기 버튼 + 로그아웃 버튼.
// 매장/기사 앱의 모든 페이지가 이 컴포넌트로 상단 톤을 통일합니다.
import { signOut } from "next-auth/react";

export function MobileHeader({
  title,
  onBack
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-gray-500">
            ←
          </button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs text-gray-400 border border-gray-200 rounded-md px-2 py-1"
      >
        로그아웃
      </button>
    </div>
  );
}
