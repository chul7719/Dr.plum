// [기능] 유지보수 요청 목록 조회(GET) / 신규 요청 등록(POST)
// 같은 엔드포인트를 매장 담당자·협력업체 기사·본사 관리자가 함께 쓰되,
// 아래에서 role별로 조회 범위(where)를 다르게 제한합니다. 이 서버 재검증은
// src/middleware.ts의 페이지 단위 접근 제어와 별개의 "이중 방어"입니다.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_INCLUDE } from "@/lib/request-include";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { role, storeId, vendorId, organizationId } = session.user;

  // [기능] role별 조회 범위 제한
  let where = {};
  if (role === "MART_MANAGER") {
    // 내 지점 요청만
    where = { storeId };
  } else if (role === "TECHNICIAN") {
    // 실제 입찰 흐름(README 로드맵 1): 아직 입찰이 열려 있는(QUOTING) 모든 요청은
    // 어느 협력업체든 볼 수 있어야 새로 제안을 넣을 수 있습니다. 여기에 더해
    // 이미 내가 선정돼 진행 중인 요청도 함께 보여줍니다.
    where = {
      OR: [{ status: "QUOTING" }, { selectedQuote: { vendorId } }]
    };
  } else if (role === "HQ_ADMIN") {
    // 다지점/다본사 구조(README 로드맵 5): 내 본사(organization) 소속 지점의
    // 요청만 보이도록 제한합니다. 다른 프랜차이즈 본사의 데이터는 격리됩니다.
    where = { store: { organizationId } };
  }

  const requests = await prisma.request.findMany({
    where,
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MART_MANAGER") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (!session.user.storeId) {
    return NextResponse.json({ error: "소속 지점 정보가 없습니다." }, { status: 400 });
  }

  const body = await req.json();
  const { equipmentType, symptom, urgent } = body as {
    equipmentType: string;
    symptom: string;
    urgent: boolean;
  };

  if (!equipmentType || !symptom) {
    return NextResponse.json({ error: "설비 종류와 증상을 입력해주세요." }, { status: 400 });
  }

  // [기능] 협력업체 실제 입찰 흐름 (README 로드맵 1)
  // 예전에는 여기서 서버가 무작위로 견적 3건을 자동 생성했습니다. 이제는
  // 요청만 QUOTING 상태로 열어두고, 협력업체 기사들이 각자
  // POST /api/requests/[id]/quotes 로 실제 가격/도착예정시간을 제안합니다.
  const request = await prisma.request.create({
    data: {
      storeId: session.user.storeId,
      requestedById: session.user.id,
      equipmentType,
      symptom,
      urgent: !!urgent,
      status: "QUOTING",
      timelineEvents: { create: [{ step: "요청 접수" }] }
    },
    include: REQUEST_INCLUDE
  });

  return NextResponse.json({ request }, { status: 201 });
}
