// [기능] 화면 전반에서 쓰는 상태 라벨/뱃지 색상/타임라인 단계 상수 + 숫자 포맷터
// 여러 컴포넌트(매장/기사/본사)가 같은 문구·색을 쓰도록 한 곳에 모아둡니다.

export function fmtWon(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

// [기능] 기사가 제안한 방문 예정 일자 표시 - "오늘"/"내일"이면 그대로 알려주고,
// 그 외에는 "7월 20일(월)" 형식으로 보여줍니다.
export function fmtDate(value: Date | string, now: Date = new Date()) {
  const target = new Date(value);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86400000);

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  return target.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

// [기능] 실시간 ETA 표시 (README 로드맵 3) - 기사가 출발한 시각과 제안된
// 도착예정시간(etaMinutes)을 기준으로, 지금 시점 기준 "앞으로 몇 분 남았는지"를
// 계산합니다. 실제 GPS 연동 전까지는 이 추정치로 실시간처럼 보여줍니다.
export function fmtMinutesLeft(departedAt: Date | string, etaMinutes: number, now: Date = new Date()) {
  const departed = new Date(departedAt).getTime();
  const elapsedMin = Math.floor((now.getTime() - departed) / 60000);
  const left = etaMinutes - elapsedMin;
  if (left <= 0) return "곧 도착 예정";
  return `약 ${left}분 후 도착 예정`;
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
