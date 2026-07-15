// [기능] Request를 조회할 때 항상 같이 불러오는 연관 데이터 정의를 한 곳에
// 모아둡니다. /api/requests, /api/requests/[id], /api/requests/[id]/quotes가
// 공통으로 사용해 응답 모양이 always 일관되게 유지됩니다.
export const REQUEST_INCLUDE = {
  quotes: { include: { vendor: true }, orderBy: { price: "asc" as const } },
  selectedQuote: { include: { vendor: true } },
  timelineEvents: { orderBy: { occurredAt: "asc" as const } },
  photos: { orderBy: { createdAt: "asc" as const } },
  review: true,
  settlement: true,
  store: true
};
