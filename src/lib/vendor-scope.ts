import { prisma } from "@/lib/prisma";

// [기능] 협력업체 실제 입찰 흐름의 본사 전용 업체 스코프 (README: "업체 등록").
// vendorId가 본사 전용 업체(Vendor.organizationId 있음)면 그 organizationId를,
// 공용 마켓플레이스 업체(organizationId 없음)면 null을 반환합니다.
// null이면 "모든 본사의 요청에 입찰 가능"이라는 뜻으로 씁니다.
export async function resolveVendorScope(vendorId?: string | null): Promise<string | null> {
  if (!vendorId) return null;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { organizationId: true } });
  return vendor?.organizationId ?? null;
}
