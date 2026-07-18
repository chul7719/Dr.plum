// [기능] 화면 전반에서 쓰는 상태 라벨/뱃지 색상/타임라인 단계 상수 + 숫자 포맷터
// 여러 컴포넌트(매장/기사/본사)가 같은 문구·색을 쓰도록 한 곳에 모아둡니다.

export function fmtWon(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

// [기능] 방문 예정 일시(scheduledAt)를 "7월 20일(월) 14:30 방문 예정" 형식으로
// 그대로 보여줍니다 (24시간제). 기사 앱은 자기가 입력한 값을 그대로 확인하면
// 되므로 상대 시간 계산 없이 항상 이 형식을 씁니다.
export function fmtScheduledAt(scheduledAt: Date | string) {
  const target = new Date(scheduledAt);
  const dateLabel = target.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const timeLabel = target.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} ${timeLabel} 방문 예정`;
}

// [기능] 매장 담당자용 방문 예정 표시 (README 로드맵 3).
// 오늘이면 지금 시점 기준 "N분 후 도착 예정"으로 실시간 계산해서 보여주고,
// 다른 날짜면 fmtScheduledAt과 동일하게 날짜+시각을 그대로 보여줍니다.
// 견적 비교 목록과 출발 후 실시간 트래킹에 모두 씁니다.
export function fmtArrival(scheduledAt: Date | string, now: Date = new Date()) {
  const target = new Date(scheduledAt);
  const isToday = target.toDateString() === now.toDateString();

  if (isToday) {
    const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
    if (diffMin <= 0) return "곧 도착 예정";
    return `${diffMin}분 후 도착 예정`;
  }

  return fmtScheduledAt(target);
}

// [기능] 요청 상태(Request.status) 5단계의 기본 라벨.
// IN_PROGRESS는 "기사 이동중"과 "현장 점검중" 두 세부 국면을 모두 포함하는
// 값이라 목록처럼 타임라인 정보가 없는 곳에서만 이 라벨(진행중)을 씁니다.
// 타임라인 정보가 있는 곳은 항상 getPhaseLabel()을 쓰세요.
export const STATUS_LABEL: Record<string, string> = {
  QUOTING: "견적 대기",
  ACCEPTED: "업체 선정",
  IN_PROGRESS: "진행중",
  COMPLETED: "점검완료",
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

// [기능] 매장 목록/본사 대시보드/기사 앱이 전부 같은 문구를 쓰도록 하는
// 단일 소스 - 상태(status) 문구를 계산하는 곳은 이 함수 하나로 통일합니다.
// status만으로는 IN_PROGRESS 구간이 "기사 이동중"인지 "현장 점검중"인지
// 구분이 안 되므로, 지금까지 쌓인 TimelineEvent 개수(timelineEventCount)를
// 같이 봐서 판단합니다.
//   1건(요청 접수) - QUOTING/ACCEPTED 단계
//   2건(+ 기사 출발) - 기사이동중
//   3건 이상(+ 현장 도착) - 현장점검중
export function getPhaseLabel(status: string, timelineEventCount: number): string {
  if (status === "IN_PROGRESS") {
    return timelineEventCount >= 3 ? "현장점검중" : "기사이동중";
  }
  return STATUS_LABEL[status] ?? status;
}
