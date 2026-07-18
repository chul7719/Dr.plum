"use client";

// [기능] 본사 공지사항 읽기 전용 목록 - 매장 담당자 앱과 기사 앱이 공통으로 씁니다.
// GET /api/notices가 role에 맞는 본사(organization) 공지만 내려줍니다
// (src/lib/org-scope.ts). 공용 마켓플레이스 업체 소속 기사처럼 특정 본사에
// 속하지 않으면 빈 목록이 내려옵니다.
import { useEffect, useState } from "react";

type Notice = { id: string; title: string; content: string; createdAt: string };

function fmtDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function NoticeList() {
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => setNotices(data.notices ?? []));
  }, []);

  if (notices === null) {
    return <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>;
  }
  if (notices.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">등록된 본사 공지가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {notices.map((n) => (
        <div key={n.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold">{n.title}</p>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{fmtDate(n.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.content}</p>
        </div>
      ))}
    </div>
  );
}
