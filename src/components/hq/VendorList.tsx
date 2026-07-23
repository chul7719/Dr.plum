"use client";

// [기능] 본사 전용 협력업체 관리 (README: "업체 등록") - 등록/수정/삭제(CRUD)
// 여기서 등록한 업체는 이 본사 소속 매장의 요청에만 입찰할 수 있습니다
// (공용 마켓플레이스 업체와 달리 다른 프랜차이즈 요청에는 안 보임).
import { useEffect, useState } from "react";
import { VendorRegionPicker, type PickedRegion } from "@/components/hq/VendorRegionPicker";

const LEVEL_LABEL: Record<string, string> = { SIDO: "도", SGG: "구/시", DONG: "동" };

type Vendor = {
  id: string;
  name: string;
  ratingAvg: number;
  technicians: { id: string; name: string; email: string }[];
  regions: { id: string; level: string; code: string; label: string }[];
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

  async function addRegion(vendorId: string, region: PickedRegion) {
    const res = await fetch(`/api/vendors/${vendorId}/regions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(region)
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "지역 추가에 실패했습니다.");
    }
    await load();
  }

  async function removeRegion(vendorId: string, regionId: string) {
    setBusy(true);
    const res = await fetch(`/api/vendors/${vendorId}/regions/${regionId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "지역 삭제에 실패했습니다.");
    }
    await load();
    setBusy(false);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">업체 관리</h1>

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

            {/* [디자인] 서비스 지역 - 도/시/군/구/동 어느 단위든 여러 개 중복 등록 가능 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {v.regions.length === 0 && <p className="text-xs text-gray-400">등록된 서비스 지역이 없습니다.</p>}
                {v.regions.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full pl-2 pr-1 py-1"
                  >
                    <span className="text-gray-400">{LEVEL_LABEL[r.level]}</span>
                    {r.label}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeRegion(v.id, r.id)}
                      className="w-4 h-4 rounded-full hover:bg-gray-300 leading-none disabled:opacity-40"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <VendorRegionPicker existing={v.regions} onAdd={(region) => addRegion(v.id, region)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
