// [기능] 루트 진입점 - 로그인 여부/역할을 확인해 각자의 홈으로 리다이렉트합니다
// (역할 분기 2단계는 middleware.ts에서 담당, 여기는 "/" 진입 시의 첫 분기점)
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  MART_MANAGER: "/mart",
  TECHNICIAN: "/technician",
  HQ_ADMIN: "/hq"
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  redirect(ROLE_HOME[session.user.role] ?? "/login");
}
