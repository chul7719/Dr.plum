// [기능] 협력업체 서비스 지역 등록(POST) - 도/시/군/구/동 어느 단위로든,
// 여러 개 중복(서로 다른 단위가 겹쳐도)으로 추가할 수 있습니다.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, RegionLevel } from "@prisma/client";

async function assertOwnedVendor(organizationId: string, vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.organizationId !== organizationId) return null;
  return vendor;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN" || !session.user.organizationId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const existing = await assertOwnedVendor(session.user.organizationId, params.id);
  if (!existing) return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });

  const { level, code, label } = (await req.json()) as { level?: string; code?: string; label?: string };
  if (!level || !(level in RegionLevel) || !code?.trim() || !label?.trim()) {
    return NextResponse.json({ error: "지역 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const region = await prisma.vendorRegion.create({
      data: { vendorId: params.id, level: level as RegionLevel, code: code.trim(), label: label.trim() }
    });
    return NextResponse.json({ region }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "이미 추가된 지역입니다." }, { status: 400 });
    }
    throw err;
  }
}
