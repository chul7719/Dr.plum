"use client";

// [기능] 본사 전용 협력업체 관리 (README: "업체 등록") - 등록/수정/삭제(CRUD)
// 여기서 등록한 업체는 이 본사 소속 매장의 요청에만 입찰할 수 있습니다
// (공용 마켓플레이스 업체와 달리 다른 프랜차이즈 요청에는 안 보임).
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type Vendor = {
  id: string;
  name: string;
  ratingAvg: number;
  technicians: { id: string; name: string; email: string }[];
};

export function VendorList() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    const res = await fetch("/api/vendors");
    const json = await res.json();
    setVendors(json.vendors ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "등록에 실패했습니다.");
    } else {
      setNewName("");
    }
    await load();
    setBusy(false);
  }

  async function rename(id: string) {
    if (!editingName.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "수정에 실패했습니다.");
    } else {
      setEditingId(null);
    }
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "삭제에 실패했습니다.");
    }
    await load();
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">업체 관리</h1>
        <div className="flex items-center gap-2">
          <Link href="/hq" className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5">
            대시보드로
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* [디자인] 새 업체 등록 폼 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="업체 이름 (예: 한성설비)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          disabled={busy || !newName.trim()}
          onClick={create}
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          등록
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {vendors === null && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}
      {vendors?.length === 0 && <p className="text-sm text-gray-400 text-center py-10">등록된 업체가 없습니다.</p>}

      <div className="space-y-2">
        {vendors?.map((v) => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === v.id ? (
              <div className="flex gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button disabled={busy} onClick={() => rename(v.id)} className="rounded-md bg-brand text-white px-3 py-2 text-xs font-medium">
                  저장
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium">
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {v.name} <span className="text-xs text-gray-400 font-normal">★ {v.ratingAvg.toFixed(1)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {v.technicians.length === 0
                      ? "소속 기사 없음"
                      : `소속 기사 ${v.technicians.length}명 · ${v.technicians.map((t) => t.name).join(", ")}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(v.id);
                      setEditingName(v.name);
                    }}
                    className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1"
                  >
                    수정
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(v.id)}
                    className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1 text-red-600 disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
