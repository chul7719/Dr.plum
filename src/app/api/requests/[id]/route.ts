// [기능] 요청 1건 조회(GET) + 상태 전이(PATCH)
//
// PATCH의 action들이 요청의 전체 생애주기를 표현합니다:
//   select   매장 담당자가 도착한 제안(Quote) 중 하나를 선택 -> ACCEPTED
//   depart   (기사) 출발 -> IN_PROGRESS, 타임라인 "기사 출발" 추가
//   arrive   (기사) 현장 도착 -> 타임라인 "현장 도착·점검" 추가
//   complete (기사) 완료보고 제출 -> COMPLETED, 조치내용/사진 저장
//   review   (매장) 리뷰 등록 -> PAID, Settlement(정산) 레코드 생성
//
// depart/arrive는 README 로드맵 3(실시간 위치·ETA)에서, 예전에 매장 쪽
// "다음 단계로 진행 (데모용)" 버튼 하나로 몰아뒀던 것을 실제로 현장에 있는
// 기사가 직접 트리거하도록 분리한 것입니다. 실제 서비스에서는 이 두 액션을
// 기사 앱의 GPS 이벤트가 자동으로 호출하도록 바꿀 수 있습니다.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_INCLUDE } from "@/lib/request-include";
import { canAccessRequest } from "@/lib/request-access";

const TIMELINE_STEPS = ["요청 접수", "기사 출발", "현장 도착·점검", "수리 완료", "정산·리뷰"];
const COMMISSION_RATE = 0.1;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: REQUEST_INCLUDE
  });
  if (!request) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  // [기능] 다지점/다본사 데이터 격리 - URL로 직접 접근해도 남의 지점/본사 요청은 못 봄
  if (!(await canAccessRequest(session, request))) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({ request });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const { action } = body as { action: string };

  const existing = await prisma.request.findUnique({
    where: { id: params.id },
    include: { timelineEvents: true, selectedQuote: true, store: true }
  });
  if (!existing) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  if (!(await canAccessRequest(session, existing))) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // [기능] 매장 담당자: 도착한 제안 중 하나를 선택 -> 업체 확정
  if (action === "select") {
    if (session.user.role !== "MART_MANAGER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (existing.status !== "QUOTING") {
      return NextResponse.json({ error: "이미 업체가 선정된 요청입니다." }, { status: 400 });
    }
    const { quoteId } = body as { quoteId: string };

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: "ACCEPTED", selectedQuoteId: quoteId },
      include: REQUEST_INCLUDE
    });
    return NextResponse.json({ request: updated });
  }

  // [기능] 협력업체 기사: 출발 (실시간 위치·ETA, README 로드맵 3)
  if (action === "depart") {
    if (session.user.role !== "TECHNICIAN" || existing.selectedQuote?.vendorId !== session.user.vendorId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (existing.status !== "ACCEPTED") {
      return NextResponse.json({ error: "출발할 수 없는 상태입니다." }, { status: 400 });
    }
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        timelineEvents: { create: [{ step: TIMELINE_STEPS[1] }] }
      },
      include: REQUEST_INCLUDE
    });
    return NextResponse.json({ request: updated });
  }

  // [기능] 협력업체 기사: 현장 도착
  if (action === "arrive") {
    if (session.user.role !== "TECHNICIAN" || existing.selectedQuote?.vendorId !== session.user.vendorId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (existing.status !== "IN_PROGRESS" || existing.timelineEvents.length !== 2) {
      return NextResponse.json({ error: "도착 처리를 할 수 없는 상태입니다." }, { status: 400 });
    }
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: {
        timelineEvents: { create: [{ step: TIMELINE_STEPS[2] }] }
      },
      include: REQUEST_INCLUDE
    });
    return NextResponse.json({ request: updated });
  }

  // [기능] 협력업체 기사: 완료보고 제출 (조치 내용 + 사진, README 로드맵 2)
  if (action === "complete") {
    if (session.user.role !== "TECHNICIAN" || existing.selectedQuote?.vendorId !== session.user.vendorId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (existing.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "완료보고를 제출할 수 없는 상태입니다." }, { status: 400 });
    }
    const { notes, photos } = body as { notes?: string; photos?: string[] };

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        completionNotes: notes || null,
        timelineEvents: { create: [{ step: TIMELINE_STEPS[3] }] },
        photos: {
          // [디자인] 완료보고 화면에서 첨부한 사진(base64 data URL) 저장 -
          // 실제 서비스로 전환 시 dataUrl 대신 S3/R2 업로드 URL을 넣도록 교체
          create: (photos ?? []).slice(0, 5).map((dataUrl) => ({ dataUrl }))
        }
      },
      include: REQUEST_INCLUDE
    });
    return NextResponse.json({ request: updated });
  }

  // [기능] 매장 담당자: 정산 확인 및 리뷰 등록 -> 정산(Settlement) 레코드 생성
  if (action === "review") {
    if (session.user.role !== "MART_MANAGER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (existing.status !== "COMPLETED") {
      return NextResponse.json({ error: "완료보고 전에는 리뷰를 남길 수 없습니다." }, { status: 400 });
    }
    const { stars, text, recurring } = body as { stars: number; text?: string; recurring?: boolean };

    const reqWithQuote = await prisma.request.findUnique({
      where: { id: params.id },
      include: { selectedQuote: true }
    });
    if (!reqWithQuote?.selectedQuote) {
      return NextResponse.json({ error: "선택된 업체 정보가 없습니다." }, { status: 400 });
    }

    const amount = reqWithQuote.selectedQuote.price;
    const commissionAmount = Math.round(amount * COMMISSION_RATE);
    const payoutAmount = amount - commissionAmount;

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        timelineEvents: { create: [{ step: TIMELINE_STEPS[4] }] },
        review: {
          create: { stars, text, recurring: !!recurring }
        },
        settlement: {
          create: {
            amount,
            commissionRate: COMMISSION_RATE,
            commissionAmount,
            payoutAmount,
            status: "PENDING"
          }
        }
      },
      include: REQUEST_INCLUDE
    });
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "알 수 없는 action 입니다." }, { status: 400 });
}
