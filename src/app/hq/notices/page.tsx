// [디자인] 공지사항 관리 페이지 래퍼 - max-w-5xl PC 폭, 실제 로직은 NoticeBoard
import { NoticeBoard } from "@/components/hq/NoticeBoard";

export default function NoticesPage() {
  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <NoticeBoard />
    </main>
  );
}
