"use client";

// [기능] 설비 종류 목록 관리 (README) - 매장 담당자가 새 요청 등록 시 고르는
// 설비 종류 드롭다운의 원본 목록입니다. 등록/수정/삭제(CRUD).
import { useEffect, useState } from "react";

type EquipmentType = { id: string; name: string };

export function EquipmentTypeList() {
  const [items, setItems] = useState<EquipmentType[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    const res = await fetch("/api/equipment-types");
    const json = await res.json();
    setItems(json.equipmentTypes ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/equipment-types", {
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
    const res = await fetch(`/api/equipment-types/${id}`, {
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
    const res = await fetch(`/api/equipment-types/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "삭제에 실패했습니다.");
    }
    await load();
    setBusy(false);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">설비 종류 관리</h1>
      <p className="text-xs text-gray-500 mb-4">
        여기서 등록한 항목이 매장 담당자의 &ldquo;새 작업요청&rdquo; 화면 설비 종류 드롭다운에 그대로 나타납니다.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="설비 종류 이름 (예: 냉장 쇼케이스)"
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

      {items === null && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}
      {items?.length === 0 && <p className="text-sm text-gray-400 text-center py-10">등록된 설비 종류가 없습니다.</p>}

      <div className="space-y-2">
        {items?.map((it) => (
          <div key={it.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === it.id ? (
              <div className="flex gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button disabled={busy} onClick={() => rename(it.id)} className="rounded-md bg-brand text-white px-3 py-2 text-xs font-medium">
                  저장
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium">
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{it.name}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(it.id);
                      setEditingName(it.name);
                    }}
                    className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1"
                  >
                    수정
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(it.id)}
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
