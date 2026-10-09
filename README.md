# 위월계더 — 월계1동 제휴 모음집

## 실행

Node.js 20 이상에서 `npm install`, `npm run dev`를 실행합니다. 테스트는 `npm test`, 배포 빌드는 `npm run build`입니다. Firebase 환경변수가 없으면 localStorage와 `seed/*.sample.json`을 사용하는 데모 모드로 즉시 실행됩니다.

## Firebase 설정

1. Firebase 콘솔에서 프로젝트와 웹 앱을 만듭니다.
2. Authentication에서 익명 로그인과 이메일/비밀번호 로그인을 켭니다.
3. Firestore를 서울 리전(`asia-northeast3`)에 만듭니다.
4. `.env.example`을 `.env.local`로 복사하고 웹 앱 설정값을 채웁니다.
5. `firestore.rules`와 `firestore.indexes.json`을 콘솔 또는 Firebase CLI로 배포합니다.
6. Firebase 콘솔의 **AI Logic → Gemini Developer API 사용 설정**을 켭니다(별도 키 입력은 필요 없습니다).
7. 시드를 넣을 운영 계정으로 한 번 로그인한 뒤 Authentication에서 uid를 확인하고, Firestore 콘솔에서 `admins/<내 uid>` 문서를 하나 만듭니다. 필드는 없어도 됩니다.

Spark 제약 때문에 자격 결과는 현재 클라이언트에서 기록합니다. 실제 서비스 전에는 서버 검증으로 옮겨야 합니다.

## 시드와 발표 모드

가장 단순한 운영을 위해 별도 Admin SDK 스크립트 대신 `/dev`의 **시드 투입** 버튼을 사용합니다. 로컬 모드에서는 localStorage에, Firebase 모드에서는 현재 로그인 계정이 `admins/<uid>`에 등록되어 있을 때 `events`, `shops`, `coupons`에 샘플 데이터를 기록합니다. 더보기 화면의 버전을 7번 누르면 `/dev`가 열립니다. 발표 모드는 위치 검사와 OCR 확인값의 날짜 제한을 우회하며, OCR이 실패해도 폼에 직접 입력해 진행할 수 있습니다.

손님 익명 계정에서 사장님 가입을 선택하면 Firebase `linkWithCredential`로 이메일 자격을 연결해 uid와 기존 사용 기록을 유지합니다. 이미 가입된 이메일이면 해당 이메일 계정으로 로그인합니다.

제휴처(`shops`, `coupons`)는 `scripts/seed-partners.mjs`로도 투입할 수 있습니다.

```sh
node scripts/seed-partners.mjs
node scripts/seed-partners.mjs --file seed/partners.sample.json --firebase
node scripts/seed-partners.mjs --firebase --replace
```

`--firebase` 없이 실행하면 파일 스키마(가게/혜택 필드 타입, 혜택의 `shopId`가 가게 목록에 있는지)만 검증하고 요약을 출력합니다. `--firebase`는 `.env.local`의 `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`로 로그인한 뒤 문서 id를 기준으로 upsert합니다. `--replace`를 더하면 업로드 전에 `shops`/`coupons`에서 `ownerUid === 'seed'`인 문서만 지웁니다(사장님이 직접 등록한 가게·혜택은 남습니다).

## 배포 (Firebase Hosting)

라이브 주소: https://kwhackton.web.app

처음 한 번 `npx firebase-tools login`(Firebase 프로젝트 소유 Google 계정). 이후 배포는 두 줄입니다.

```sh
npm run build
npx firebase-tools deploy --only hosting            # 앱만
npx firebase-tools deploy --only hosting,firestore  # 규칙·인덱스도 함께
```

호스팅 설정은 `firebase.json`(SPA 리라이트, `sw.js`·manifest no-cache, assets 1년 캐시), 기본 프로젝트는 `.firebaserc`에 있습니다.

발표용 데모 공연(오늘·내일 회차)은 운영 봇 계정으로 `node scripts/seed-demo-events.mjs --date 2026-10-09`(날짜 생략 시 오늘), 정리는 `--remove`로 넣고 뺍니다. 앱의 `/dev` 버튼은 `admins/<uid>`가 등록된 계정에서만 동작합니다.

## KOPIS 공연 일정 동기화

KOPIS 공연예술통합전산망의 [OpenAPI 안내](https://kopis.or.kr/por/cs/openapi/openApiList.do?menuId=MNU_00074)에서 활용 신청 후 서비스키를 발급받아 `.env.local`의 `KOPIS_SERVICE_KEY`에 넣습니다. 스크립트는 공식 개발가이드의 공연시설 목록·공연 목록·공연 상세 XML API를 사용하며, 동해문화예술관 시설코드는 `scripts/.kopis-venue.json`에 캐시합니다.

```sh
node scripts/kopis-sync.mjs
node scripts/kopis-sync.mjs --days 30 --out seed/events.json
node scripts/kopis-sync.mjs --days 30 --firebase
```

`--days`는 KOPIS 조회 제한에 맞춰 1~31입니다. `--firebase` 사용 시 `.env.local`에 `VITE_FIREBASE_*`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`를 채우고 해당 계정 uid의 `admins/<uid>` 문서를 Firebase 콘솔에서 먼저 생성합니다. 공연시간을 해석하지 못하면 시작 날짜 00:00 회차를 저장하고 경고를 출력합니다.

`legacy/demo-v0.html`에는 이전 단일 파일 데모가 보존되어 있습니다.
