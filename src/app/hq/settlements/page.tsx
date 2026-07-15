// [디자인] 정산 관리 페이지 래퍼 - max-w-5xl PC 폭, 실제 로직은 SettlementList
import { SettlementList } from "@/components/hq/SettlementList";

export default function SettlementsPage() {
  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <SettlementList />
    </main>
  );
}
