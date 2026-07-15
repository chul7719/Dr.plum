// [디자인] 새 요청 등록 페이지 래퍼 - 실제 폼 로직은 NewRequestForm 컴포넌트
import { NewRequestForm } from "@/components/mart/NewRequestForm";

export default function NewRequestPage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-5">
      <NewRequestForm />
    </main>
  );
}
