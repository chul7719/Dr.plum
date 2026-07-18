import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// [기능] "이 세션은 어느 본사(Organization) 소속인가?"를 role별로 계산합니다.
// HQ_ADMIN은 세션에 organizationId가 바로 있지만, MART_MANAGER는 소속
// Store를 통해서, TECHNICIAN은 소속 Vendor를 통해서 간접적으로 알아내야
// 합니다. 설비 종류 목록 / 공지사항처럼 "내 본사 것만 보여주기"가 필요한
// 곳에서 공통으로 씁니다.
//
// TECHNICIAN이 공용 마켓플레이스 업체(Vendor.organizationId가 null) 소속이면
// 특정 본사에 속하지 않으므로 null을 반환합니다 (예: 공지사항이 안 보임).
export async function resolveOrganizationId(session: Session): Promise<string | null> {
  const { role, storeId, vendorId, organizationId } = session.user;

  if (role === "HQ_ADMIN") return organizationId ?? null;

  if (role === "MART_MANAGER") {
    if (!storeId) return null;
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { organizationId: true } });
    return store?.organizationId ?? null;
  }

  if (role === "TECHNICIAN") {
    if (!vendorId) return null;
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { organizationId: true } });
    return vendor?.organizationId ?? null;
  }

  return null;
}
