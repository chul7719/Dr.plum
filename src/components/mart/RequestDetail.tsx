"use client";

// [기능] 매장 담당자 - 요청 상세 화면
// 상태(status)에 따라 4개 구간을 전환합니다: 견적 비교 → 실시간 진행상황 →
// 완료보고 확인+리뷰 → 정산 완료. ACCEPTED/IN_PROGRESS 구간에서는 기사 앱이
// 보내는 출발/도착 이벤트를 짧은 주기 폴링으로 받아 화면이 저절로 갱신됩니다
// (README 로드맵 3 - 실시간 위치·ETA).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { fmtWon, fmtArrival, TIMELINE_STEPS } from "@/lib/format";

type Quote = {
  id: string;
  price: number;
  scheduledAt: string;
  note: string | null;
  vendor: { name: string; ratingAvg: number };
};

type RequestData = {
  id: string;
  equipmentType: string;
  symptom: string;
  urgent: boolean;
  status: string;
  store: { name: string };
  quotes: Quote[];
  selectedQuote: Quote | null;
  timelineEvents: { step: string; occurredAt: string }[];
  completionNotes: string | null;
  photos: { id: string; dataUrl: string }[];
  settlement: { transactionId: string | null } | null;
};

// [기능] 실시간 반영을 위한 폴링 주기 - 기사가 출발/도착 버튼을 누르면
// 이 주기 내로 매장 화면에 자동 반영됩니다.
const POLL_INTERVAL_MS = 5000;

export function RequestDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<RequestData | null>(null);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  async function load() {
    const res = await fetch(`/api/requests/${id}`);
    const json = await res.json();
    setData(json.request);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // [기능] 진행 중인 작업은 짧은 주기로 다시 불러와 기사 쪽 변경을 반영합니다.
  useEffect(() => {
    if (!data || !["ACCEPTED", "IN_PROGRESS"].includes(data.status)) return;
    const poll = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, id]);

  // [기능] ETA 카운트다운을 1초 단위로 갱신하기 위한 시계
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    await load();
    setBusy(false);
  }

  if (!data) {
    return (
      <div>
        <MobileHeader title="요청 상세" onBack={() => router.push("/mart")} />
        <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>
      </div>
    );
  }

  const step = data.timelineEvents.length - 1; // 0~4

  return (
    <div>
      <MobileHeader title="요청 상세" onBack={() => router.push("/mart")} />

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            {data.equipmentType} · {data.symptom}
          </p>
          {data.urgent && <span className="text-xs font-semibold text-red-600">긴급</span>}
        </div>
        <p className="text-xs text-gray-500 mt-1">{data.store.name}</p>
      </div>

      {/* [디자인] 견적(입찰) 비교 - 협력업체들이 보낸 제안을 가격순으로 나열 */}
      {data.status === "QUOTING" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {data.quotes.length === 0 ? "아직 도착한 제안이 없습니다. 잠시만 기다려주세요." : `제안 ${data.quotes.length}건 도착`}
          </p>
          {data.quotes.map((q, i) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 relative">
              {i === 0 && (
                <span className="absolute top-3 right-3 text-xs font-semibold bg-brand-light text-brand px-2 py-0.5 rounded-full">
                  최저가
                </span>
              )}
              <p className="text-sm font-semibold">{q.vendor.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                ★ {q.vendor.ratingAvg.toFixed(1)} · {fmtArrival(q.scheduledAt, now)}
              </p>
              {q.note && <p className="text-xs text-gray-500 mt-1">&ldquo;{q.note}&rdquo;</p>}
              <p className="text-lg font-bold mt-2 mb-3">{fmtWon(q.price)}</p>
              <button
                disabled={busy}
                onClick={() => patch({ action: "select", quoteId: q.id })}
                className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60"
              >
                {q.vendor.name} 선택하기
              </button>
            </div>
          ))}
        </div>
      )}

      {/* [디자인] 실시간 진행상황 타임라인 - 기사 앱의 출발/도착 액션이 폴링으로 반영됨 */}
      {["ACCEPTED", "IN_PROGRESS"].includes(data.status) && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-bold">
              {data.selectedQuote?.vendor.name.slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{data.selectedQuote?.vendor.name} 기사</p>
              <p className="text-xs text-gray-500">
                {data.equipmentType} · {data.symptom}
              </p>
            </div>
            {/* [기능] 실시간 ETA - 선정 이후 현장 도착 전까지 기사가 제안한 방문 예정 일시를 계속 계산해서 보여줌 */}
            {step < 2 && data.selectedQuote && (
              <span className="text-xs font-semibold text-brand text-right">{fmtArrival(data.selectedQuote.scheduledAt, now)}</span>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            {TIMELINE_STEPS.map((label, i) => (
              <div key={label} className={`flex items-start gap-3 ${i > step ? "opacity-40" : ""}`}>
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex-shrink-0 ${
                    i < step ? "bg-green-600 border-green-600" : i === step ? "bg-brand border-brand" : "border-gray-300"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  {i === step && i < 3 && <p className="text-xs text-gray-500">진행 중 · 자동 갱신됨</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* [디자인] 완료보고 확인 + 정산 및 리뷰 입력 */}
      {data.status === "COMPLETED" && data.selectedQuote && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold">작업이 완료됐어요</p>
            <p className="text-xs text-gray-500 mt-1">
              {data.store.name} · {data.equipmentType}
            </p>
          </div>

          {/* [기능] 완료보고 내용 - 기사가 남긴 조치 내용/사진 (README 로드맵 2) */}
          {(data.completionNotes || data.photos.length > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">기사 완료보고</p>
              {data.completionNotes && <p className="text-sm mb-3">{data.completionNotes}</p>}
              {data.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.id} src={p.dataUrl} alt="현장 사진" className="w-20 h-20 object-cover rounded-md border border-gray-200" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">선정 업체</span>
              <span>{data.selectedQuote.vendor.name}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2 mt-1">
              <span>결제 금액</span>
              <span>{fmtWon(data.selectedQuote.price)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500">{data.selectedQuote.vendor.name}, 어떠셨나요?</p>
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setStars(n)}>
                  <span className={n <= stars ? "text-amber-500" : "text-gray-300"}>★</span>
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="도착시간, 친절도, 수리 품질은 어땠나요?"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[64px]"
            />
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
              같은 증상이 이전에도 있었어요 (재발생 표시)
            </label>
            <button
              disabled={busy || stars === 0}
              onClick={() => patch({ action: "review", stars, text: reviewText, recurring })}
              className="w-full rounded-md bg-brand text-white py-2.5 text-sm font-medium disabled:opacity-60"
            >
              리뷰 등록하고 완료
            </button>
          </div>
        </div>
      )}

      {/* [디자인] 완료된 정산 요약 */}
      {data.status === "PAID" && data.selectedQuote && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold">정산이 완료된 요청입니다</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.selectedQuote.vendor.name} · {fmtWon(data.selectedQuote.price)}
          </p>
          {data.settlement?.transactionId && (
            <p className="text-xs text-gray-400 mt-2">거래번호 {data.settlement.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
}
