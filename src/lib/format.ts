// [기능] 화면 전반에서 쓰는 상태 라벨/뱃지 색상/타임라인 단계 상수 + 숫자 포맷터
// 여러 컴포넌트(매장/기사/본사)가 같은 문구·색을 쓰도록 한 곳에 모아둡니다.

export function fmtWon(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

// [기능] 기사가 제안한 방문 예정 일시(scheduledAt) 표시 (README 로드맵 3).
// 오늘이면 지금 시점 기준 "N분 후 도착 예정"으로 실시간 계산해서 보여주고,
// 다른 날짜면 기사가 입력한 날짜+시각을 그대로 "7월 20일(월) 14:30 방문 예정"
// 형식으로 보여줍니다. 견적 비교 목록과 출발 후 실시간 트래킹에 모두 씁니다.
export function fmtArrival(scheduledAt: Date | string, now: Date = new Date()) {
  const target = new Date(scheduledAt);
  const isToday = target.toDateString() === now.toDateString();

  if (isToday) {
    const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
    if (diffMin <= 0) return "곧 도착 예정";
    return `${diffMin}분 후 도착 예정`;
  }

  const dateLabel = target.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const timeLabel = target.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} ${timeLabel} 방문 예정`;
}

export const STATUS_LABEL: Record<string, string> = {
  QUOTING: "견적 대기",
  ACCEPTED: "업체 선정",
  IN_PROGRESS: "수리 중",
  COMPLETED: "완료 대기",
  PAID: "정산 완료"
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  QUOTING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-brand-light text-brand",
  IN_PROGRESS: "bg-red-50 text-red-700",
  COMPLETED: "bg-brand-light text-brand",
  PAID: "bg-green-50 text-green-700"
};

export const TIMELINE_STEPS = ["요청 접수", "기사 출발", "현장 도착·점검", "수리 완료", "정산·리뷰"];
