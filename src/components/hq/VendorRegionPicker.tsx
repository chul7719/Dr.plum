"use client";

// [기능] 협력업체 서비스 지역 추가 - 시/도, 시/군/구, 동 어느 단위에서든
// "이 지역 전체 추가" 버튼으로 멈춰서 등록할 수 있고, 계속 다른 지역을
// 추가로 골라 여러 개를 중복 등록할 수 있습니다 (업체가 여러 지역에 걸쳐
// 있는 경우가 많아서). 지도/동 목록 로딩 방식은 src/components/RegionPicker.tsx
// 와 동일합니다.
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { loadRegionsMetadata, type KoreaMapSelection, type KoreaRegionsDataset } from "korea-drilldown-svg-map";

const KoreaAdministrativeMap = dynamic(() => import("@/components/KoreaMapLazy"), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-400 text-center py-10">지도를 불러오는 중...</p>
});

type DongRow = { code: string; sggCode: string; leaf: string; label: string };
export type PickedRegion = { level: "SIDO" | "SGG" | "DONG"; code: string; label: string };

export function VendorRegionPicker({
  existing,
  onAdd
}: {
  existing: { level: string; code: string }[];
  onAdd: (region: PickedRegion) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<KoreaRegionsDataset | null>(null);
  const [dongRows, setDongRows] = useState<DongRow[] | null>(null);
  const [selection, setSelection] = useState<KoreaMapSelection>({ sidoCode: null, sggCode: null });
  const [dongQuery, setDongQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!metadata) loadRegionsMetadata("/boundaries").then(setMetadata);
    if (!dongRows) import("@/data/dong-regions.json").then((m) => setDongRows(m.default as DongRow[]));
  }, [open, metadata, dongRows]);

  const existingKeys = useMemo(() => new Set(existing.map((r) => `${r.level}:${r.code}`)), [existing]);

  function close() {
    setOpen(false);
    setSelection({ sidoCode: null, sggCode: null });
    setDongQuery("");
  }

  async function add(region: PickedRegion) {
    if (existingKeys.has(`${region.level}:${region.code}`)) return;
    setBusy(true);
    await onAdd(region);
    setBusy(false);
  }

  const dongList = useMemo(() => {
    if (!selection.sggCode || !dongRows) return [];
    const rows = dongRows.filter((d) => d.sggCode === selection.sggCode);
    if (!dongQuery) return rows;
    return rows.filter((d) => d.leaf.includes(dongQuery));
  }, [selection.sggCode, dongRows, dongQuery]);

  const selectedSido = metadata?.sido.find((s) => s.code === selection.sidoCode) ?? null;
  const selectedSgg = metadata?.sgg.find((s) => s.code === selection.sggCode) ?? null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1 text-brand"
      >
        + 서비스 지역 추가
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-sm font-semibold">서비스 지역 추가 (도/시/군/구/동 중 원하는 단위에서 멈춰도 돼요)</p>
              <button type="button" onClick={close} className="text-gray-400 text-lg leading-none px-1">
                ×
              </button>
            </div>

            {!selection.sidoCode ? (
              <div className="p-2 flex-1 overflow-hidden">
                {!metadata ? (
                  <p className="text-sm text-gray-400 text-center py-10">지도를 불러오는 중...</p>
                ) : (
                  <KoreaAdministrativeMap
                    metadata={metadata}
                    selection={selection}
                    onSelectionChange={setSelection}
                    style={{ width: "100%", height: "60vh" }}
                    labels={{ loading: "지도를 불러오는 중...", zoomIn: "확대", zoomOut: "축소", back: "뒤로" }}
                  />
                )}
              </div>
            ) : !selection.sggCode ? (
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <p className="text-xs text-gray-500">{selectedSido?.name}</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={busy || existingKeys.has(`SIDO:${selection.sidoCode}`)}
                      onClick={() =>
                        selectedSido && add({ level: "SIDO", code: selectedSido.code, label: selectedSido.name })
                      }
                      className="text-xs font-medium text-brand disabled:opacity-40"
                    >
                      {existingKeys.has(`SIDO:${selection.sidoCode}`) ? "이미 추가됨" : "도 전체 추가"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelection({ sidoCode: null, sggCode: null })}
                      className="text-xs text-gray-500 font-medium"
                    >
                      처음부터
                    </button>
                  </div>
                </div>
                <div className="p-2 flex-1 overflow-hidden">
                  <KoreaAdministrativeMap
                    metadata={metadata!}
                    selection={selection}
                    onSelectionChange={setSelection}
                    style={{ width: "100%", height: "56vh" }}
                    labels={{ loading: "지도를 불러오는 중...", zoomIn: "확대", zoomOut: "축소", back: "뒤로" }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <p className="text-xs text-gray-500">
                    {selectedSido?.name} {selectedSgg?.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={busy || existingKeys.has(`SGG:${selection.sggCode}`)}
                      onClick={() =>
                        selectedSgg && add({ level: "SGG", code: selectedSgg.code, label: `${selectedSgg.sidoName} ${selectedSgg.name}` })
                      }
                      className="text-xs font-medium text-brand disabled:opacity-40"
                    >
                      {existingKeys.has(`SGG:${selection.sggCode}`) ? "이미 추가됨" : "시/군/구 전체 추가"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelection((s) => ({ ...s, sggCode: null }))}
                      className="text-xs text-gray-500 font-medium"
                    >
                      다시 선택
                    </button>
                  </div>
                </div>
                <input
                  value={dongQuery}
                  onChange={(e) => setDongQuery(e.target.value)}
                  placeholder="동/읍/면 이름으로 검색"
                  autoFocus
                  className="mx-4 mt-3 mb-2 rounded-md border border-gray-300 px-3 py-2 text-sm shrink-0"
                />
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                  {!dongRows && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}
                  {dongRows && dongList.length === 0 && <p className="text-sm text-gray-400 text-center py-10">일치하는 동이 없습니다.</p>}
                  {dongList.map((d) => {
                    const added = existingKeys.has(`DONG:${d.code}`);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        disabled={busy || added}
                        onClick={() => add({ level: "DONG", code: d.code, label: d.label })}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-40 flex items-center justify-between"
                      >
                        {d.leaf}
                        {added && <span className="text-xs text-gray-400">추가됨</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
