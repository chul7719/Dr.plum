"use client";

// [디자인] 본사 대시보드 좌측 사이드바 - 요즘 AI 서비스들처럼 접었다 펼 수 있는
// 고정 내비게이션입니다. /hq/layout.tsx가 모든 /hq/* 페이지를 이걸로 감싸서,
// 예전에 페이지마다 따로 있던 "대시보드로" 뒤로가기 링크와 로그아웃 버튼을
// 이 사이드바 하나로 통일했습니다 (항상 보이므로 실질적으로 어디서든
// "뒤로가기"가 되는 셈입니다).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/hq", label: "대시보드", icon: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" },
  { href: "/hq/settlements", label: "정산 관리", icon: "M3 7h18M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7M3 7l2-3h14l2 3M9 12h6" },
  { href: "/hq/vendors", label: "업체 관리", icon: "M4 21V9l8-5 8 5v12M9 21v-6h6v6M4 21h16" },
  { href: "/hq/equipment-types", label: "설비 종류 관리", icon: "M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z" },
  { href: "/hq/notices", label: "공지사항", icon: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Zm14-3a6 6 0 0 1 0 10" }
];

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

export function HqSidebar({ organizationName }: { organizationName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`${
        open ? "w-56" : "w-14"
      } flex-shrink-0 border-r border-gray-200 bg-white flex flex-col sticky top-0 h-screen transition-[width] duration-200`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
        {open && <span className="text-sm font-semibold truncate">{organizationName ?? "설비닥터"}</span>}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "메뉴 접기" : "메뉴 펼치기"}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
        >
          <Icon path={open ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={open ? undefined : item.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-brand-light text-brand" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon path={item.icon} className="w-4 h-4 flex-shrink-0" />
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={open ? undefined : "로그아웃"}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 w-full"
        >
          <Icon path="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" className="w-4 h-4 flex-shrink-0" />
          {open && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
