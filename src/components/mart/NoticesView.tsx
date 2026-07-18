"use client";

// [디자인] 매장용 본사 공지 화면 - 뒤로가기 있는 헤더 + 읽기 전용 목록(NoticeList)
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { NoticeList } from "@/components/NoticeList";

export function NoticesView() {
  const router = useRouter();
  return (
    <div>
      <MobileHeader title="본사 공지" onBack={() => router.push("/mart")} />
      <NoticeList />
    </div>
  );
}
