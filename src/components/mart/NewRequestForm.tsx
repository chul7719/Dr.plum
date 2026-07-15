"use client";

// [기능] 매장 담당자 - 새 유지보수 요청 등록 (POST /api/requests)
// 등록 즉시 status는 QUOTING(입찰 대기)이 되고, 협력업체 기사들이
// /api/requests/[id]/quotes 로 실제 가격을 제안하기 시작합니다.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";

export function NewRequestForm() {
  const router = useRouter();
  const [equipmentType, setEquipmentType] = useState("냉장 쇼케이스");
  const [symptom, setSymptom] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentType, symptom, urgent })
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "요청 등록에 실패했습니다.");
      return;
    }

    const data = await res.json();
    router.push(`/mart/requests/${data.request.id}`);
  }

  return (
    <div>
      <MobileHeader title="새 작업요청" onBack={() => router.back()} />

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <label className="block text-sm text-gray-600">
          설비 종류
          <select
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option>냉장 쇼케이스</option>
            <option>냉동고</option>
            <option>공조 설비</option>
            <option>POS 단말</option>
          </select>
        </label>

        <label className="block text-sm text-gray-600">
          증상
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            required
            placeholder="예: 냉각이 잘 되지 않아요"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          긴급 (영업에 즉시 영향)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand text-white py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "등록 중..." : "요청 등록하고 견적 받기"}
        </button>
      </form>
    </div>
  );
}
