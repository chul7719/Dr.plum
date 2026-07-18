// [기능] 본사 대시보드 (서버 컴포넌트) - 지표 카드 + 지점별 설비 현황
// 다지점/다본사 구조(README 로드맵 5): 로그인한 본사 관리자의 organizationId로
// 항상 범위를 제한해서, 다른 프랜차이즈 본사의 지점/요청은 보이지 않습니다.
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtWon, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/format";
import { LogoutButton } from "@/components/LogoutButton";

export default async function HQPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user.organizationId;

  const [organization, requests] = await Promise.all([
    organizationId ? prisma.organization.findUnique({ where: { id: organizationId } }) : null,
    prisma.request.findMany({
      where: { store: { organizationId } },
      include: { store: true, selectedQuote: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const total = requests.length;
  const urgentOpen = requests.filter((r) => r.urgent && r.status !== "PAID").length;
  const withVendor = requests.filter((r) => r.selectedQuote);
  const avgEta =
    withVendor.length > 0
      ? Math.round(withVendor.reduce((sum, r) => sum + (r.selectedQuote?.etaMinutes ?? 0), 0) / withVendor.length)
      : 0;
  const totalCost = requests.reduce((sum, r) => sum + (r.selectedQuote?.price ?? 0), 0);

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">본사 대시보드</h1>
          {organization && <p className="text-xs text-gray-500 mt-0.5">{organization.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/hq/settlements"
            className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5"
          >
            정산 관리
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* [디자인] 지표 카드 4개 - 모바일 2열 / PC 4열 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="전체 접수" value={`${total}건`} />
        <MetricCard label="평균 도착시간" value={`${avgEta}분`} />
        <MetricCard label="긴급 미해결" value={`${urgentOpen}건`} danger={urgentOpen > 0} />
        <MetricCard label="누적 유지보수 비용" value={fmtWon(totalCost)} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl">
        <p className="text-sm font-semibold px-4 py-3 border-b border-gray-100">지점별 설비 현황</p>

        {/* [디자인] 모바일: 카드형 목록 */}
        <div className="md:hidden divide-y divide-gray-100">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{r.store.name}</p>
                <p className="text-xs text-gray-500">
                  {r.equipmentType} · {r.symptom}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE_CLASS[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          ))}
        </div>

        {/* [디자인] 데스크톱(md 이상): 테이블형 - Tailwind md: 접두사로 같은 페이지 안에서 전환 */}
        <table className="hidden md:table w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 font-medium">지점</th>
              <th className="px-4 py-2 font-medium">설비</th>
              <th className="px-4 py-2 font-medium">증상</th>
              <th className="px-4 py-2 font-medium">비용</th>
              <th className="px-4 py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">{r.store.name}</td>
                <td className="px-4 py-2">{r.equipmentType}</td>
                <td className="px-4 py-2 text-gray-500">{r.symptom}</td>
                <td className="px-4 py-2">{r.selectedQuote ? fmtWon(r.selectedQuote.price) : "-"}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE_CLASS[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// [디자인] 상단 지표 카드 1개 (라벨 + 큰 숫자, danger일 때 빨간색 강조)
function MetricCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${danger ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}
