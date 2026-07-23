"use client";

// [기능] 지역(동네) 설정 - 상세 주소 검색 대신, 대한민국 행정구역 지도에서
// 시/도 -> 시/군/구를 클릭해 드릴다운하고(korea-drilldown-svg-map, API 키
// 불필요), 마지막 동/읍/면은 목록에서 고릅니다. 지도 자체는 시/군/구
// 단위까지만 그려지므로(라이브러리 한계), 최종 "동" 선택은 그 시/군/구에
// 속한 동 목록(src/data/dong-regions.json, 행정동 경계 데이터에서 미리
// 추출한 정적 파일)에서 검색해서 고르는 방식으로 마무리합니다.
// 마지막으로 설정한 동네는 브라우저에 기억해뒀다가 다음 요청 등록 때 그대로
// 채워줍니다.
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { loadRegionsMetadata, type KoreaMapSelection, type KoreaRegionsDataset } from "korea-drilldown-svg-map";

// [기능] 지도 라이브러리(react-simple-maps/d3-geo/topojson-client)와 동 목록
// JSON(약 360KB)은 이 모달을 실제로 열 때만 필요하므로, 새 요청 등록 화면
// 첫 진입 시 번들에 끼워 넣지 않도록 둘 다 지연 로딩합니다.
const KoreaAdministrativeMap = dynamic(() => import("@/components/KoreaMapLazy"), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-400 text-center py-10">지도를 불러오는 중...</p>
});

const LAST_REGION_KEY = "lastRequestRegion";

type DongRow = { code: string; sggCode: string; leaf: string; label: string };

export function RegionPicker({ value, onChange }: { value: string; onChange: (region: string) => void }) {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<KoreaRegionsDataset | null>(null);
  const [dongRows, setDongRows] = useState<DongRow[] | null>(null);
  const [selection, setSelection] = useState<KoreaMapSelection>({ sidoCode: null, sggCode: null });
  const [dongQuery, setDongQuery] = useState("");

  useEffect(() => {
    if (value) return;
    const last = localStorage.getItem(LAST_REGION_KEY);
    if (last) onChange(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!metadata) loadRegionsMetadata("/boundaries").then(setMetadata);
    if (!dongRows) import("@/data/dong-regions.json").then((m) => setDongRows(m.default as DongRow[]));
  }, [open, metadata, dongRows]);

  function close() {
    setOpen(false);
    setSelection({ sidoCode: null, sggCode: null });
    setDongQuery("");
  }

  function selectDong(row: DongRow) {
    onChange(row.label);
    localStorage.setItem(LAST_REGION_KEY, row.label);
    close();
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
      <label className="block text-sm text-gray-600">
        지역 (동네)
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 w-full flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm text-left"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>{value || "동네를 지도에서 설정해주세요"}</span>
          <span className="text-brand text-xs font-medium shrink-0 ml-2">{value ? "변경" : "설정"}</span>
        </button>
      </label>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-sm font-semibold">{selection.sggCode ? "동네 선택" : "지역 선택 (시/도 → 시/군/구)"}</p>
              <button type="button" onClick={close} className="text-gray-400 text-lg leading-none px-1">
                ×
              </button>
            </div>

            {!selection.sggCode ? (
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
            ) : (
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <p className="text-xs text-gray-500">
                    {selectedSido?.name} {selectedSgg?.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelection((s) => ({ ...s, sggCode: null }))}
                    className="text-xs text-brand font-medium"
                  >
                    다시 선택
                  </button>
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
                  {dongList.map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => selectDong(d)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      {d.leaf}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
