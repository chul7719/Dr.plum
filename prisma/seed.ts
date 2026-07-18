// [기능] 개발용 시드 데이터 - 로그인 테스트 계정과 샘플 데이터를 만듭니다.
// 다지점/다본사 구조(README 로드맵 5)를 눈으로 확인할 수 있도록 서로 다른
// Organization(프랜차이즈 본사) 2개를 만들고, 각 본사 관리자 계정으로
// 로그인하면 자기 소속 지점 데이터만 보이는 것을 검증할 수 있게 합니다.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 지금부터 n분 뒤 시각 - Quote.scheduledAt 샘플 값 생성용
function inMinutes(n: number) {
  return new Date(Date.now() + n * 60000);
}

// [기능] 본사가 관리하는 설비 종류 목록(README: "장비등록")의 기본값 -
// 예전에 NewRequestForm에 하드코딩돼 있던 4가지 항목을 그대로 시드해서
// 첫 실행 경험이 똑같이 유지되게 합니다.
const DEFAULT_EQUIPMENT_TYPES = ["냉장 쇼케이스", "냉동고", "공조 설비", "POS 단말"];

async function seedEquipmentTypes(organizationId: string) {
  await prisma.equipmentType.createMany({
    data: DEFAULT_EQUIPMENT_TYPES.map((name) => ({ name, organizationId }))
  });
}

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // [기능] 협력업체(Vendor) - 특정 본사에 속하지 않는 공용 마켓플레이스입니다.
  // 여러 프랜차이즈 본사의 요청에 동시에 입찰할 수 있습니다.
  const vendorA = await prisma.vendor.create({ data: { name: "한성설비", ratingAvg: 4.9 } });
  const vendorB = await prisma.vendor.create({ data: { name: "동진냉동", ratingAvg: 4.6 } });
  const vendorC = await prisma.vendor.create({ data: { name: "쿨텍서비스", ratingAvg: 4.4 } });

  const technician = await prisma.user.create({
    data: {
      email: "tech@example.com",
      passwordHash: password,
      name: "박기사",
      role: "TECHNICIAN",
      vendorId: vendorA.id
    }
  });

  // --- 첫 번째 프랜차이즈 본사: 그린마트 ---
  const orgGreen = await prisma.organization.create({ data: { name: "그린마트 본사" } });
  const storeGreen = await prisma.store.create({
    data: { name: "역삼점", address: "서울 강남구 역삼동", organizationId: orgGreen.id }
  });
  await seedEquipmentTypes(orgGreen.id);
  await prisma.notice.create({
    data: {
      organizationId: orgGreen.id,
      title: "여름철 냉방 설비 점검 안내",
      content: "폭염 대비 냉방 설비 사전 점검을 요청하실 매장은 긴급 표시 없이 등록해주세요."
    }
  });

  const martManager = await prisma.user.create({
    data: {
      email: "mart@example.com",
      passwordHash: password,
      name: "김지점",
      role: "MART_MANAGER",
      storeId: storeGreen.id
    }
  });

  await prisma.user.create({
    data: {
      email: "hq@example.com",
      passwordHash: password,
      name: "이본사",
      role: "HQ_ADMIN",
      organizationId: orgGreen.id
    }
  });

  // 샘플 요청 1건 + 견적 3건 (입찰 완료 상태, 매장이 바로 선택 화면을 볼 수 있도록)
  const req = await prisma.request.create({
    data: {
      storeId: storeGreen.id,
      requestedById: martManager.id,
      equipmentType: "냉장 쇼케이스",
      symptom: "냉각이 잘 되지 않아요",
      urgent: true,
      status: "QUOTING",
      timelineEvents: { create: [{ step: "요청 접수" }] },
      quotes: {
        create: [
          { vendorId: vendorA.id, price: 180000, scheduledAt: inMinutes(40), note: "부품 재고 보유, 오늘 방문 가능" },
          { vendorId: vendorB.id, price: 210000, scheduledAt: inMinutes(25) },
          { vendorId: vendorC.id, price: 150000, scheduledAt: inMinutes(60) }
        ]
      }
    }
  });

  // --- 두 번째 프랜차이즈 본사: 해피마트 (데이터 격리 검증용) ---
  const orgHappy = await prisma.organization.create({ data: { name: "해피마트 본사" } });
  const storeHappy = await prisma.store.create({
    data: { name: "잠실점", address: "서울 송파구 잠실동", organizationId: orgHappy.id }
  });
  await seedEquipmentTypes(orgHappy.id);
  await prisma.notice.create({
    data: {
      organizationId: orgHappy.id,
      title: "정산 지급일 변경 안내",
      content: "이번 달부터 정산 지급이 매주 금요일 일괄 처리됩니다."
    }
  });

  const martManager2 = await prisma.user.create({
    data: {
      email: "mart2@example.com",
      passwordHash: password,
      name: "최지점",
      role: "MART_MANAGER",
      storeId: storeHappy.id
    }
  });

  await prisma.user.create({
    data: {
      email: "hq2@example.com",
      passwordHash: password,
      name: "정본사",
      role: "HQ_ADMIN",
      organizationId: orgHappy.id
    }
  });

  await prisma.request.create({
    data: {
      storeId: storeHappy.id,
      requestedById: martManager2.id,
      equipmentType: "공조 설비",
      symptom: "실내기에서 물이 새요",
      urgent: false,
      status: "QUOTING",
      timelineEvents: { create: [{ step: "요청 접수" }] }
      // 입찰 전 상태로 남겨서, 기사 계정(tech@example.com)으로 로그인하면
      // "입찰 가능한 신규 요청"에 이 건이 뜨는 것을 바로 확인할 수 있습니다.
    }
  });

  console.log("시드 완료");
  console.log("테스트 계정 (비밀번호 공통: password123)");
  console.log("- 매장 담당자(그린마트 역삼점): mart@example.com");
  console.log("- 매장 담당자(해피마트 잠실점): mart2@example.com");
  console.log("- 협력업체 기사(한성설비): tech@example.com");
  console.log("- 본사 관리자(그린마트): hq@example.com");
  console.log("- 본사 관리자(해피마트): hq2@example.com");
  console.log("샘플 요청 ID(그린마트, 견적 3건 도착):", req.id);
  console.log("technician:", technician.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
