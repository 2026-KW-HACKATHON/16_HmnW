# 위월계더 (월계1동 제휴 모음집) — 제품 스펙 (v1, 2026-10-08)

팀: 2026 KW 해커톤 16조 유구무언 (류한솔·최유민·오태호·강진우)
한 줄: 월계1동을 방문한 외부인의 동선을 골목 상권까지 연결하는 지역 제휴 모음 서비스.
이 문서는 모든 구현 에이전트가 읽는 단일 기준이다. 원문 기획서 요약은 §1, 확정된 결정은 §2.

## 1. 기획 요약 (원문 기획서 기준)

- 대상: 광운대 학생 + 동해문화예술관·아이스링크·우이마루를 찾는 외부 방문객 (+ 월계 주민은 '누구나' 혜택)
- 배경: 단과대·동아리 제휴 혜택이 인스타·포스터에 흩어져 있어 본인이 쓸 수 있는 혜택을 찾기 어렵다. 공연장·아이스링크·우이천 방문객이 월계1동 상권으로 유입될 수단이 없다. 월계1동은 폐업률 128.1%(문 닫는 가게 > 여는 가게).
- 목표: 학생이 빠지는 시간대(주말·저녁·방학)에 외부 방문 수요를 연결하고, 목적지만 이용하고 떠나는 방문객의 소비 동선을 월계1동 상권으로 확장.
- 기능:
  1. 자격 인증 — 학생: 학생증 or KLAS QR. 외부인: 인증 기준 24시간 이용 가능.
     - 동해문화예술관: 공연 전날/당일, 공연장 반경 500m 안에서 '인증하기' → 티켓 촬영(공연명·일시·장소·인원·예매번호) OCR → 앱의 공연 일정과 대조.
     - 아이스링크: 현장 티켓/영수증 촬영 → OCR로 이용 인원 확인.
     - 우이마루: 카페·한강라면 영수증 촬영 → OCR 인증.
  2. 이용자별 맞춤 노출 — 학생은 본인 소속(단과대·동아리) 제휴 모아보기, 외부인은 카테고리별, 현재 위치 또는 방문 목적지와 가까운 제휴처 우선.
  3. 매장에서 쿠폰 화면 제시 후 사용 — 사용 완료 시 상태 변경으로 중복 사용 방지.
  4. 사장님의 추가 제휴 제시 기능.
- 지역: 월계1동 — 광운대 정문·후문 상권, 광운대역 일대, 우이천변. 다음 단계는 노원구 전체.

## 2. 확정 결정 (사용자 답변 반영)

| 항목 | 결정 |
|---|---|
| 플랫폼 | PWA 웹앱. Vite + React 18 + TypeScript. 모바일 퍼스트(390px 기준), 홈화면 설치 가능. |
| 백엔드 | Firebase Spark(무료) 플랜. Firestore + Authentication. **Cloud Functions·Storage 사용 금지**(Blaze 필요). 모든 로직은 클라이언트 + Firestore 보안규칙. |
| 인증(계정) | 손님: Firebase 익명 로그인(자동, 화면 없음). 사장님: 이메일/비밀번호. |
| OCR | Tesseract.js(kor+eng)를 기기 안에서 실행. 인증 사진은 **서버로 올리지 않는다**. OCR 결과를 폼에 채워 주고 사용자가 확인·수정하는 흐름(OCR 실패해도 진행 가능). |
| 동해문화예술관 인증 | 2안. 공연 전날/당일 + 공연장 반경 500m(Geolocation) + 티켓 촬영 OCR → `events` 컬렉션의 공연과 대조. |
| 우이마루 | **제외**(2026-10-08 결정). 실제 위치가 월계2동·월계1동 중심에서 1.1km 밖. 외부인 방문지는 동해문화예술관·아이스링크 2곳. |
| 외부인 자격 유효기간 | 인증 시각 + 24시간. |
| 학생 자격 유효기간 | 학기 말(상수, 기본 2026-12-31). 학번은 **숫자 10자리**(사용자 확인). 단과대 9개: 전자정보공과·인공지능융합·공과·자연과학·인문사회과학·정책법학·경영·참빛인재·인제니움. |
| 사장님 기능 | 로그인 + 가게 등록 + 혜택 등록(승인 없이 즉시 게시) + 간단 통계(오늘/7일 사용 수) + 혜택 on/off. |
| 운영자 | 별도 화면 없음. Firestore `admins/{uid}` 문서가 있는 계정만 events·시드 쓰기 가능. 공연 일정은 **KOPIS 오픈 API**(공연예술통합전산망, 서비스키 필요)로 `scripts/kopis-sync.mjs`가 동기화. |
| 제휴처 데이터 | 팀이 보유한 **실제 제휴 리스트**를 시드로 사용(파일 수령 예정). 수령 전까지는 `seed/partners.sample.json` 자리표시자. |
| 좌표 기준 | `docs/domain.md` §A 값 사용(동해문화예술관 37.6202512,127.0573526 · 아이스링크 37.6203081,127.0571642 · 정문 37.6192755,127.0582184 · 후문 37.6202386,127.0610944 · 광운대역 37.6236987,127.0618193 · 우이천 37.6175875,127.0574992). |
| 지도 | 지도 타일 없음(API 키 불필요). 거리(m) 표시 + 거리순 정렬 + '길찾기' 외부 링크(네이버지도/카카오맵 웹 URL). |
| 주소→좌표 | 사장님 가게 등록 시 Nominatim(OpenStreetMap) 검색, 실패 시 상권 구역 프리셋 좌표. |
| 가게 사진 | 선택 사항. 클라이언트에서 480px JPEG로 축소해 base64로 Firestore 문서에 저장(≤ 80KB). |
| 서비스명 | **위월계더** (2026-10-08 사용자 확정). 워드마크는 Pretendard 굵은 글자. 화면 라벨은 '외부인' 대신 '방문객'(데이터 값은 visitor 유지). PIN 설정 가게는 길게 누르기 대신 PIN 입력. |
| 디자인 | 당근·토스 계열(흰 바탕, 굵은 한글 타이포, 둥근 카드). `design/DESIGN.md`가 기준. 폰트 Pretendard. |
| 데모 모드 | Firebase 환경변수가 없으면 로컬(localStorage) 어댑터로 동작해 바로 실행 가능. 숨은 '발표 모드'(설정의 버전 7번 탭)로 위치 검사·OCR 실패를 우회. |

## 3. 사용자 흐름

### 3.1 손님 — 첫 실행
1. 앱 열면 익명 로그인 자동. 홈에 '누구나' 혜택이 보이고 상단에 "학생증·티켓 인증하면 혜택 N개 더" 배너.
2. 하단 탭: **혜택**(홈) · **지도/주변**(거리순 리스트) · **내 쿠폰**(사용 내역·자격 상태) · **인증**(자격) · 더보기(설정/사장님 전환).

### 3.2 학생 인증
- 방법 A 학생증 촬영: 카메라/갤러리 → OCR → `광운대학교|KWANGWOON` 포함 여부, 학번(숫자 10자리), 이름, 단과대/학과 추출 → 확인 폼(단과대 select, 동아리 복수 select) → 승인.
- 방법 B KLAS QR: 카메라로 QR 스캔(BarcodeDetector, 미지원 시 jsQR). 실제 KLAS QR 규격은 비공개이므로 데모 규격 `KW1|<학번>|<이름>|<단과대코드>|<발급ISO>|<HMAC-SHA256 앞 8자>`를 쓰고, 개발자 메뉴에 샘플 QR 생성기를 둔다. 실서비스 연동 지점으로 주석 표기.
- 결과: `users/{uid}.student = {method, studentNo(마스킹 저장: 앞 4자리만), college, clubs[], verifiedAt, expiresAt}`.

### 3.3 외부인 인증 (유효 24h)
- 공통: 방문지 선택(동해문화예술관 / 아이스링크 — 둘 다 광운로 21, 같은 건물군) → 안내 → 촬영 → OCR 진행 화면(진행률) → 추출 결과 확인·수정 폼 → 승인 → 홈으로 이동하며 "외부인 혜택 N개가 열렸어요" 토스트.
- 동해문화예술관: 공연 선택(`events` 중 오늘·내일) → 위치 권한 → 500m 안인지 검사(haversine) → 실패 시 사유 안내(거리 m 표시) → 티켓 촬영 → OCR에서 공연명·일시·인원·예매번호 추출 → 선택한 공연과 제목 유사도/날짜 대조 → 확인.
- 아이스링크: 티켓/영수증 → OCR에서 인원 수·일시·금액 → `partySize` 저장.
- 결과: `users/{uid}.visitor = {venue, eventId?, partySize?, verifiedAt, expiresAt}`.

### 3.4 혜택 탐색
- 자격에 맞는 혜택만 노출(all / student(단과대·동아리 조건 포함) / visitor(venue 조건 포함)).
- 필터: 업종 칩, 구역 칩(정문·후문·광운대역·우이천변). 정렬: 지금 사용 가능 → 거리순(현재 위치 또는 선택한 방문 목적지 기준).
- 카드: 가게명·업종·거리 / 혜택 제목 / 대상 배지 / 요일·시간 / 상태(지금 사용 가능 · 시간 아님 · 오늘 사용함).
- 상세: 가게 정보(주소·전화·영업시간·길찾기), 혜택 조건, '매장에서 사용하기' CTA.

### 3.5 쿠폰 사용
- '매장에서 사용하기' → 직원 확인 화면: 가게명·혜택·자격 배지·실시간 초 단위 시계·움직이는 배경 패턴(캡처 방지) → 직원이 **'사용 완료' 1.5초 길게 누르기** (가게에 PIN이 설정돼 있으면 4자리 PIN 입력) → `redemptions` 기록 → 도장 애니메이션 → 쿠폰 상태 '사용함'.
- 제한: `coupon.limit` = `once_per_day` | `once_per_verification` | `unlimited`.

### 3.6 사장님
- 더보기 → '사장님이신가요?' → 이메일 가입/로그인 → 가게 등록(이름·업종·구역·주소 검색·전화·영업시간·사진·PIN 선택) → 혜택 등록(제목·설명·대상·요일·시간대·기간·1인 제한) → 즉시 게시.
- 대시보드: 내 혜택 목록(on/off 토글), 오늘/7일 사용 수, 최근 사용 내역.
- 기획 메시지: 혜택 등록 화면에 "학생이 빠지는 주말·저녁엔 공연·스케이트를 마친 외부인에게 혜택을 열어 보세요" 류의 가이드 1줄.

## 4. 데이터 모델 (Firestore)

```
users/{uid}            role: 'customer'|'owner', createdAt,
                       student?: {method:'card'|'qr', studentNoMasked, college, clubs:string[], verifiedAt, expiresAt},
                       visitor?: {venue:'donghae'|'icerink', eventId?, partySize?, verifiedAt, expiresAt}
shops/{shopId}         ownerUid, name, category, area:'main_gate'|'back_gate'|'station'|'uicheon', address, lat, lng,
                       phone?, hours?, photoDataUrl?, pin?, createdAt
coupons/{couponId}     shopId, title, desc?, audience: {type:'all'|'student'|'visitor', colleges?:string[], clubs?:string[], venues?:string[]},
                       days:'all'|'weekday'|'weekend'|number[], timeFrom:'HH:mm', timeTo:'HH:mm', validFrom?, validTo?,
                       limit:'once_per_day'|'once_per_verification'|'unlimited', active, createdAt
redemptions/{id}       uid, couponId, shopId, at, dayKey:'YYYY-MM-DD', verificationAt?
events/{id}            venue:'donghae', title, startsAt, endsAt?, hall?
```
보안규칙: users는 본인만 읽기/쓰기. shops·coupons·events는 모두 읽기; shops는 ownerUid 본인만 쓰기, coupons는 해당 shop의 owner만 쓰기, events는 쓰기 금지(콘솔). redemptions는 uid 본인이 생성, 본인 또는 shop owner가 읽기, 수정·삭제 금지.
주의: 자격 인증 결과를 클라이언트가 직접 기록한다(Spark 제약). 실서비스에서는 서버 검증으로 옮길 지점임을 코드 주석으로 표기.

## 5. 기술 스택·제약

- Vite + React 18 + TypeScript, react-router v6, vite-plugin-pwa, firebase(modular v10+), tesseract.js v5+, jsqr(폴백), vitest.
- 상태 관리 라이브러리 없음(React context + Firestore onSnapshot). CSS는 CSS Modules 또는 단일 토큰 기반 전역 CSS. UI 라이브러리 없음(디자인 문서대로 직접).
- 폰트: Pretendard (jsdelivr CDN `pretendard` 패키지의 `dist/web/variable/pretendardvariable-dynamic-subset.css`).
- Tesseract 언어 데이터는 기본 CDN 사용, 첫 로딩 진행률 표시. 이미지는 OCR 전 캔버스에서 긴 변 1600px로 축소 + 그레이스케일.
- 접근성: 포커스 가시, 버튼 44px 이상, 색만으로 상태 전달 금지(아이콘/텍스트 병행).
- 한국어 UI 카피. 존댓말, 짧고 구체적으로. 쿠폰 대신 '혜택'을 기본 명칭으로, 매장 제시 화면에서는 '쿠폰' 허용.
- 데모 모드: `VITE_FIREBASE_*` 미설정 시 `src/data/local.ts` 어댑터(localStorage + 시드 JSON)로 동일 인터페이스 제공. 데이터 접근은 `src/data/index.ts`의 한 인터페이스로만.

## 6. 미정·추후 입력 대기

- 실제 제휴 리스트(팀 보유) → `seed/partners.json`으로 변환 예정.
- Firebase 프로젝트 설정값(`.env.local`).
- ~~KOPIS 서비스키~~ 수령 완료(2026-10-08, `.env.local`). 시설코드 FC002118 = 광운대학교 동해문화예술관. 기본 공연 시드는 `seed/events.json`(실제), 발표용 가짜 공연은 /dev '데모 공연 추가'로만.
