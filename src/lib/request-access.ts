import type { Session } from "next-auth";

// [기능] 다지점/다본사 데이터 격리 (README 로드맵 5) 공용 권한 체크
// GET/PATCH 양쪽에서 같은 규칙을 써야 "URL로 직접 접근하면 남의 요청도
// 보인다"는 구멍이 생기지 않습니다. role별 규칙:
//   MART_MANAGER  내 지점(storeId)의 요청만
//   TECHNICIAN    아직 입찰 중(QUOTING)이거나 내가 선정된 요청만
//   HQ_ADMIN      내 본사(organizationId) 소속 지점의 요청만
export function canAccessRequest(
  session: Session,
  request: { storeId: string; status: string; store?: { organizationId: string }; selectedQuote?: { vendorId: string } | null }
) {
  const { role, storeId, vendorId, organizationId } = session.user;
  if (role === "MART_MANAGER") return request.storeId === storeId;
  if (role === "TECHNICIAN") return request.status === "QUOTING" || request.selectedQuote?.vendorId === vendorId;
  if (role === "HQ_ADMIN") return request.store?.organizationId === organizationId;
  return false;
}
