// [디자인] 매장용 본사 공지 페이지 - max-w-md 모바일 폭, 실제 로직은 NoticesView
import { NoticesView } from "@/components/mart/NoticesView";

export default function MartNoticesPage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-5">
      <NoticesView />
    </main>
  );
}
