// [디자인] 회원가입 페이지 - 로그인 페이지와 동일한 중앙 정렬 카드 레이아웃
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold">설비닥터 회원가입</h1>
          <p className="text-sm text-gray-500 mt-1">역할을 선택하고 소속을 등록해주세요</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
