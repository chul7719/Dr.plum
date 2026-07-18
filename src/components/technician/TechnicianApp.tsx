"use client";

// [기능] 협력업체 기사 앱 (모바일 전용 화면)
// 네 가지 흐름을 탭으로 나눠 보여줍니다.
//   1) 신규요청(README 로드맵 1) - 아직 아무도 선정되지 않은 요청에 가격/방문예정일시를 제안
//   2) 제안한 요청 - 매장의 선택을 기다리는 중인 내 제안, 수정 가능
//   3) 진행 작업(README 로드맵 3) - 내가 선정된 작업의 "출발/도착"을 직접 트리거
//   4) 작업완료 - 완료보고(README 로드맵 2, 사진 포함)까지 마친 작업 이력
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MobileHeader } from "@/components/MobileHeader";
import { fmtWon, fmtScheduledAt } from "@/lib/format";

type Quote = {
  id: string;
  vendorId: string;
  price: number;
  scheduledAt: string;
  note: string | null;
  vendor: { name: string };
};
type RequestItem = {
  id: string;
  equipmentType: string;
  symptom: string;
  urgent: boolean;
  status: string;
  store: { name: string };
  quotes: Quote[];
  selectedQuote: Quote | null;
  timelineEvents: { step: string }[];
  review: { stars: number; text: string | null } | null;
};

// [기능] 짧은 주기 폴링 - 새 요청/입찰 결과가 화면을 새로고침하지 않아도
// 자동으로 반영되도록 합니다 (README 로드맵 3: "WebSocket이나 짧은 주기
// 폴링이 필요합니다"의 폴링 방식 구현).
const POLL_INTERVAL_MS = 6000;

// [디자인] 탭 정의 - 라벨과 그 탭에 표시할 요청 개수(뱃지)를 함께 관리
type TabKey = "open" | "pending" | "progress" | "completed";
const TAB_LABEL: Record<TabKey, string> = {
  open: "신규요청",
  pending: "제안한 요청",
  progress: "진행 작업",
  completed: "작업완료"
};

export function TechnicianApp() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<RequestItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabKey>("open");

  async function load() {
    const res = await fetch("/api/requests");
    const json = await res.json();
    setRequests(json.requests ?? []);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  async function act(id: string, body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    await load();
    setBusy(false);
    return res.ok;
  }

  const vendorId = session?.user?.vendorId;
  const openForBid = requests?.filter((r) => r.status === "QUOTING" && !r.quotes.some((q) => q.vendorId === vendorId)) ?? [];
  const myPendingBids = requests?.filter((r) => r.status === "QUOTING" && r.quotes.some((q) => q.vendorId === vendorId)) ?? [];
  const mine = requests?.filter((r) => r.selectedQuote?.vendorId === vendorId && ["ACCEPTED", "IN_PROGRESS"].includes(r.status)) ?? [];
  // [기능] 작업완료 목록 - 내가 선정돼 완료보고까지 마친(COMPLETED) 또는 정산까지 끝난(PAID) 요청
  const completed = requests?.filter((r) => r.selectedQuote?.vendorId === vendorId && ["COMPLETED", "PAID"].includes(r.status)) ?? [];

  const counts: Record<TabKey, number> = {
    open: openForBid.length,
    pending: myPendingBids.length,
    progress: mine.length,
    completed: completed.length
  };

  return (
    <div>
      <MobileHeader title="기사 앱" />

      {/* [디자인] 탭 바 - 4개 섹션을 탭으로 전환 */}
      <div className="grid grid-cols-4 gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {(Object.keys(TAB_LABEL) as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md py-2 text-xs font-medium ${
              tab === key ? "bg-white text-brand shadow-sm" : "text-gray-500"
            }`}
          >
            {TAB_LABEL[key]}
            {counts[key] > 0 && <span className="ml-1">{counts[key]}</span>}
          </button>
        ))}
      </div>

      {/* [디자인] 탭 1: 입찰 가능한 신규 요청 - 아직 내가 제안을 넣지 않은 건 */}
      {tab === "open" && (
        <div className="space-y-2">
          {openForBid.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">입찰 가능한 요청이 없습니다.</p>}
          {openForBid.map((r) => (
            <BidCard
              key={r.id}
              request={r}
              busy={busy}
              onSubmit={(price, scheduledAt, note) => submitQuote(r.id, price, scheduledAt, note, load, setBusy)}
            />
          ))}
        </div>
      )}

      {/* [디자인] 탭 2: 내가 제안한 요청 - 매장의 선택을 기다리는 중 */}
      {tab === "pending" && (
        <div className="space-y-2">
          {myPendingBids.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">제안한 요청이 없습니다.</p>}
          {myPendingBids.map((r) => {
            const myQuote = r.quotes.find((q) => q.vendorId === vendorId)!;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {r.store.name} · {r.equipmentType}
                  </p>
                  <span className="text-xs font-semibold text-amber-600">매장 선택 대기중</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  {r.symptom}
                  {r.urgent && <span className="ml-1 text-red-600 font-medium">· 긴급</span>}
                </p>
                <p className="text-sm font-bold">
                  {fmtWon(myQuote.price)} · {fmtScheduledAt(myQuote.scheduledAt)}
                </p>
                <BidCard
                  request={r}
                  busy={busy}
                  revise
                  editingQuote={myQuote}
                  onSubmit={(price, scheduledAt, note) => submitQuote(r.id, price, scheduledAt, note, load, setBusy)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* [디자인] 탭 3: 선정되어 진행 중인 내 작업 - 출발/도착/완료보고 */}
      {tab === "progress" && (
        <div className="space-y-2">
          {mine.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">진행 중인 작업이 없습니다.</p>}
          {mine.map((r) => (
            <ProgressCard key={r.id} request={r} busy={busy} onAct={act} />
          ))}
        </div>
      )}

      {/* [디자인] 탭 4: 작업완료 목록 - 완료보고를 마친(정산 대기/완료 포함) 작업 이력 */}
      {tab === "completed" && (
        <div className="space-y-2">
          {completed.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">완료한 작업이 없습니다.</p>}
          {completed.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {r.store.name} · {r.equipmentType}
                </p>
                <span className="text-xs font-semibold text-green-700">{r.status === "PAID" ? "정산 완료" : "완료보고 제출"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {r.symptom}
                {r.urgent && <span className="ml-1 text-red-600 font-medium">· 긴급</span>}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-bold">{r.selectedQuote && fmtWon(r.selectedQuote.price)}</p>
                {r.review && (
                  <span className="text-xs text-amber-500">
                    {"★".repeat(r.review.stars)}
                    {"☆".repeat(5 - r.review.stars)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// [기능] 입찰 제출: 가격/방문예정일시를 서버에 POST하고 목록을 새로고침합니다
async function submitQuote(
  requestId: string,
  price: number,
  scheduledAt: string,
  note: string,
  reload: () => Promise<void>,
  setBusy: (b: boolean) => void
) {
  setBusy(true);
  await fetch(`/api/requests/${requestId}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price, scheduledAt, note: note || undefined })
  });
  await reload();
  setBusy(false);
}

// [기능] 오늘 날짜를 <input type="date"> 값 형식(YYYY-MM-DD)으로 반환 - 방문 예정일 기본값
function todayInputValue(base: Date = new Date()) {
  const offset = base.getTimezoneOffset() * 60000;
  return new Date(base.getTime() - offset).toISOString().slice(0, 10);
}

// [기능] 현재 시각을 <input type="time"> 값 형식(HH:mm, 24시간제)으로 반환 - 도착 예정 시각 기본값
function nowTimeValue(base: Date = new Date()) {
  return `${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`;
}

// [디자인] 입찰 제안 입력 카드 - 신규 요청 카드 자체이거나(펼치기 전),
// 이미 제안한 건이면 "수정하기" 토글로 재사용합니다.
function BidCard({
  request,
  busy,
  revise,
  editingQuote,
  onSubmit
}: {
  request: RequestItem;
  busy: boolean;
  revise?: boolean;
  editingQuote?: Quote;
  onSubmit: (price: number, scheduledAt: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(editingQuote ? String(editingQuote.price) : "");
  const editingAt = editingQuote ? new Date(editingQuote.scheduledAt) : null;
  const [scheduledDate, setScheduledDate] = useState(editingAt ? todayInputValue(editingAt) : todayInputValue());
  const [scheduledTime, setScheduledTime] = useState(editingAt ? nowTimeValue(editingAt) : nowTimeValue());
  const [note, setNote] = useState(editingQuote?.note ?? "");

  function submit() {
    const p = Number(price);
    if (!p || !scheduledDate || !scheduledTime) return;
    // [기능] 날짜(YYYY-MM-DD) + 시각(HH:mm)을 하나의 절대 일시로 합쳐서 전송합니다.
    // 타임존 표시가 없는 문자열은 브라우저가 "현지 시각"으로 해석하므로,
    // 기사가 입력한 그대로의 시각이 그대로 저장됩니다.
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
    onSubmit(p, scheduledAt, note);
    setOpen(false);
  }

  if (revise) {
    return open ? (
      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
        <BidFields
          price={price}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          note={note}
          setPrice={setPrice}
          setScheduledDate={setScheduledDate}
          setScheduledTime={setScheduledTime}
          setNote={setNote}
        />
        <button disabled={busy} onClick={submit} className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60">
          제안 수정하기
        </button>
      </div>
    ) : (
      <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-md border border-gray-300 py-2 text-sm font-medium">
        제안 수정하기
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {request.store.name} · {request.equipmentType}
        </p>
        {request.urgent && <span className="text-xs font-semibold text-red-600">긴급</span>}
      </div>
      <p className="text-xs text-gray-500 mt-1 mb-3">{request.symptom}</p>

      {open ? (
        <div className="space-y-2">
          <BidFields
            price={price}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            note={note}
            setPrice={setPrice}
            setScheduledDate={setScheduledDate}
            setScheduledTime={setScheduledTime}
            setNote={setNote}
          />
          <button disabled={busy} onClick={submit} className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60">
            이 가격으로 제안 보내기
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium">
          제안하기
        </button>
      )}
    </div>
  );
}

// [디자인] 가격 / 방문 예정일 / 도착 예정 시각(24시간제) / 메모 입력 필드.
// 방문 예정일 기본값은 오늘이고, 시각은 항상 24시간제(HH:mm) 입력이라
// 당일이든 며칠 뒤든 정확히 몇 시에 도착할지 정할 수 있습니다.
function BidFields({
  price,
  scheduledDate,
  scheduledTime,
  note,
  setPrice,
  setScheduledDate,
  setScheduledTime,
  setNote
}: {
  price: string;
  scheduledDate: string;
  scheduledTime: string;
  note: string;
  setPrice: (v: string) => void;
  setScheduledDate: (v: string) => void;
  setScheduledTime: (v: string) => void;
  setNote: (v: string) => void;
}) {
  return (
    <>
      <input
        type="number"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="견적가 (원)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <label className="block w-1/2 text-xs text-gray-500">
          방문 예정일
          <input
            type="date"
            value={scheduledDate}
            min={todayInputValue()}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
        </label>
        <label className="block w-1/2 text-xs text-gray-500">
          도착 예정 시각
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
        </label>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="메모 (선택, 예: 부품 재고 있음)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </>
  );
}

// [디자인] 선정된 작업 카드 - 상태에 따라 출발/도착/완료보고 버튼이 순서대로 바뀝니다
function ProgressCard({
  request,
  busy,
  onAct
}: {
  request: RequestItem;
  busy: boolean;
  onAct: (id: string, body: Record<string, unknown>) => Promise<boolean>;
}) {
  const stepCount = request.timelineEvents.length; // 1=선정, 2=출발, 3=현장도착

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold">
          {request.store.name} · {request.equipmentType}
        </p>
        <span className="text-xs text-gray-500">{request.status === "IN_PROGRESS" ? "수리 중" : "업체 선정"}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {request.symptom}
        {request.urgent && <span className="ml-1 text-red-600 font-medium">· 긴급</span>}
      </p>

      {/* [기능] 실시간 위치·ETA - 출발/도착 버튼이 곧 GPS 이벤트를 대체하는 트리거입니다 */}
      {request.status === "ACCEPTED" && (
        <button
          disabled={busy}
          onClick={() => onAct(request.id, { action: "depart" })}
          className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60"
        >
          출발했어요
        </button>
      )}

      {request.status === "IN_PROGRESS" && stepCount === 2 && (
        <button
          disabled={busy}
          onClick={() => onAct(request.id, { action: "arrive" })}
          className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60"
        >
          현장 도착했어요
        </button>
      )}

      {request.status === "IN_PROGRESS" && stepCount === 3 && <CompletionForm requestId={request.id} busy={busy} onAct={onAct} />}
    </div>
  );
}

// [기능] 완료보고 - 조치 내용(텍스트) + 사진(들)을 base64로 읽어 첨부합니다.
// [디자인] 사진은 업로드 즉시 썸네일로 미리보기, 개별 삭제(x) 가능
const MAX_PHOTOS = 5;

function CompletionForm({
  requestId,
  busy,
  onAct
}: {
  requestId: string;
  busy: boolean;
  onAct: (id: string, body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const remaining = MAX_PHOTOS - photos.length;
    Array.from(fileList)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => setPhotos((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    const ok = await onAct(requestId, { action: "complete", notes, photos });
    if (ok) {
      setOpen(false);
      setNotes("");
      setPhotos([]);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium">
        완료보고 작성
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="교체 부품, 조치 내용을 입력하세요"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[64px]"
      />

      {/* [디자인] 사진 썸네일 그리드 */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative w-16 h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`현장 사진 ${i + 1}`} className="w-16 h-16 object-cover rounded-md border border-gray-200" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-xs leading-5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <label className="block w-full text-center rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 cursor-pointer">
          + 현장 사진 추가 ({photos.length}/{MAX_PHOTOS})
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      )}

      <button disabled={busy} onClick={submit} className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60">
        완료보고 제출
      </button>
    </div>
  );
}
