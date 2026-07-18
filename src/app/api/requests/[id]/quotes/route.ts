// [기능] 협력업체 실제 입찰 흐름 (README 로드맵 1)
// 기사가 특정 요청에 대해 가격/도착예정시간(+메모)을 제안(Quote)합니다.
// 예전 프로토타입은 서버가 견적 3건을 무작위로 만들어줬지만, 이제는 여러
// 협력업체 기사가 각자 이 API를 호출해 진짜 경쟁 입찰을 만듭니다.
// 같은 업체가 같은 요청에 다시 제안하면(가격을 수정하고 싶을 때) 기존
// 제안을 덮어씁니다 (upsert) - schema.prisma의 @@unique([requestId, vendorId]) 참고.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_INCLUDE } from "@/lib/request-include";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TECHNICIAN" || !session.user.vendorId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const target = await prisma.request.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  if (target.status !== "QUOTING") {
    return NextResponse.json({ error: "이미 업체가 선정되어 더 이상 제안을 받지 않는 요청입니다." }, { status: 400 });
  }

  const { price, etaMinutes, scheduledDate, note } = (await req.json()) as {
    price: number;
    etaMinutes: number;
    scheduledDate?: string;
    note?: string;
  };

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(etaMinutes) || etaMinutes <= 0) {
    return NextResponse.json({ error: "가격과 도착예정시간을 올바르게 입력해주세요." }, { status: 400 });
  }

  // [기능] 방문 예정 일자 - 안 보내면(레거시 호출 등) 오늘 날짜로 처리합니다.
  const parsedDate = scheduledDate ? new Date(scheduledDate) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "방문 예정 일자를 올바르게 입력해주세요." }, { status: 400 });
  }

  await prisma.quote.upsert({
    where: { requestId_vendorId: { requestId: params.id, vendorId: session.user.vendorId } },
    create: { requestId: params.id, vendorId: session.user.vendorId, price, etaMinutes, scheduledDate: parsedDate, note },
    update: { price, etaMinutes, scheduledDate: parsedDate, note }
  });

  const updated = await prisma.request.findUnique({
    where: { id: params.id },
    include: REQUEST_INCLUDE
  });

  return NextResponse.json({ request: updated }, { status: 201 });
}
