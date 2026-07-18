// [기능] 회원가입 폼에 필요한 선택지 제공 - 로그인 전(비인증) 상태에서도
// 호출되므로 이름만 최소한으로 내려줍니다 (주소 등 민감할 수 있는 정보는 제외).
// 매장 담당자는 소속 본사(Organization) + 지점(Store), 협력업체 기사는
// 소속 업체(Vendor)를 기존 목록에서 고르거나 새로 만들 수 있습니다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [organizations, vendors] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true, stores: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.vendor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  return NextResponse.json({ organizations, vendors });
}
