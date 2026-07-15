// [기능] 결제·정산 대행(PG) 연동 인터페이스 (README 로드맵 4)
//
// 지금은 실제 PG 계정(토스페이먼츠/포트원 등)이 없어 진짜 계좌이체를 붙일 수
// 없습니다. 대신 나중에 실제 연동을 붙이기 쉽도록 "인터페이스"만 먼저
// 정의해두고, 지금은 그 인터페이스를 흉내만 내는 MockPaymentGateway를
// 기본 구현으로 사용합니다.
//
// 실제 연동 시 할 일: 이 인터페이스를 구현하는 TossPaymentsGateway(또는
// PortOneGateway)를 추가하고, 맨 아래 `paymentGateway` 값만 그걸로
// 교체하면 됩니다. 호출하는 쪽(예: /api/settlements)은 코드를 바꿀 필요가
// 없습니다.

export interface PayoutParams {
  settlementId: string;
  vendorName: string;
  amount: number; // 협력업체에게 지급할 금액 (원)
}

export interface PayoutResult {
  success: boolean;
  transactionId: string;
}

export interface PaymentGateway {
  // 정산이 "지급 완료" 상태로 바뀔 때 협력업체에게 실제 금액을 지급합니다.
  payout(params: PayoutParams): Promise<PayoutResult>;
}

// [기능] 데모/개발용 구현체 - 실제 이체 없이 항상 성공한 것처럼 응답합니다.
export class MockPaymentGateway implements PaymentGateway {
  async payout({ settlementId }: PayoutParams): Promise<PayoutResult> {
    // TODO(실제 연동): 여기를 토스페이먼츠 지급대행 API 또는 포트원 API 호출로 교체합니다.
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      transactionId: `MOCK-${settlementId}-${Date.now()}`
    };
  }
}

export const paymentGateway: PaymentGateway = new MockPaymentGateway();
