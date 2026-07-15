// [디자인] 로그인 페이지 - 중앙 정렬 카드 + 하단 테스트 계정 안내 박스
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold">설비닥터</h1>
          <p className="text-sm text-gray-500 mt-1">마트 설비 유지보수 매칭 플랫폼</p>
        </div>
        <LoginForm />

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500 leading-relaxed">
          <p className="font-medium text-gray-700 mb-1">테스트 계정 (비밀번호 공통: password123)</p>
          <p>매장 담당자 · mart@example.com</p>
          <p>협력업체 기사 · tech@example.com</p>
          <p>본사 관리자 · hq@example.com</p>
        </div>
      </div>
    </main>
  );
}
