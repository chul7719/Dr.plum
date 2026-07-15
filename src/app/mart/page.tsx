// [디자인] 매장 담당자 홈 - max-w-md로 모바일 폭을 고정해 PC에서도 스마트폰처럼 보이게 함
import { MartRequestList } from "@/components/mart/MartRequestList";

export default function MartHomePage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-5">
      <MartRequestList />
    </main>
  );
}
