// [디자인] 요청 상세 페이지 래퍼 - 실제 화면 로직은 RequestDetail 컴포넌트
import { RequestDetail } from "@/components/mart/RequestDetail";

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-5">
      <RequestDetail id={params.id} />
    </main>
  );
}
