// [기능] 본사 전용 협력업체 수정(PATCH)/삭제(DELETE) - 자기 본사 소속 업체만 가능
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnedVendor(organizationId: string, vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.organizationId !== organizationId) return null;
  return vendor;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedVendor(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });

  const { name, ratingAvg } = (await req.json()) as { name?: string; ratingAvg?: number };
  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "업체 이름을 입력해주세요." }, { status: 400 });
  }

  const vendor = await prisma.vendor.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(ratingAvg !== undefined ? { ratingAvg } : {})
    }
  });

  return NextResponse.json({ vendor });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedVendor(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });

  const [technicianCount, quoteCount] = await Promise.all([
    prisma.user.count({ where: { vendorId: params.id } }),
    prisma.quote.count({ where: { vendorId: params.id } })
  ]);
  if (technicianCount > 0 || quoteCount > 0) {
    return NextResponse.json(
      { error: "소속 기사 계정 또는 제안 이력이 있는 업체는 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.vendor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
