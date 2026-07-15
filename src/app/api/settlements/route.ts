// [기능] 본사 정산 관리 - 목록 조회(GET) + 상태 변경(PATCH: 청구서 발행/지급 완료)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payment";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const settlements = await prisma.settlement.findMany({
    // [기능] 다지점/다본사 구조: 내 본사(organization) 소속 지점의 정산만 조회
    where: { request: { store: { organizationId: session.user.organizationId } } },
    include: {
      request: {
        include: {
          store: true,
          selectedQuote: { include: { vendor: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ settlements });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id, status } = (await req.json()) as { id: string; status: "PENDING" | "INVOICED" | "PAID" };

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: { request: { include: { store: true, selectedQuote: { include: { vendor: true } } } } }
  });
  if (!settlement || settlement.request.store.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "정산 내역을 찾을 수 없습니다." }, { status: 404 });
  }

  // [기능] 결제·PG 연동 인터페이스 (README 로드맵 4) - "지급 완료"로 바꿀 때만
  // 실제 이체를 흉내내는 paymentGateway.payout()을 호출합니다. 지금은
  // MockPaymentGateway가 항상 성공을 반환하지만, 실제 PG를 붙이면 이 호출
  // 하나만 진짜 이체 API로 바뀌고 나머지 로직은 그대로 유지됩니다.
  let transactionId: string | null = settlement.transactionId;
  if (status === "PAID" && settlement.status !== "PAID") {
    const result = await paymentGateway.payout({
      settlementId: settlement.id,
      vendorName: settlement.request.selectedQuote?.vendor.name ?? "",
      amount: settlement.payoutAmount
    });
    if (!result.success) {
      return NextResponse.json({ error: "지급 처리에 실패했습니다." }, { status: 502 });
    }
    transactionId = result.transactionId;
  }

  const updated = await prisma.settlement.update({
    where: { id },
    data: {
      status,
      transactionId,
      paidAt: status === "PAID" ? new Date() : null
    }
  });

  return NextResponse.json({ settlement: updated });
}
