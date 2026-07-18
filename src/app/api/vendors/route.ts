// [기능] 본사 전용 협력업체 관리 - 목록 조회(GET) + 등록(POST)
// 여기서 만든 업체는 organizationId가 채워져서, 그 본사 소속 매장의 요청에만
// 입찰할 수 있는 "본사 전용 업체"가 됩니다 (공용 마켓플레이스 업체와 구분).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    include: { technicians: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ vendors });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "업체 이름을 입력해주세요." }, { status: 400 });
  }

  const vendor = await prisma.vendor.create({
    data: { name: name.trim(), organizationId: session.user.organizationId }
  });

  return NextResponse.json({ vendor }, { status: 201 });
}
