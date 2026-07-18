// [기능] 본사(/hq/*) 전용 공용 레이아웃 - 모든 하위 페이지를 좌측 사이드바로 감쌉니다.
// 사이드바가 항상 떠 있어서 페이지마다 따로 넣던 "대시보드로" 링크와
// 로그아웃 버튼이 여기 하나로 합쳐졌습니다.
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HqSidebar } from "@/components/hq/HqSidebar";

export default async function HqLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const organization = session?.user.organizationId
    ? await prisma.organization.findUnique({ where: { id: session.user.organizationId } })
    : null;

  return (
    <div className="min-h-screen flex">
      <HqSidebar organizationName={organization?.name} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
