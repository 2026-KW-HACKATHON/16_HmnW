# 위월계더 — 프로젝트 전체 정리

2026 KW 해커톤 · 16조 유구무언(류한솔·최유민·오태호·강진우) · 최종발표 2026-10-09 09:00
라이브: https://kwhackton.web.app · 저장소 루트: `d:\kwhackton` · 작성 2026-10-08

> 한 문장: **월계1동을 찾은 광운대 학생과 공연장·아이스링크 방문객에게, 자격 × 시간 × 동선에 맞는 골목 가게 혜택을 열어 주는 동네 패스.**

---

## 1. 문제와 해결

| | 내용 |
|---|---|
| 문제 | 월계1동은 문 닫는 가게가 여는 가게보다 많다(개·폐업 비율 128.1%, 팀 산출). 단과대·동아리 제휴는 인스타·포스터에 흩어져 있어 본인이 쓸 수 있는 혜택을 찾기 어렵다. 캠퍼스 안 동해문화예술관(대극장 2,005석·소극장 398석)과 아이스링크(매일 일반개장) 방문객은 광운대역까지 549m를 그냥 지나간다. |
| 해결 | 학생증·티켓·영수증으로 자격을 인증하면 **내 자격에 맞는 혜택만** 보여 주고, 공연장 기준 거리순으로 가게를 우선 노출한다. 사장님은 승인 없이 혜택을 올리고 '학생 빠지는 시간대'를 데이터로 본다. |
| 대상 | 광운대 학생(단과대·동아리 단위) · 방문객(동해문화예술관 공연 관람객, 아이스링크 이용객) · 월계 주민(누구나) · 사장님 |
| 제외 결정 | 우이마루 — 월계2동(월계1동 중심에서 1.1km)이라 1단계 제외. 다음 단계는 노원 수변카페 시리즈(두물마루·당현마루·우이마루). |

---

## 2. 손님 기능

### 2.1 홈(혜택)
- 자격에 맞는 활성 혜택만 **티켓형 카드**(절취선·반원 홈·거리 스텁)로 표시. 지금 사용 가능 → 거리순 정렬.
- 필터: 업종 칩(식당·카페·술집·미용실·당구장·볼링장·노래방), 구역 칩(정문·후문·광운대역·우이천변).
- 인증 배너: "인증하면 혜택 N개가 더 열려요"(실제 잠긴 활성 혜택 수).
- **잠긴 혜택 섹션**: 접힌 "인증하면 열리는 혜택 N개" — 흐린 카드 + 이유(학생 인증 필요 / 방문객 인증 필요 / 만료).
- **QR로 들어온 가게**: 매장 QR(`/?shop=<id>`)로 들어오면 그 가게 혜택을 맨 위에 섹션으로.

### 2.2 주변
- 기준점 세그먼트: 현재 위치(권한 요청, 거부 시 공연장 폴백) / 공연장 / 광운대역 / 정문. 거리 + "걸어서 N분"(80m/분).

### 2.3 혜택 상세 · 사용
- 티켓 카드(가게명 작게 / 혜택명 굵게 / 대상 배지 / 오늘 ~HH:mm) + 이용 조건 key-value + 가게 정보(주소·전화·영업시간·네이버지도/카카오맵 링크).
- 상태별 표시: 지금 사용 가능 / 사용 시간 아님(요일·시간 안내) / 인증 필요(→ "인증하고 사용하기") / 종료 / 오늘 사용함.
- **직원 확인 화면**(`/coupon/:id/use`): 초 단위 실시간 시계 + 날짜 + 1초마다 바뀌는 점 인디케이터 + 8초 주기 사선 배경(캡처 방지), 티켓 카드(자격 배지·조건), 직원이 **1.5초 길게 누르기**(가게에 PIN이 있으면 PIN 입력) → 저장 성공 후에만 '사용 완료' 도장. 실패 시 "다시 눌러 주세요".
- 사용 제한: `once_per_day` / `once_per_verification` / `unlimited`. 사용 기록 문서 ID를 `uid_couponId_dayKey`로 고정해 **서버 규칙에서 중복을 거부**(두 폰 동시 사용·API 직접 호출 불가).

### 2.4 내 쿠폰
- **패스 카드**: 학생 패스(단과대 · 12월 31일까지) / 방문객 패스(방문지 · 남은 시간 HH:MM, 1시간 미만 경고색 · 인원 · 열린 혜택 수). 미인증이면 "인증하면 패스가 생겨요".
- 사용 내역: 가게명 · 혜택명 / 오늘 14:17 형식.

### 2.5 자격 인증
공통: 사진은 저장하지 않고 인식 직후 폐기. 인식 엔진은 **Gemini(Firebase AI Logic) 우선, 오프라인·오류·할당 초과 시 기기 내 Tesseract로 자동 폴백**(화면에 엔진 표시 없음). 모든 OCR 원문은 `redactSensitive`로 카드번호·유효기간·CVC·전화번호를 삭제한 뒤에만 다룬다.

| 흐름 | 단계 | 비고 |
|---|---|---|
| 학생증 촬영 | ① 촬영(세로 권장 안내, 카메라 입력만; 앨범·직접 입력은 발표 모드에서만) ② 내용 확인(학번·이름 읽기 전용, 단과대 select, 동아리 ClubPicker) | 전처리: 밝은 영역(카드) 자동 크롭 → 1400px 확대 → 그레이스케일. 가로로 찍은 사진은 회전을 자동 판별하고, Tesseract 단어 위치로 카드번호·유효기간·CVC·영문명 영역을 **기기에서 흰색으로 가린 뒤** Gemini에 전송(못 찾으면 위쪽 58%만 전송). Tesseract는 PSM 11+6 병합. 학부명→단과대 매핑(정보융합학부→인공지능융합대학 등). 신뢰도 낮으면 인증 버튼 비활성. **학번 1개 = 계정 1개**(`studentNos/{sha256(학번)}`, 규칙으로 강제). |
| 코드 인증 | 인증 탭 → 코드로 인증하기. Firestore `accessCodes/{CODE}`(코드를 알아야만 조회, 목록 불가, admin만 쓰기). 기본 코드: `KW2026`(학생 체험·인공지능융합대학), `VISIT2026`(방문객 체험 24h), `DONGHAE-STAFF`(스태프 12h). | 교수님·심사위원 체험, 공연장 스태프용. `scripts/seed-access-codes.mjs`로 관리. |
| KLAS QR | 캡처 업로드 전용(KLAS 앱 → 모바일학생증 QR → 화면 캡처 → 올리기) | 실제 KLAS QR 규격은 비공개 → 데모 규격 `KW1|학번|이름|단과대|발급ISO|HMAC8`(코드에 `INTEGRATION:` 표기). 발표 모드에서 `/dev` 샘플 QR. |
| 동해문화예술관 | ① 공연 선택(KOPIS 일정 중 오늘·내일; 없으면 '티켓만으로 인증' + 다가오는 공연 표시) ② 위치 확인(공연장 500m, 발표 모드 건너뛰기) ③ 티켓 촬영 ④ 내용 확인(공연명·일시·인원·예매번호) | Gemini: 공연명 전체·예매번호·공연장까지 추출. 날짜 검증: 공연 전날~당일. |
| 아이스링크 | ① 영수증 촬영 ② 내용 확인(인원·일시·금액) | 인원은 **입장 품목(대인·소인·청소년·어린이 등)만** 합산, 대여·부가(스케이트·장갑·헬멧·보관함) 제외. 직접 입력 항상 허용. 24시간 이내 영수증. |

자격 유효기간: 학생 = 학기 말(2026-12-31), 방문객 = 인증 후 24시간.

### 2.6 더보기 · 개발자 메뉴
- 더보기: 사장님 전환, 화면 테마(시스템/라이트/다크), 인증 정보 지우기, 개인정보 안내, 문의, 버전.
- 버전 7번 탭 → `/dev`: **발표 모드**(위치 검사·날짜 제한 우회, 직접 입력 허용), 샘플 QR, 시드 투입·데모 공연 추가(`admins` 계정만).

---

## 3. 사장님 기능
- 이메일 가입/로그인(익명 손님 계정을 승격해 uid 유지) · 로그아웃.
- 가게 등록: 이름·업종·구역·주소(Nominatim 지오코딩, 실패 시 구역 프리셋 좌표)·전화·영업시간·사진(480px base64)·직원 PIN(SHA-256 해시 저장).
- 혜택 등록(승인 없이 즉시 게시): 제목·설명·대상(누구나/학생[단과대 9개 칩·동아리 ClubPicker]/방문객[동해·아이스링크])·요일·시간·기간·1인 제한.
- 대시보드: 오늘/7일 사용 수(실시간 구독), 대상(학생/방문객/누구나) × 시간대(오전/점심/오후/저녁/밤) 막대, 최근 사용 5건, 혜택 on/off, 내 가게 목록.
- **매장 QR 포스터**(`/owner/poster/:shopId`): 워드마크·가게명·QR(`/?shop=id`)·활성 혜택 3개, 이미지 저장(1080×1350 PNG)·인쇄.

---

## 4. 데이터 · 운영

### 4.1 Firestore 컬렉션
| 컬렉션 | 내용 | 규칙 요약 |
|---|---|---|
| `users/{uid}` | role, student{method, studentNoMasked, college, clubs, verifiedAt, expiresAt}, visitor{venue, eventId, partySize, verifiedAt, expiresAt} | 본인만 읽기/쓰기 |
| `shops/{id}` | ownerUid, name, category, area, address, lat/lng, phone, hours, photoDataUrl(<120KB), pinHash | 모두 읽기 · 소유자/admin 쓰기 · ownerUid 불변 · name 1~40자 |
| `coupons/{id}` | shopId, title, desc, audience{type, colleges, clubs, venues}, days, timeFrom/To, validFrom/To, limit, active | 모두 읽기 · 가게 소유자/admin 쓰기 · shopId 불변 |
| `events/{id}` | venue, title, startsAt, endsAt?, hall?, kopisId?, poster? | 모두 읽기 · admin만 쓰기 |
| `redemptions/{uid_coupon_key}` | uid, couponId, shopId, at, dayKey, verificationAt? | 본인 uid 접두 ID로만 생성 · update/delete 금지 → 중복 불가 · 본인 또는 가게 소유자 읽기 |
| `studentNos/{sha256}` | uid, claimedAt | 본인 생성만 · 수정 금지 → 학번 중복 등록 차단 |
| `admins/{uid}` | (빈 문서) | 콘솔에서만 생성 |

### 4.2 운영 계정·스크립트
- Firebase 프로젝트 `kwhackton`(Spark 무료 플랜: Firestore + Auth(익명·이메일) + AI Logic(Gemini Developer API)). Storage·Functions 미사용.
- 운영 봇 `seed-bot@wewolgyeder.app`(`.env.local`의 `SEED_ADMIN_*`, `admins` 등록됨). 스크립트는 이 계정으로 로그인해 쓴다.

| 스크립트 | 용도 |
|---|---|
| `node scripts/kopis-sync.mjs --days 31 [--firebase]` | KOPIS 오픈API로 동해문화예술관(시설코드 FC002118) 공연 일정 수집 → `seed/events.json` / Firestore `events` upsert. 회차 시간은 `scripts/kopis-time.mjs`가 요일·시각 안내문을 날짜별 회차로 전개. |
| `node scripts/seed-partners.mjs [--file seed/partners.json] [--firebase] [--replace]` | 제휴 가게·혜택 검증·업로드. `--replace`는 `ownerUid==='seed'` 샘플만 교체(사장님 등록분 보존). |
| `node scripts/seed-demo-events.mjs --date 2026-10-09` / `--remove` | 발표용 오늘·내일 데모 공연 투입/삭제. |

- 배포: `npm run build` → `npx firebase-tools deploy --only hosting` (규칙·인덱스 포함 시 `--only hosting,firestore`). CLI는 팀 Google 계정으로 로그인되어 있음.
- 현재 Firestore 상태(2026-10-08 밤): **실제 제휴 가게 11곳·혜택 12개**(인융대) + 샘플 가게 6곳·혜택 12개(모두 `ownerUid: seed`; 샘플만 지우려면 `seed-partners.mjs --file seed/partners.json --firebase --replace`), KOPIS 실제 공연 2회차(케니 지 10/20·10/21), 데모 공연 4회차(10/9·10/10), 테스트 중 생긴 익명 사용 기록 소수.

### 4.3 환경 변수(`.env.local`, git 제외)
`VITE_FIREBASE_*`(웹 앱 설정), `KOPIS_SERVICE_KEY`, `SEED_ADMIN_EMAIL/PASSWORD`. 없으면 앱은 **로컬 데모 모드**(localStorage + `seed/*.sample.json`)로 동작.

---

## 5. 기술 구조

- **스택**: Vite + React 18 + TypeScript(strict), react-router v6, vite-plugin-pwa(설치형·오프라인 셸), Firebase JS SDK v12(Firestore 오프라인 캐시 on, Auth, AI Logic `gemini-3.1-flash-lite`), tesseract.js(kor+eng, 폴백), jsqr(QR 디코드), qrcode(포스터), vitest + Testing Library. 상태관리·UI 라이브러리 없음.
- **디렉터리**: `src/app`(라우팅·세션 컨텍스트) · `src/screens`(화면) · `src/ui`(AppBar·TabBar·Chip·Button·Badge·TicketCard·Stepper·Sheet·Toast·Field·FixedCta·ClubPicker·icons) · `src/lib`(eligibility·geo·format·hash·redemption·qr·ocr/*) · `src/data`(DataSource 인터페이스 + firebase/local 어댑터, types, places, clubs) · `src/styles`(tokens·base·components·screens·ticket).
- **데이터 계층**: `DataSource` 인터페이스 하나에 구현 둘(firebase / local). 세션은 shops·coupons·events·내 redemptions를 한 번만 구독해 모든 화면이 공유.
- **판정**: `evaluateEligibility(user, coupon, now)` 순수 함수 — 대상(단과대·동아리·방문지), 요일, 자정 넘는 시간대(18:00–02:00), 기간, 자격 만료, 사용 제한.
- **디자인**: `design/DESIGN.md`(당근·토스 등 상용 앱 스크린샷 26장 실측 + Seed/TDS 공개값 기반 토큰·컴포넌트·화면 스펙), Pretendard, 포인트색 우이천 물빛 `#0B7D6B`, 다크 모드, 하드코딩 색 0건(토큰만).
- **품질**: 자동 테스트 29파일 110개(판정·시간대·지오펜스·OCR 파서·QR·규칙 모킹·화면 흐름·Firebase 어댑터 회귀), Prettier, 실제 Chrome 캡처 검토, 라이브 사이트 E2E(인증→사용→중복 차단→내 쿠폰), 실물 학생증·인터파크 티켓으로 OCR 검증.
- **코드 규모**: 소스 약 8,700줄(테스트 제외).

---

## 6. 조사·근거 자료
- `docs/domain.md`: 동해문화예술관(광운로 21, 37.6202512,127.0573526) · 아이스링크(18m 옆, 평일 15:00–16:50/주말 12:00–15:50) · 정문·후문·광운대역 좌표(역까지 549m) · 단과대 9개 · KOPIS/Firebase/tesseract 사실 · 샘플 티켓·영수증 출처.
- `src/data/clubs.ts`: 광운대 공식 홈페이지 중앙동아리 6분과 48개(2026-10-08).
- `docs/PITCH.md`: 심사 기준별 근거·예상 질문 답변·로드맵. `docs/DEMO.md`: 90초 데모 시나리오·전날 준비. `docs/qr-live.png`: 라이브 주소 QR.
- **실제 제휴 리스트(인공지능융합대학 학생회, 인스타 `kw_aiconv_alliance`)**: 프로필의 네이버 제휴지도에서 가게 34곳(주소·좌표 확정), 게시물 캡션에서 혜택이 확인된 11곳·혜택 12개를 `seed/partners.json`으로 만들어 **Firestore에 투입 완료**(audience: 학생 · 인공지능융합대학, 대부분 ~2026-12-31). 혜택 미확인 23곳은 `seed/partners.draft.json`에만 두고 미투입. 수집 표·출처·확인 필요 목록: `docs/partners-aiconv.md`.

---

## 7. 주요 결정 이력
| 날짜 | 결정 |
|---|---|
| 10-06 | 6하원칙 1장으로 단일 파일 데모(v0, `legacy/demo-v0.html`) |
| 10-08 | PWA + Firebase Spark + 당근·토스 톤 리서치 기반 디자인 · 동해 인증 2안(위치+티켓) · 우이마루 제외 · KOPIS 연동 · 학번 10자리 · 서비스명 **위월계더** |
| 10-08 | 티켓형 카드 UI · 서버 규칙 1회 제한 · 패스 카드 · 사장님 세부 대상·실시간 통계·PIN 해시 |
| 10-08 | 라이브 카메라 인식 시도 → 실기기 피드백으로 **촬영 방식으로 복귀**(코드는 `LIVE_SCAN_ENABLED=false`) |
| 10-08 | **Gemini 우선 + Tesseract 폴백**, 학생증 카드 윗부분만 전송, 민감정보 자동 삭제, 학번 중복 차단 |
| 10-08 | KLAS QR 캡처 전용, 중앙동아리 48개, 아이스링크 대여 품목 제외, 매장 QR 포스터 |
| 10-09 | 코드 인증(체험·스태프), 귀갓길·골든타임 제거, 영업시간 형식 통일, 회전된 학생증 인식·카드번호 마스킹, 방문객 인증 칩, 학생+방문객(OR) 대상 |

---

## 8. 알려진 한계와 로드맵
- 자격 인증 결과를 클라이언트가 기록한다(무료 플랜 제약). 실서비스: KLAS 모바일학생증 QR 서명 검증 또는 학사 API로 서버 검증.
- 데모 QR 서명 키가 클라이언트에 있다(데모 전용). PIN은 해시지만 공개 문서라 완전한 비밀은 아님.
- Gemini 무료 등급 분당 15회 — 초과 시 Tesseract 폴백. 아이스링크 영수증 실물 형식은 미확보라 파서는 일반 표기 기준.
- 로드맵: ① 실제 제휴 리스트 투입 → 학생회 공급 채널 ② 동해문화예술관·아이스링크(광운대 직영) 티켓 QR 협약으로 인증 생략 ③ 서버 검증 ④ 노원구 확장(노원패스) ⑤ 사용 데이터 기반 상권 리포트.

---

## 9. 내일(10-09) 체크리스트
1. 폰 2대에 https://kwhackton.web.app 홈 화면 추가, 인증 탭 한 번 열어 OCR 언어팩 캐시(폴백 대비).
2. 손님 폰: 더보기 → 버전 7번 탭 → **발표 모드** 체크. 티켓 사진 1장 갤러리에 준비.
3. 사장님 폰: 본인 이메일 계정 로그인, 가게 1개·혜택 1개 미리 등록(대시보드에 숫자 보이게), 매장 QR 포스터 한 번 열어 보기.
4. 데모 공연은 이미 Firestore에 있음(10/9 가을 음악회 19:30·청춘 연극제 15:00). 콘솔 작업 없음.
5. 발표 후 정리: `node scripts/seed-demo-events.mjs --remove`.
