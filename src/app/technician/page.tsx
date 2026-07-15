// [디자인] 기사 앱 홈 - max-w-md로 모바일 폭을 고정
import { TechnicianApp } from "@/components/technician/TechnicianApp";

export default function TechnicianPage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-5">
      <TechnicianApp />
    </main>
  );
}
