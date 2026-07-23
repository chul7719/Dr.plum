"use client";

// [기능] 매장 담당자 - 내 지점 요청 목록 (GET /api/requests, storeId로 서버가 필터링)
// [디자인] 모바일 폭 고정 카드 리스트 + 상단 "새 요청 등록" CTA 버튼
import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileHeader } from "@/components/MobileHeader";
import { STATUS_BADGE_CLASS, getPhaseLabel } from "@/lib/format";

type RequestSummary = {
  id: string;
  equipmentType: string;
  symptom: string;
  urgent: boolean;
  status: string;
  region: string | null;
  store: { name: string };
  timelineEvents: { step: string }[];
};

export function MartRequestList() {
  const [requests, setRequests] = useState<RequestSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/requests")
      .then((res) => res.json())
      .then((data) => setRequests(data.requests ?? []));
  }, []);

  return (
    <div>
      <MobileHeader title="내 요청 목록" />

      <div className="flex gap-2 mb-4">
        <Link
          href="/mart/requests/new"
          className="flex-1 block text-center rounded-lg bg-brand text-white py-3 text-sm font-medium"
        >
          + 새 요청 등록
        </Link>
        <Link
          href="/mart/notices"
          className="flex-1 block text-center rounded-lg border border-gray-300 py-3 text-sm font-medium"
        >
          본사 공지
        </Link>
      </div>

      {requests === null && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}

      {requests?.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">등록된 요청이 없습니다.</p>
      )}

      <div className="space-y-2">
        {requests?.map((r) => (
          <Link
            key={r.id}
            href={`/mart/requests/${r.id}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4"
          >
            <div>
              <p className="text-sm font-semibold">
                {r.store.name} · {r.equipmentType}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {r.symptom}
                {r.urgent && <span className="ml-1 text-red-600 font-medium">· 긴급</span>}
              </p>
              {r.region && <p className="text-xs text-gray-400 mt-0.5">📍 {r.region}</p>}
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE_CLASS[r.status]}`}>
              {getPhaseLabel(r.status, r.timelineEvents.length)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
