// [기능] 협력업체 서비스 지역 삭제(DELETE)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string; regionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
  if (!vendor || vendor.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
  }

  const region = await prisma.vendorRegion.findUnique({ where: { id: params.regionId } });
  if (!region || region.vendorId !== params.id) {
    return NextResponse.json({ error: "지역을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.vendorRegion.delete({ where: { id: params.regionId } });
  return NextResponse.json({ ok: true });
}
