// [기능] 설비 종류 수정(PATCH)/삭제(DELETE) - 자기 본사 소속 항목만 가능
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnedEquipmentType(organizationId: string, id: string) {
  const existing = await prisma.equipmentType.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== organizationId) return null;
  return existing;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedEquipmentType(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "설비 종류를 찾을 수 없습니다." }, { status: 404 });

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "설비 종류 이름을 입력해주세요." }, { status: 400 });
  }

  const duplicate = await prisma.equipmentType.findUnique({
    where: { organizationId_name: { organizationId: session.user.organizationId, name: name.trim() } }
  });
  if (duplicate && duplicate.id !== params.id) {
    return NextResponse.json({ error: "이미 등록된 설비 종류입니다." }, { status: 409 });
  }

  const equipmentType = await prisma.equipmentType.update({
    where: { id: params.id },
    data: { name: name.trim() }
  });

  return NextResponse.json({ equipmentType });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedEquipmentType(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "설비 종류를 찾을 수 없습니다." }, { status: 404 });

  await prisma.equipmentType.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
