// [기능] 설비 종류 목록 관리 - 목록 조회(GET, 매장 담당자+본사 모두) + 등록(POST, 본사만)
// 새 요청 등록 화면(NewRequestForm)의 설비 종류 드롭다운이 이 목록을 그대로 씁니다.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrganizationId } from "@/lib/org-scope";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const organizationId = await resolveOrganizationId(session);
  if (!organizationId) return NextResponse.json({ equipmentTypes: [] });

  const equipmentTypes = await prisma.equipmentType.findMany({
    where: { organizationId },
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ equipmentTypes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "설비 종류 이름을 입력해주세요." }, { status: 400 });
  }

  const existing = await prisma.equipmentType.findUnique({
    where: { organizationId_name: { organizationId: session.user.organizationId, name: name.trim() } }
  });
  if (existing) {
    return NextResponse.json({ error: "이미 등록된 설비 종류입니다." }, { status: 409 });
  }

  const equipmentType = await prisma.equipmentType.create({
    data: { name: name.trim(), organizationId: session.user.organizationId }
  });

  return NextResponse.json({ equipmentType }, { status: 201 });
}
