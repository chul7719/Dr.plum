# 설비닥터 · 마트 설비 유지보수 매칭 플랫폼 (정식 버전 스캐폴드)

프로토타입에서 검증한 화면 흐름을 실제 로그인·데이터베이스·역할 분기를 갖춘
Next.js 풀스택 프로젝트로 옮긴 스캐폴드입니다. `npm install` 후 바로 동작하며,
아래 "구현 현황"에 정리된 대로 협력업체 실제 입찰, 사진 업로드, 실시간 진행상황,
다지점/다본사 구조까지 이미 붙어 있습니다. DB는 Neon PostgreSQL을 운영 DB로
사용하며, Vercel 배포를 전제로 구성돼 있습니다.

## 기술 스택과 이유

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | 모바일 클라이언트(매장·기사)와 반응형 PC 대시보드(본사)를 **하나의 코드베이스**에서, 서버 컴포넌트로 성능까지 챙기며 만들 수 있습니다. |
| 인증 | NextAuth.js (Credentials + JWT) | 이메일/비밀번호 로그인에 역할(role)을 세션에 담아 미들웨어에서 바로 분기할 수 있습니다. |
| DB | Prisma + PostgreSQL (Neon) | 스키마를 코드로 관리합니다. Neon은 서버리스 Postgres라 Vercel 배포와 궁합이 좋고, enum을 지원해 role/status 필드를 DB 레벨에서도 제한할 수 있습니다. |
| 스타일 | Tailwind CSS | 모바일 우선(`기본`)과 PC 반응형(`md:`, `lg:`)을 클래스 하나로 같이 표현할 수 있어 본사 대시보드처럼 "모바일에서도, PC에서도" 요구사항에 적합합니다. |

## 폴더 구조

```
webapp/
├── prisma/
│   ├── schema.prisma      # 데이터 모델 (Organization, Store, User, Vendor, Request, Quote, CompletionPhoto, Settlement 등)
│   └── seed.ts            # 테스트 계정 + 프랜차이즈 본사 2곳(격리 검증용) + 샘플 요청 생성
├── src/
│   ├── middleware.ts       # [기능] 로그인 여부 + 역할별 라우트 보호 (역할 분기 1단계)
│   ├── lib/
│   │   ├── auth.ts               # NextAuth 옵션 (로그인 검증, 세션에 role/storeId/vendorId/organizationId 포함)
│   │   ├── prisma.ts             # Prisma 클라이언트 싱글턴
│   │   ├── format.ts             # 상태 라벨/뱃지/타임라인 상수 + 실시간 ETA 포맷터
│   │   ├── payment.ts            # [기능] 결제·PG 연동 인터페이스 (지금은 MockPaymentGateway)
│   │   ├── request-include.ts    # Request 조회 시 공통으로 불러오는 연관 데이터 정의
│   │   └── request-access.ts     # [기능] 다지점/다본사 데이터 격리 공용 권한 체크
│   ├── types/next-auth.d.ts # 세션에 role/storeId/vendorId/organizationId 타입 추가
│   ├── components/
│   │   ├── MobileHeader.tsx
│   │   ├── LoginForm.tsx
│   │   ├── mart/            # 매장 담당자 화면 컴포넌트
│   │   ├── technician/      # 협력업체 기사 화면 컴포넌트 (입찰·출발/도착·완료보고+사진)
│   │   └── hq/               # 본사 대시보드·정산 컴포넌트
│   └── app/
│       ├── login/
│       ├── mart/                     # 모바일 클라이언트 (매장 담당자)
│       │   └── requests/[id], new
│       ├── technician/                # 모바일 클라이언트 (협력업체 기사)
│       ├── hq/                        # 반응형 대시보드 (본사, organization 범위로 제한)
│       │   └── settlements/           # 정산 관리
│       └── api/
│           ├── auth/[...nextauth]/
│           ├── requests/, requests/[id]/, requests/[id]/quotes/  # 입찰 제출 API
│           └── settlements/
```

## VS Code에서 시작하기

### 1. 권장 확장 프로그램
- **Prisma** (Prisma.prisma) — `.prisma` 문법 하이라이트, 포맷팅
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ESLint** (dbaeumer.vscode-eslint)
- (선택) **Error Lens** — 인라인으로 타입 오류 확인

### 2. 최초 실행

```bash
cd webapp
npm install                       # next, prisma, next-auth 등 설치
cp .env.example .env              # DATABASE_URL(Neon)과 NEXTAUTH_SECRET을 채워넣기
npx prisma migrate dev --name init   # PostgreSQL(Neon)에 테이블 생성
npm run seed                      # 테스트 계정 + 샘플 요청 생성
npm run dev                       # http://localhost:3000
```

`DATABASE_URL`은 [neon.tech](https://neon.tech)에서 무료 프로젝트를 만들면 나오는
connection string을 그대로 넣으면 됩니다. `NEXTAUTH_SECRET`은 터미널에서
`openssl rand -base64 32`로 생성한 값을 넣으면 됩니다.

### 3. 테스트 계정 (비밀번호 공통: `password123`)

| 역할 | 이메일 | 접속 화면 |
|---|---|---|
| 매장 담당자 (그린마트 역삼점) | mart@example.com | `/mart` (모바일 폭 기준으로 디자인) |
| 매장 담당자 (해피마트 잠실점) | mart2@example.com | `/mart` — mart@example.com과 다른 본사 소속, 데이터 격리 확인용 |
| 협력업체 기사 (한성설비) | tech@example.com | `/technician` — 두 본사의 요청에 모두 입찰 가능 (협력업체는 공용 마켓플레이스) |
| 본사 관리자 (그린마트 본사) | hq@example.com | `/hq`, `/hq/settlements` — 그린마트 소속 지점 데이터만 |
| 본사 관리자 (해피마트 본사) | hq2@example.com | `/hq`, `/hq/settlements` — 해피마트 소속 지점 데이터만 |

로그인하면 미들웨어가 역할에 맞는 홈으로 자동 이동시킵니다. 다른 역할의 경로로
직접 들어가려 하면(`/hq`에 매장 담당자가 접근 등) 자동으로 본인 역할의 홈으로 돌려보냅니다.
`hq@example.com`과 `hq2@example.com`으로 각각 로그인해 대시보드에 서로 다른
지점만 보이는 것을 비교해보면 다지점/다본사 격리를 바로 확인할 수 있습니다.

## 아키텍처 핵심 포인트

**역할 분기(3-way)** 는 두 겹으로 되어 있습니다.
1. `src/middleware.ts` — 페이지 단위로 URL 진입 자체를 막습니다 (`/mart`, `/technician`, `/hq`).
2. 각 API 라우트 내부에서 `session.user.role` 재검증 — 미들웨어를 우회해 API를 직접
   호출하는 경우까지 막기 위한 이중 방어입니다. (예: `/api/requests`의 POST는
   `MART_MANAGER`만, `/api/settlements`는 `HQ_ADMIN`만 허용)

**협력업체 실제 입찰 흐름**은 프로토타입의 "자동 견적 생성"을 대체합니다.
- 매장이 요청을 등록하면 `QUOTING` 상태로 열리기만 하고, 아직 견적은 없습니다.
- 협력업체 기사들이 각자 `POST /api/requests/[id]/quotes`로 가격·도착예정시간·메모를
  제안(Quote)합니다. 같은 업체가 다시 제안하면 기존 제안을 덮어씁니다(가격 수정).
- 매장 담당자가 도착한 제안 중 하나를 골라 `PATCH .../route.ts` `action: "select"`로
  업체를 확정합니다.

**실시간 진행상황(위치·ETA)**은 기사 쪽에서 직접 트리거하도록 분리했습니다.
- 예전에는 매장 쪽 "다음 단계로 진행 (데모용)" 버튼 하나로 모든 단계를 넘겼습니다.
- 이제는 `action: "depart"`(기사 출발), `action: "arrive"`(현장 도착)를 기사 앱이
  호출하고, 매장 쪽 요청 상세 화면은 5초 주기로 폴링하며 자동 반영됩니다.
  기사가 출발한 뒤에는 제안된 도착예정시간을 기준으로 "약 N분 후 도착 예정"
  카운트다운도 보여줍니다(`src/lib/format.ts`의 `fmtMinutesLeft`).
- 실제 서비스에서는 이 두 액션을 기사 모바일의 GPS 이벤트가 자동으로 호출하도록
  바꾸거나, WebSocket으로 좀 더 촘촘하게 갱신하도록 확장할 수 있습니다.

**완료보고 + 사진 업로드**는 기사가 `action: "complete"` 호출 시 조치 내용(`notes`)과
사진(`photos`, base64 data URL 배열)을 함께 보냅니다. 서버는 `Request.completionNotes`와
`CompletionPhoto` 레코드로 저장하고, 매장 상세 화면이 완료보고 확인 단계에서 그대로
보여줍니다. 지금은 데모라 base64를 DB에 그대로 저장하지만, 실제 서비스에서는
`CompletionPhoto.dataUrl` 대신 S3/R2에 업로드한 URL을 저장하도록 이 모델만 바꾸면 됩니다.

**정산(Settlement) 흐름**은 매장이 리뷰를 남기는 시점에 자동 생성됩니다.
- 매장이 리뷰를 남기면(`PATCH /api/requests/[id]` with `action: "review"`) 요청 상태가
  `PAID`가 되면서 동시에 `Settlement` 레코드가 만들어집니다.
- `amount`(매장 결제 총액)에서 `commissionRate`(현재 10% 고정)만큼을 플랫폼 수수료로,
  나머지를 `payoutAmount`(협력업체 지급액)로 미리 계산해둡니다.
- 본사는 `/hq/settlements`에서 이 목록을 보고 **청구서 발행 → 지급 완료** 순서로 상태를
  바꿉니다. "지급 완료" 처리 시 `src/lib/payment.ts`의 `paymentGateway.payout()`을
  호출합니다 — 지금은 `MockPaymentGateway`가 항상 성공을 흉내내고 가짜 거래번호를
  돌려주지만, 실제 PG(토스페이먼츠/포트원)를 붙일 때는 같은 인터페이스를 구현하는
  클래스로 교체하기만 하면 나머지 코드는 그대로 동작합니다.

**다지점/다본사 구조**는 `Organization` 모델로 표현합니다.
- `Organization` 1개가 여러 `Store`를 가지고, `HQ_ADMIN` 계정은 특정 Organization에
  소속됩니다. `Vendor`(협력업체)는 어느 Organization에도 속하지 않는 공용 마켓플레이스라,
  같은 기사가 여러 프랜차이즈의 요청에 동시에 입찰할 수 있습니다.
- 본사 대시보드/정산 API/요청 목록·상세 API 모두 `session.user.organizationId`(또는
  매장 담당자는 `storeId`)로 조회 범위를 제한합니다. 특정 요청 ID를 URL로 직접 넣어도
  다른 본사/지점 소속이면 `src/lib/request-access.ts`의 `canAccessRequest()`가 403을
  돌려줘 데이터가 새지 않습니다.

**모바일/반응형 구분**은 페이지 단위로 다르게 접근했습니다.
- `/mart`, `/technician`은 `max-w-md mx-auto`로 폭을 모바일에 맞게 고정해 PC에서 봐도
  모바일 UI처럼 중앙에 좁게 보이도록 했습니다 (실제 서비스에서 이 두 역할은 대부분
  스마트폰으로 접속하기 때문입니다).
- `/hq`, `/hq/settlements`는 Tailwind의 `md:` 접두사로 "모바일=카드형 목록,
  PC(768px 이상)=테이블형" 두 가지 레이아웃을 같은 페이지 안에 넣고 CSS로만
  전환되게 했습니다. 리사이즈해보면 바로 확인할 수 있습니다.

## 소스 내 주석 규칙

파일 상단과 주요 블록에 `[기능]` / `[디자인]` 태그를 붙여, 그 코드가 README의
어떤 항목에 대응하는지 바로 알 수 있게 해뒀습니다.
- `[기능]` — 데이터 흐름·상태 전이·권한 검사 등 로직에 관한 설명
- `[디자인]` — 레이아웃·반응형 전환·시각적 배치 등 UI에 관한 설명

## 구현 현황 (이전 "다음 개발 단계" 로드맵 반영)

| 항목 | 상태 | 비고 |
|---|---|---|
| 1. 협력업체 실제 입찰 흐름 | ✅ 구현 완료 | `/api/requests/[id]/quotes`, 기사 앱 "입찰 가능한 신규 요청" 화면 |
| 2. 사진 업로드 (완료보고) | ✅ 구현 완료 (데모용 base64 저장) | `CompletionPhoto` 모델. 실제 서비스는 S3/R2 URL로 교체 필요 |
| 3. 실시간 위치·ETA | ✅ 폴링 기반으로 구현 | 기사 출발/도착 트리거 + 매장 화면 5초 폴링 + ETA 카운트다운. 진짜 GPS 좌표 추적은 아직 없음 |
| 4. 결제·PG 연동 | 🟡 인터페이스만 준비 | `src/lib/payment.ts`의 `PaymentGateway` 인터페이스 + `MockPaymentGateway`. 실제 토스페이먼츠/포트원 크레덴셜 연동은 별도 작업 필요 |
| 5. 다지점/다본사 구조 | ✅ 구현 완료 | `Organization` 모델 + 조회 범위 제한 + 접근 권한 체크 |
| 6. 배포 | ✅ Vercel + Neon | 아래 "배포" 섹션 참고 |

## 배포 (Vercel + Neon)

DB는 이미 Neon PostgreSQL로 옮겨져 있고(`prisma/schema.prisma`의
`datasource db { provider = "postgresql" }`), GitHub 저장소도 준비돼 있습니다.
Vercel에 올리는 절차:

1. https://vercel.com 에서 GitHub 저장소를 Import
2. 아래 3개 환경변수를 Vercel 프로젝트 설정 → Environment Variables에 추가
   (값은 로컬 `.env` 파일과 동일한 걸 쓰면 됩니다 — `.env`는 git에 포함되지 않으므로
   Vercel에는 반드시 직접 입력해야 합니다):

   | Key | 값 |
   |---|---|
   | `DATABASE_URL` | Neon 프로젝트의 connection string |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32`로 생성한 값 |
   | `NEXTAUTH_URL` | 배포된 실제 주소 (예: `https://your-app.vercel.app`) — 처음엔 placeholder를 넣고 배포 후 실제 주소로 갱신 |

3. Deploy. 이후 스키마가 바뀌면 `npx prisma migrate deploy`를 로컬에서
   Neon `DATABASE_URL`로 실행해 운영 DB에도 반영합니다 (Vercel 빌드 시
   자동 마이그레이션은 별도 설정 전까지는 하지 않습니다).
