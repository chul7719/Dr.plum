"use client";

// [기능] 본사 정산 관리 화면 - 지점별로 발생한 정산 건을
// "정산 대기 → 청구서 발행 → 지급 완료" 순서로 상태를 바꿉니다.
// "지급 완료"를 누르면 서버가 src/lib/payment.ts의 결제 인터페이스(지금은
// MockPaymentGateway)를 호출하고, 성공 시 받은 거래번호(transactionId)를
// 함께 저장합니다 (README 로드맵 4 - 결제/PG 연동은 인터페이스만 준비).
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtWon } from "@/lib/format";
import { LogoutButton } from "@/components/LogoutButton";

type Settlement = {
  id: string;
  amount: number;
  commissionAmount: number;
  payoutAmount: number;
  status: "PENDING" | "INVOICED" | "PAID";
  transactionId: string | null;
  request: {
    store: { name: string };
    equipmentType: string;
    selectedQuote: { vendor: { name: string } } | null;
  };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "정산 대기",
  INVOICED: "청구서 발행",
  PAID: "지급 완료"
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  INVOICED: "bg-brand-light text-brand",
  PAID: "bg-green-50 text-green-700"
};

export function SettlementList() {
  const [items, setItems] = useState<Settlement[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/settlements");
    const json = await res.json();
    setItems(json.settlements ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Settlement["status"]) {
    setBusyId(id);
    await fetch("/api/settlements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    await load();
    setBusyId(null);
  }

  const totalPending = items?.filter((s) => s.status !== "PAID").reduce((sum, s) => sum + s.payoutAmount, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">정산 관리</h1>
          <p className="text-sm text-gray-500 mt-1">협력업체 지급 대기 금액: {fmtWon(totalPending)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hq" className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5">
            대시보드로
          </Link>
          <LogoutButton />
        </div>
      </div>

      {items === null && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}
      {items?.length === 0 && <p className="text-sm text-gray-400 text-center py-10">정산 내역이 없습니다.</p>}

      {/* [디자인] 모바일: 카드형 목록 */}
      <div className="md:hidden space-y-2">
        {items?.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-semibold">
                  {s.request.store.name} · {s.request.equipmentType}
                </p>
                <p className="text-xs text-gray-500">{s.request.selectedQuote?.vendor.name}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_CLASS[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5 mb-3">
              <div className="flex justify-between"><span>결제 총액</span><span>{fmtWon(s.amount)}</span></div>
              <div className="flex justify-between"><span>플랫폼 수수료</span><span>{fmtWon(s.commissionAmount)}</span></div>
              <div className="flex justify-between font-semibold text-gray-700"><span>업체 지급액</span><span>{fmtWon(s.payoutAmount)}</span></div>
            </div>
            <SettlementActions status={s.status} busy={busyId === s.id} onChange={(st) => setStatus(s.id, st)} />
            {s.transactionId && <p className="text-xs text-gray-400 mt-2">거래번호 {s.transactionId}</p>}
          </div>
        ))}
      </div>

      {/* [디자인] 데스크톱(md 이상): 테이블형 */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 font-medium">지점 / 설비</th>
              <th className="px-4 py-2 font-medium">협력업체</th>
              <th className="px-4 py-2 font-medium">결제 총액</th>
              <th className="px-4 py-2 font-medium">수수료</th>
              <th className="px-4 py-2 font-medium">지급액</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2 font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items?.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.request.store.name} · {s.request.equipmentType}</td>
                <td className="px-4 py-2">{s.request.selectedQuote?.vendor.name}</td>
                <td className="px-4 py-2">{fmtWon(s.amount)}</td>
                <td className="px-4 py-2">{fmtWon(s.commissionAmount)}</td>
                <td className="px-4 py-2 font-medium">{fmtWon(s.payoutAmount)}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_CLASS[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <SettlementActions status={s.status} busy={busyId === s.id} onChange={(st) => setStatus(s.id, st)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementActions({
  status,
  busy,
  onChange
}: {
  status: Settlement["status"];
  busy: boolean;
  onChange: (status: Settlement["status"]) => void;
}) {
  if (status === "PAID") return <span className="text-xs text-gray-400">완료됨</span>;

  return (
    <div className="flex gap-2">
      {status === "PENDING" && (
        <button
          disabled={busy}
          onClick={() => onChange("INVOICED")}
          className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1 disabled:opacity-60"
        >
          청구서 발행
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => onChange("PAID")}
        className="text-xs font-medium bg-brand text-white rounded-md px-2 py-1 disabled:opacity-60"
      >
        지급 완료 처리
      </button>
    </div>
  );
}
