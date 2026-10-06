# 도메인 조사 — 월계1동 제휴 모음집 (2026-10-08 조사)

SPEC.md 구현에 필요한 **사실**만 정리. 각 항목에 출처 URL과 확신도를 붙임.
확신도: **확실**(1차 출처·직접 확인) / **추정**(2차 출처 또는 단일 출처) / **미확인**(출처 못 찾음).
좌표는 WGS84 (lat, lng). OSM 데이터는 ODbL.

---

## A. 장소 (서울 노원구 월계동 일대)

### 1. 광운대학교 동해문화예술관

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 정식 명칭 | **광운대학교 동해문화예술관** (기획서의 '동해문화예술회관'은 통칭. playdb 등 일부 예매 DB가 '동해문화예술회관' 표기) | 확실 | http://dac.kw.ac.kr/main/main.php , http://www.playdb.co.kr/placedb/PlacedbInfo.asp?PlacecCD=1077 |
| 실재 여부 | 광운대 캠퍼스 안(광운로변)에 실재. 월계1동 소재 | 확실 | https://culture.seoul.go.kr/culture/culture/cultureSpace/view.do?facCode=101997&menuNo=200119 , OSM node 13805210124 |
| 주소 | 서울시 노원구 **광운로 21** (우편번호 01890). ※ 서울문화포털·스테이지픽은 '광운로 20'(대학 대표주소)으로 표기 | 확실(공식 오시는 길) | http://dac.kw.ac.kr/department_guide/map.php |
| 대표전화 | 02-940-8614 | 확실 | 위 공식 사이트 |
| 운영 주체 | 광운대학교(학교법인 직영 공연장, 대관 운영) | 확실 | http://dac.kw.ac.kr/guide/guide.php |
| 개관 | 1994년 | 추정 | 서울문화포털(위) |
| 홀 구성 | **대극장 2,005석**, **소극장 398석** (나무위키의 2,100/600석은 공식과 불일치 → 공식 채택) | 확실 | http://dac.kw.ac.kr/facility/theater.php |
| 위경도 | 건물 node **37.6202512, 127.0573526** (addr 광운로 21) / 대극장 건물 중심 37.6199226, 127.0574340 | 확실(OSM) | Nominatim 검색 `동해문화예술관`, Overpass way 804473752 |
| 공식 사이트 | http://dac.kw.ac.kr/main/main.php (인스타그램 https://www.instagram.com/donghaearts/) | 확실 | 공식 사이트 메뉴 |
| 공연 일정 페이지 | **공식 사이트에 공연 일정/캘린더 메뉴 없음**. 메뉴는 소개·오시는길·주차·대관신청·대관이용안내·안전교육·시설소개·좌석배치도·대피도·장비·갤러리뿐 | 확실(2026-10-08 메뉴 확인) | http://dac.kw.ac.kr/main/main.php |
| 기계판독 피드 | 공식 RSS/ICS/JSON **없음(미발견)**. 대안: ① 스테이지픽 공연장 페이지(HTML) ② KOPIS 공연예술통합전산망 OpenAPI(XML, 서비스키 필요, `prfplccd` 공연시설코드로 필터) — 동해문화예술관의 시설코드는 키 없이는 조회 불가 → **미확인** | 확실/미확인 | https://www.stagepick.co.kr/venues/detail/448 , http://www.kopis.or.kr/openApi/restful/pblprfr (키 없이 호출 시 `SERVICE KEY IS NOT REGISTERED ERROR` XML 반환 확인), https://data.go.kr/data/15097810/openapi.do |
| 예매처 | 인터파크(NOL) placeCode **02159** "광운대학교 동해문화예술관 대극장", YES24 IdTheater **2637**, playdb PlacecCD 1077. 공연별 판매처는 상이 | 확실(공연장 등록 확인) | https://mticket.interpark.com/Place/Detail?placeCode=02159 (→ tickets.interpark.com/gates/nol-redirect 로 301), https://m.ticket.yes24.com/Perf/Detail/TheaterInfo.aspx?Idperf=25469&IdTheater=2637 |
| 2026-10~12 일정(예시) | 10/20–21 케니 지 내한공연, 11/14 2026 ERIC 1st Fanmeeting '꽃보다 손영재' (시간·예매처 미기재) | 추정(스테이지픽 목록) | https://www.stagepick.co.kr/venues/detail/448 |
| 교통 | 1호선 광운대역 도보 6분, 6호선 석계역 1번출구 도보 10분. 버스 '광운대학교' 정류장 정문 앞(261, 173, 1017, 1130, 1137, 1140, 노원09) | 확실 | http://dac.kw.ac.kr/department_guide/map.php |
| 대관 참고 | 기본 대관 09:00–18:00, 안전상 스탠딩 공연 금지 | 확실 | http://dac.kw.ac.kr/guide/guide.php |

### 2. 광운대학교 아이스링크

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 정식 명칭 | **광운대학교 아이스링크** (OSM 명칭 '광운대학교 아이스링크장') | 확실 | https://icerink.kw.ac.kr/main/main.php |
| 주소 | (01899) 서울특별시 노원구 **월계1동 468-5** / 도로명 **광운로 21** | 확실 | 공식 사이트 푸터, https://www.ktriptips.com/kor/leisure/131607 |
| 전화 | 02-909-3114 | 확실 | 공식 사이트 |
| 운영 주체 | 광운대학교 | 확실 | 공식 사이트 |
| 연혁 | 1997 완공, 1998 일반 개장(국내 대학 최초 국제규격), 2011 리모델링 | 추정 | https://namu.wiki/w/%EA%B4%91%EC%9A%B4%EB%8C%80%ED%95%99%EA%B5%90/%EC%BA%A0%ED%8D%BC%EC%8A%A4%20%EB%B0%8F%20%EC%8B%9C%EC%84%A4 |
| 위경도 | **37.6203081, 127.0571642** (OSM way 804473754, leisure=ice_rink). 동해문화예술관 node와 18 m — 같은 건물군(나무위키: 동해문화예술관 지하 2층) | 확실(OSM)/추정(층 정보) | Overpass, 나무위키(위) |
| 공식 사이트 | https://icerink.kw.ac.kr/main/main.php (루트 http://icerink.kw.ac.kr 는 빈 응답) — 하위: 일반개장안내 `/college/open.php`, 강습 `/lesson/lesson.php`, 공지 `/community/notice.php` | 확실 | 직접 확인 |
| 일반개장 시간 | **평일 15:00–16:50 / 토·일 12:00–15:50**. 일반개장 시간에 단체수업·강습 동시 진행. 학교 단체강습 일정에 따라 변동 가능 | 확실(공식 공지 2024-09-08) | https://icerink.kw.ac.kr/community/notice.php?admin_mode=read&no=126 , https://icerink.kw.ac.kr/college/open.php |
| 요금(2023-11-01 적용) | 입장료+대여료: **대인 7,000+4,000=11,000** / 청소년 6,500+4,000=10,500 / 어린이 6,000+4,000=10,000 / 본교생(본인) 3,000+2,000=5,000 / 일반단체 25인↑ 8,000(대여료 포함). ※ ktriptips·블로그의 6,000/5,500/5,000원은 구 요금 | 확실 | https://icerink.kw.ac.kr/college/open.php |
| 휴장 | 설 연휴 휴장 공지 있음(연중무휴 아님) | 확실 | https://icerink.kw.ac.kr/community/notice.php?admin_mode=read&no=180 |
| 현장 발권 방식 | 매표소/키오스크/결제수단/티켓·영수증 형태 **공개 정보 없음** → **미확인**. 영수증·티켓 사진 URL 없음 | 미확인 | — |

### 3. 노원 우이마루

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 무엇인가 | **노원구가 조성·운영하는 우이천변 수변 복합문화공간**(1층 수변카페+라면조리실, 계단식 북스텝(도서·LP), 실내 음악분수, 테라스, 옥상 정원/전망대). 서울시 '서울물빛나루' 19호. 두물마루·당현마루에 이은 '노원 수변카페' 시리즈 | 확실 | https://mediahub.seoul.go.kr/archives/2017922 , https://mediahub.seoul.go.kr/archives/2017650 , https://www.heraldk.com/article/2026033113561641775 |
| 명칭 | '노원 우이마루' / '노원우이마루' | 확실 | 위 |
| 주소 | 지번 **노원구 월계동 876-3**(벌리교 인근). 도로명 **우이천로 51**(식신·다이닝코드). ※ 일부 기사 '월계로 404' 표기 → 상충 | 확실(지번)/추정(도로명) | mediahub 2017922, https://www.siksinhot.com/P/1907083 , https://www.diningcode.com/profile.php?rid=8jupXQrv6h7S , https://www.telltrip.com/domestic-travel/nowon-uimaru-uicheon-waterfront-culture-space-launch/ |
| 위경도 | **37.6282, 127.046528** (식신 place 데이터) — OSM에는 아직 미등록. Nominatim 역지오코딩 결과 행정동 **월계2동** → **월계1동 밖**(월계1동 중심에서 약 1.1 km) | 추정 | 식신 페이지 소스, Nominatim reverse |
| 개장 | 2026-03-31 준공·임시운영(외부시설만, 10:00–18:00, ~04-09), **2026-04-10 정식 운영** | 확실 | heraldk(위), https://v.daum.net/v/yuZyFOMVWK |
| 운영 시간 | **하절기(3~11월) 09:00–21:00 / 동절기(12~2월) 10:00–19:00**, **매주 월요일·명절 당일 휴무**. 식신: 라스트오더 20:30 | 확실(기사)/추정(라스트오더) | heraldk, daum(위), 식신 |
| 카페 메뉴 | 아메리카노 3,000 / 에스프레소 3,000 / 카페라떼 3,500 / 콜드브루 4,000 / 딸기에이드 4,000 / 매실차 4,000. 시그니처 원두, 보틀 음료, 생과일주스, 군고구마 | 추정(다이닝코드·기사) | 다이닝코드(위), heraldk |
| 한강라면 | 인기 라면 10종, **무인자판기 + 셀프 조리기** 방식(가격 미기재). 안내판에 신라면·진라면·짜파게티 | 확실(방식)/미확인(가격) | mediahub 2017922 |
| 할인 | 노원구민 10% 할인 | 추정 | mediahub 2017922(검색 요약) |
| 전화 | 070-4159-4853 (기사) / 0507-1319-4853 (다이닝코드 안심번호) | 추정 | 위 |
| 공식 안내 URL | 노원구청 자체 안내 페이지 **미확인**. 공공 기사 URL로 대체: https://mediahub.seoul.go.kr/archives/2017922 | 미확인 | — |

### 4. 기준 좌표·경계·거리

| 지점 | lat, lng | 확신도 | 근거 |
|---|---|---|---|
| 광운대 정문 | **37.6192755, 127.0582184** | 추정 | OSM node 7524714644 `entrance=gate`(이름 없음). 광운로변, '동해문화예술관앞' 따릉이(37.619381,127.0578537)·'광운대학교' 정류장(37.6197,127.0581) 인근. 나무위키: 신 정문은 중앙도서관 옆 시계탑 |
| 광운대 후문(동문) | **37.6202386, 127.0610944** | 추정 | OSM node 7524714651 `entrance=gate`. 석계로13길 쪽, '세븐일레븐 광운대후문점'(37.621248,127.061123)·'후문식당'(37.620183,127.061282) 인근. 나무위키: 동문(후문)이 광운대역·석계역에 가장 가까움 |
| 광운대역 (1호선·경춘선) | **37.6236987, 127.0618193** | 확실 | OSM railway=station node 355172776; https://en.wikipedia.org/wiki/Kwangwoon_University_station |
| 우이천 월계1동 구간 대표점 | **37.6175875, 127.0574992** (하천선 중간점) | 추정 | Overpass `waterway name=우이천` 월계1동 bbox 내 27점: 북단 37.6236048,127.0506916 → 남단 37.6143063,127.0648401(중랑천 합류부). 우이천이 월계1동의 남서 경계를 이룸 |
| 월계1동 중심 | 37.6227791, 127.0571860 | 확실 | Nominatim relation 3882987 |
| 월계1동 bbox | lat **37.6143149 ~ 37.6301578**, lng **127.0499886 ~ 127.0658002** | 확실 | 같은 relation |
| 월계1동 단순화 폴리곤 ([lng,lat], threshold 0.0002) | `[[127.0499886,37.6244069],[127.0533199,37.620941],[127.0574409,37.6176467],[127.0606714,37.6157709],[127.0611197,37.6148747],[127.0625125,37.6143149],[127.0658002,37.614951],[127.0624555,37.6237473],[127.0611333,37.6254245],[127.0590158,37.6301578],[127.0499886,37.6244069]]` | 확실(단순화) | https://nominatim.openstreetmap.org/lookup?osm_ids=R3882987&format=jsonv2&polygon_geojson=1&polygon_threshold=0.0002 |

하버사인 거리(m):

| 지점 A | 지점 B | 거리(m) |
|---|---|---|
| 동해문화예술관 | 아이스링크 | 18 |
| 동해문화예술관 | 광운대 정문 | 133 |
| 동해문화예술관 | 광운대 후문 | 330 |
| 동해문화예술관 | 광운대역 | 549 |
| 동해문화예술관 | 우이천 대표점 | 296 |
| 동해문화예술관 | 우이마루 | 1,300 |
| 광운대 정문 | 광운대 후문 | 275 |
| 광운대 정문 | 광운대역 | 585 |
| 광운대 후문 | 광운대역 | 390 |
| 광운대역 | 우이천 대표점 | 779 |
| 광운대역 | 우이마루 | 1,437 |
| 우이마루 | 광운대 정문 | 1,430 |
| 우이마루 | 우이천 대표점 | 1,525 |
| 월계1동 중심 | 광운대역 | 421 |
| 월계1동 중심 | 우이마루 | 1,116 |

구현 메모: 동해문화예술관 '반경 500 m' 검사는 광운대역(549 m)을 **아슬아슬하게 벗어남** — 역에서 인증 시도하면 실패. 우이마루는 월계1동 상권에서 1.1~1.5 km 떨어져 있어 '거리순 정렬' 기준점으로 쓸 때 참고.

---

## B. 광운대학교

### 5. 단과대학·학번·모바일 학생증

**단과대학(2026-10 현재, 공식 메인 메뉴 기준 9개)** — 확실
https://www.kw.ac.kr/ko/ (메뉴 '대학' → `/ko/univ/college_view.jsp?hpage=college_N`)

1. 전자정보공과대학
2. 인공지능융합대학
3. 공과대학
4. 자연과학대학
5. 인문사회과학대학
6. 정책법학대학
7. 경영대학
8. 참빛인재대학 (2024 신설, 재직자특별전형 전용)
9. 인제니움대학 (자율전공학부)

소속 학부·학과(추정, 나무위키 https://namu.wiki/w/%EA%B4%91%EC%9A%B4%EB%8C%80%ED%95%99%EA%B5%90/%ED%95%99%EB%B6%80): 전자정보공과대 — 전자공학과·전자통신공학과·전자융합공학과·전기공학과·전자재료공학과·반도체시스템공학부 / 인공지능융합대 — 컴퓨터정보공학부·소프트웨어학부·정보융합학부·로봇학부·지능형로봇학과 / 공과대 — 건축학과·건축공학과·화학공학과·환경공학과 / 자연과학대 — 수학과·전자바이오물리학과·화학과·스포츠융합과학과·정보콘텐츠학과(야) / 인문사회과학대 — 국어국문학과·영어산업학과·미디어커뮤니케이션학부·산업심리학과·동북아문화산업학부 / 정책법학대 — 행정학과·법학부·국제학부·자산관리학과 / 경영대 — 경영학부·국제통상학부 / 참빛인재대 — 금융부동산법무학과·게임콘텐츠학과·스마트전기전자학과·스포츠상담재활학과 / 인제니움대 — 자율전공학부.

**학번 체계** — **미확인**
- 자릿수·구조를 설명하는 공개 문서를 찾지 못함. 공식 안내는 "KLAS 학번조회(이름+생년월일)" 절차만 제공. https://compro.kw.ac.kr/community/notice.php?BoardMode=view&UID=1754&CurrentPage=1
- 단서 ①: 대학원 2025-1 임시학번은 "**12025**로 시작" (확실) https://grad.kw.ac.kr/notice/news.php?BoardMode=view&UID=70733
- 단서 ②: KLAS 초기 비밀번호가 "학번의 뒷자리"로 설정됨(확실, 위 compro 공지) → 학번은 순수 숫자열로 추정.
- SPEC §3.2의 "학번(숫자 10자리)" 가정은 **검증되지 않음**. OCR 정규식은 `20\d{8}` 고정 대신 **8~10자리 숫자열**을 후보로 뽑고 사용자 확인 폼에서 수정하게 두는 것을 권장.

**모바일 학생증 / KLAS QR** — 존재는 확실, 규격은 미확인
- 공식: "KLAS 로그인 → '모바일학생증(QR)' 선택 → 학생증 신청 → **하나원큐 앱**"으로 발급. 용도: 중앙도서관 출입, 모바일학생증 연동 발급, 쿠폰, 디지털배지. 실물은 하나은행 체크카드형. https://www.kw.ac.kr/ko/life/student_id.jsp (확실)
- KLAS 앱(2020-08 출시)에 **QR코드 출석** 기능(교수가 생성한 QR 스캔) 있음. http://kwnews.kw.ac.kr/news/articleView.html?idxno=10112 (확실)
- 비공식 앱 KLAS+ 에 "학생증 및 중앙도서관 이용증 QR 조회" 기능 존재 → KLAS에 학생증 QR API가 있음을 시사. https://github.com/IceCream0910/kw-klas-plus (추정)
- QR **페이로드 규격·갱신주기·서명 방식은 공개 문서 없음** → SPEC의 데모 규격 `KW1|…` 유지가 타당.
- 학생증 카드에 인쇄되는 항목(이름/학번/학과/사진) 공식 명시 없음 → 미확인.

---

## C. 데이터

### 6. "월계1동 폐업률 128.1%" 출처 — **미확인**
- 웹 검색(표준·확장)에서 해당 수치를 담은 공개 문서를 찾지 못함. 팀 기획서 내부 계산값일 가능성 큼. 100%를 넘는 '폐업률'은 통상 **폐업 점포수 ÷ 개업 점포수**(개·폐업 비율)로 해석됨(추정).
- 재현 가능한 1차 출처 후보(확실히 존재):
  - 서울시 상권분석서비스(우리마을가게) https://golmok.seoul.go.kr/ — 상권신호등(폐업신고율·3년 내 폐업신고율·점포증감율), 행정동·업종별 점포수/개업수/폐업수 통계 https://golmok.seoul.go.kr/signal.do , https://golmok.seoul.go.kr/stateDistrict.do
  - 서울 열린데이터광장 '서울시 상권분석서비스(…)' 시리즈(서울신용보증재단 제공, 공공누리 1유형, Open API 있음) 예: https://data.seoul.go.kr/dataList/OA-15576/S/1/datasetView.do (상권변화지표-상권), https://data.seoul.go.kr/dataList/OA-15573/S/1/datasetView.do (추정매출-상권배후지). ※ 2026-07-03부터 2021년 이후 데이터만 제공.
  - 공공데이터포털 소상공인 경영활동 통계(운영·개업·폐업 점포수, 행정동) https://www.data.go.kr/biz/dcat/metadata/15147239.do
- 발표 문구는 "문 닫는 가게가 여는 가게보다 많다(개·폐업 비율 128.1%, 팀 산출)"처럼 **출처를 팀 산출로 명시**하는 것을 권장.

---

## D. 기술 (2026-10-08 기준 npm 레지스트리 직접 확인)

### 7. tesseract.js

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 최신 안정 버전 | **7.0.0** (2025-12-15). 6.0.1 (2025-04-07), 5.1.1 (2024-08-24). v7은 Node ≥16 | 확실 | https://registry.npmjs.org/tesseract.js , https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/README.md |
| createWorker 시그니처 | `createWorker(langs = 'eng', oem = OEM.LSTM_ONLY, options = {}, config = {}) → Promise<Worker>`; `langs`는 `'kor+eng'` 문자열 또는 `['kor','eng']`. options: `corePath, langPath, workerPath, cachePath, cacheMethod('write'|'readOnly'|'refresh'|'none'), gzip(true), logger(m=>…), errorHandler, legacyLang(false), legacyCore(false)`. Worker: `recognize(image, options?, output?, jobId?)`, `setParameters(params)`, `reinitialize(langs, oem, config)`, `terminate()`. `setParameters`로 oem 변경 불가 | 확실 | https://github.com/naptha/tesseract.js/blob/master/docs/api.md , `src/index.d.ts`, `src/createWorker.js` (v7) |
| 기본 langPath | **langPath 미지정 시 jsDelivr 사용**: lstmOnly(기본) → `https://cdn.jsdelivr.net/npm/@tesseract.js-data/{lang}/4.0.0_best_int`, legacy → `…/{lang}/4.0.0` (v7 `src/worker-script/index.js` L127–130). 문서상 구 기본값 `https://tessdata.projectnaptha.com/4.0.0`도 여전히 동작 | 확실 | https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/src/worker-script/index.js , https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md |
| `kor` 제공 여부 | **제공됨**. `@tesseract.js-data/kor/4.0.0_best_int/kor.traineddata.gz` = **1,572,336 B**, `/4.0.0/` = 6,951,378 B. `eng` best_int = 2,952,873 B. (projectnaptha: kor 4.0.0 6.95 MB / _fast 1.11 MB / _best 11.57 MB) | 확실(HEAD/GET 실측) | jsDelivr, https://tessdata.projectnaptha.com/4.0.0_fast/kor.traineddata.gz |
| 번들 크기(실측) | `dist/tesseract.min.js` 62,961 B · `dist/worker.min.js` 111,307 B · `tesseract.js-core@7.0.0/tesseract-core-simd-lstm.wasm.js` 3,899,472 B · `tesseract-core-simd-lstm.wasm` 2,857,601 B. 첫 OCR 전 다운로드 합계 ≈ **core 3~4 MB + kor 1.6 MB + eng 3.0 MB** → 진행률 UI 필수 | 확실 | jsDelivr 응답 크기 |
| 기본 workerPath | `https://cdn.jsdelivr.net/npm/tesseract.js@v{version}/dist/worker.min.js` | 확실 | `src/worker/browser/defaultOptions.js` |
| 한국어 영수증 실사용 보고 | 한글은 영문 대비 인식률 낮음(학습 데이터 부족·복잡 구조) — 학술 보고. "복잡한 영수증·인보이스는 딥러닝 OCR(PaddleOCR 등) 권장"(국내 입문서). 2018 tesseract-ocr 그룹: kor traineddata는 "비즈니스 용도엔 부족". 노이즈·기울기·복잡 배경에서 급락. → 기획대로 **OCR 결과를 폼에 채우고 사용자가 수정**하는 흐름이 필수 | 추정 | https://koreascience.kr/article/CFKO201821464987120.pdf , https://wikidocs.net/233317 (직접 열람 실패, 검색 요약) , https://groups.google.com/g/tesseract-ocr/c/gSmIP1XbdWY |
| 전처리 권장(공식 tessdoc) | 300 DPI 상당으로 리스케일, Otsu 내부 이진화(5.x: Adaptive Otsu/Sauvola), 기울기 보정, 10 px 흰 여백, **어두운 글자+밝은 배경**(4.x는 반전 이미지 비권장), psm **4**(단일 열 가변 크기 — 영수증) 또는 **11**(희소 텍스트 — 티켓), 사전 끄기(`load_system_dawg`,`load_freq_dawg`=false) | 확실 | https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html |
| 전처리(브라우저 캔버스 예) | grayscale `0.2126R+0.7152G+0.0722B`, 임계값 `level*255`(0.4~0.5), blur r=1 → 복잡 배경에서 "거의 완벽"으로 개선 보고 | 추정 | https://dev.to/mathewthe2/using-javascript-to-preprocess-images-for-ocr-1jc |

SPEC §5의 "긴 변 1600 px + 그레이스케일"은 위 권장과 부합. 추가로 임계 이진화(0.45 전후)와 psm 4/11 선택을 옵션으로 두는 것이 안전.

### 8. Firebase

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| JS SDK 최신 | **firebase 13.0.0** (2026-10-07). 12.10.0 (2026-02-27). v13 breaking은 주로 AI Logic 모듈; Firestore `UpdateData<T>` 타입 완화. Auth/Firestore API 자체는 v9+ modular 그대로 | 확실 | https://registry.npmjs.org/firebase , https://firebase.google.com/support/release-notes/js |
| Cloud Storage on Spark | **2026-02-03부터 Spark 사용 불가, Blaze 필수**(기본 버킷 포함; 402 "no longer supports … Spark" / 403 `UserProjectAccountProblem` / `storage/unauthorized`). ※ 가격 페이지 일부 표는 아직 Spark 할당량을 표기하나 FAQ가 우선 | 확실 | https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024 |
| Cloud Functions on Spark | **불가**(Blaze 필요) | 확실 | https://firebase.google.com/pricing |
| Firestore 무료 한도(Spark, Standard) | 저장 **1 GiB**, 읽기 **50K/일**, 쓰기 **20K/일**, 삭제 **20K/일**, 네트워크 송신 **10 GiB/월** | 확실 | https://firebase.google.com/pricing |
| Authentication | 익명·이메일/비밀번호 등 포함(무료). Phone Auth는 Spark 미제공 | 확실 | https://firebase.google.com/pricing , https://firebase.google.com/docs/auth/web/anonymous-auth |
| Hosting(Spark) | 저장 10 GB, 전송 360 MB/일 | 확실 | https://firebase.google.com/pricing |

→ SPEC §2 "Storage·Functions 금지, 사진은 base64로 Firestore 문서에"는 2026 현재 정책과 일치.

### 9. vite-plugin-pwa · iOS Safari · QR

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| vite-plugin-pwa 최신 | **2.0.0** (2026-10-03). peer `vite ^3.1.0 || ^4 || ^5 || ^6 || ^7 || ^8`, `workbox-build/-window ^7.4.1`. 1.2.0은 2025-11-27 | 확실 | https://registry.npmjs.org/vite-plugin-pwa |
| 주변 버전 | Vite **8.3.3** (node ^20.19 || ≥22.12) · @vitejs/plugin-react 6.1.2 (peer vite ^8) · React 최신 19.3.0, **React 18 최신 18.3.1** · react-router v6 최신 **6.30.6**(최신 메이저 8.4.0) · vitest 5.0.3 · TypeScript 7.0.2 | 확실 | registry.npmjs.org 각 패키지 |
| iOS Safari `<input capture>` | 지원(iOS 6 ~ 27.x). 데스크톱 브라우저는 무시 | 확실 | https://caniuse.com/html-media-capture |
| iOS getUserMedia(PWA) | iOS 13+ 지원. 홈화면(standalone)에서 안 되던 버그는 **iOS 13.4에서 수정**(WebKit #185448 RESOLVED FIXED) | 확실 | https://bugs.webkit.org/show_bug.cgi?id=185448 , https://firt.dev/notes/pwa-ios/ |
| iOS Geolocation | 지원(iOS 2.0~), standalone 포함 | 확실 | https://firt.dev/notes/pwa-ios/ |
| BarcodeDetector | **iOS Safari 17.0 ~ 27.2 '기본 비활성'**(플래그 뒤), 16.7 이하 미지원. Chrome Android·Samsung Internet 13+ 지원, Firefox 미지원, 데스크톱 Chrome 부분 지원. 전역 사용률 ≈ 76%(부분 포함) → **iOS에는 폴백 필수** | 확실 | https://caniuse.com/mdn-api_barcodedetector |
| jsQR | 1.4.0 (**2021-04-24 이후 릴리스 없음**) — 동작은 하나 유지보수 정체 | 확실 | https://registry.npmjs.org/jsqr |
| jsQR 대안 | `barcode-detector` **3.2.2** (2026-08-16, BarcodeDetector 표준 API 폴리필, zxing-wasm 기반) · `zxing-wasm` 3.1.5 (2026-10-06) · `@zxing/browser` 0.2.1 (2026-07-06) | 확실 | registry.npmjs.org |
| EU 참고 | iOS 17.4부터 EU 지역은 홈화면 PWA가 브라우저 탭으로 열림(한국 비해당) | 추정 | https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide |

### 10. Nominatim(OSM) 공개 API 정책

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 속도 | **최대 1 req/s**. 대량(하루 이상 반복) 스크립트는 4 req/min, 단일 스레드 | 확실 | https://operations.osmfoundation.org/policies/nominatim/ |
| 식별 | **HTTP Referer 또는 User-Agent로 앱 식별 필수**(라이브러리 기본 UA 불가). 대량 요청 시 `email=` 파라미터 권장 | 확실 | 위 정책, https://nominatim.org/release-docs/latest/api/Search/ |
| 금지 | 자동완성(타이핑마다 호출) 금지, 체계적 대량 질의·스크래핑·재판매 금지. **결과는 반드시 자체 캐시**(동일 질의 반복 시 차단) | 확실 | 위 정책 |
| 브라우저 CORS | 응답 헤더 `access-control-allow-origin: *` **직접 확인(2026-10-08)** → 브라우저 fetch 가능. 브라우저는 UA를 바꿀 수 없으므로 **Referer(배포 도메인)가 식별자** 역할 → `Referrer-Policy`로 Referer를 숨기지 말 것 | 확실 | `curl -I https://nominatim.openstreetmap.org/search?...` |
| 유용 파라미터 | `format=jsonv2`, `countrycodes=kr`, `viewbox=127.04,37.635,127.07,37.61&bounded=1`(월계동 한정), `limit`(기본 10, 최대 40), `accept-language=ko`, `addressdetails=1` | 확실 | Search API 문서(위) |
| 품질 메모 | 한국 지번·상세주소 커버리지 낮음(예: '우이천로 51', '광운로 20' 건물 미매칭; '월계로 404' 도로만 매칭). SPEC의 **실패 시 구역 프리셋 좌표 폴백**이 실제로 자주 쓰일 것 | 확실(이번 조사 질의 결과) | 위 질의 |

### 11. Pretendard 폰트 CDN

| 항목 | 내용 | 확신도 | 출처 |
|---|---|---|---|
| 최신 버전 | **1.3.9** (npm 2023-11-05) | 확실 | https://registry.npmjs.org/pretendard |
| jsDelivr(npm) | `https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css` (200, CORS * 확인) / `.min.css` | 확실 | 직접 HEAD |
| jsDelivr(gh) | `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css` | 확실 | https://github.com/orioncactus/pretendard |
| cdnjs | `https://cdnjs.cloudflare.com/ajax/libs/pretendard/1.3.9/variable/pretendardvariable-dynamic-subset.min.css` | 확실 | 위 README |
| font-family | `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif` | 확실 | 위 README |

---

## E. OCR 테스트용 샘플

내려받은 파일: `docs/samples/` (출처·라이선스는 `docs/samples/SOURCES.md`).

| 파일 | 종류 | 핵심 필드(육안 확인) |
|---|---|---|
| `ticket_lovelyz_concert.jpg` | **인터파크 실물 티켓**(2017, 콘서트) | 공연명 / `일시: 2017년 1월 14일(토) 5:00 p.m` / `장소: 블루스퀘어 삼성카드홀` / `예약번호: T0760797890(1/1)` / `예매자: **0729(Web-김경민 님)` / `전화번호: 010-****-9557` / `스탠딩 객석1층 B구역 입장번호 30번` / `금액: 일반(99,000원)` / `결제수단: 무통장 입금` / `판매일자: 2016/12/07` / `주최,주관` / `문의: 인터파크 1544-1555` |
| `receipt_cafe_ediya_2020.jpg` | **카페 영수증**(이디야커피, 카드) | 상호·사업자번호·주소·전화 / `일자: 2020-08-04 12:35:05` / 품명·단가·수량·금액 / 공급가액·부가세 / 청구금액 / `신용카드:` / 카드종류·카드번호(마스킹)·할부·승인번호·가맹점NO / 멤버십 적립 / 바코드 |
| `receipt_mart_hanaro_2020_rotated.jpg` | 마트 영수증, **90° 회전 촬영** | 회전 보정·EXIF orientation 테스트용 |
| `receipt_supermarket_seoul_2013.jpg` | 마트 영수증(현금, 구형 서체) | 상호/대표/사업자NO/주소/문의 / 상품명·수량·단가·금액 / 과세액·부가세·면세액 / `합계 11,400` / `현금 50,000` / `거스름 38,600` / `03-20130713-000386 16:33` |
| `receipt_hf_korean_1005_1.jpg` | 백화점 입점매장 영수증(2025, 카드, QR 포함) | `구매 2025-10-03 16:47 거래번호:1389-0015` / 상품명·수량·금액 / 소계·과세물품가액·부가세 / 합계 / 카드결제액·카드번호 마스킹·승인번호 / 바코드·주차정산 QR |
| `receipt_hf_korean_1005_7.jpg` | 백화점 식품 영수증(2025, 카드) | `2025-10-05 18:20 NO: 5932-0246` / 상품코드 13자리·수량·금액 / 면세·과세·부가세 / 합계 / 카드청구액·승인번호 / 마일리지 |

**구하지 못한 것**: 아이스링크(광운대) 영수증·티켓 사진(공개 이미지 없음), YES24 실물 티켓, 인터파크/YES24 **모바일 티켓** 캡처(앱 내 화면이라 공개 이미지 없음). 아래 텍스트 포맷으로 대체.

### 티켓/영수증 인쇄 필드·표기 형식 (파서 설계용)

**공연 티켓(인터파크 실물, 위 샘플 기준 — 확실 1건 / 일반화는 추정)**
- 라벨: `일시:`, `장소:`, `예약번호:`, `예매자:`, `전화번호:`, `금액:`, `결제수단:`, `판매일자:`, `주최,주관:`, `문의:`
- 예매(예약)번호: `T` + 숫자 10자리 + `(n/N)`(N매 중 n번째) — 예 `T0760797890(1/1)`. 정규식 후보 `T\d{10}` / 느슨하게 `[A-Z]?\d{8,12}`
- 일시 표기 변형: `2017년 1월 14일(토) 5:00 p.m` / `2026.10.08 (목) 19:30` / `2026-10-08 19:30` / `2026/10/08`. 요일은 `(월|화|수|목|금|토|일)`; 12시간제(`p.m`/`오후`)와 24시간제 혼재
- 좌석: `객석1층 B구역 입장번호 30번` / `1층 A구역 12열 7번` 형태. 인원은 실물에선 `(1/1)`의 분모, 모바일/예매확인 화면에선 `성인 2매`·`2매` 형태(추정)
- 금액: `일반(99,000원)`, `R석 110,000원` — 천단위 콤마+`원`

**아이스링크 현장 영수증(추정 — 요금표 기반, 실물 미확인)**
- `입장료 대인 2 7,000 14,000` / `스케이트대여 대인 2 4,000 8,000` / `합계 22,000` 식의 품목·수량·단가·금액 4열. 인원 = 입장료 행의 수량 합. 날짜 `YYYY-MM-DD HH:MM`

**카페·일반 영수증(샘플 5종 공통 — 확실)**
- 헤더: 상호(매장명/지점), `사업자번호 123-45-67890`(3-2-5), 대표, 주소, 전화(`02-…`, `033-…`, `1588-…`)
- 일시: `일자: 2020-08-04 12:35:05` / `구매 2025-10-03 16:47` / `2025-10-05 18:20` / `03-20130713-000386 16:33`(구형)
- 품목표 헤더: `품명|상품명  단가  수량  금액`(열 순서는 매장별 상이)
- 합계 블록: `공급가액`·`부가세`(또는 `과세물품가액`·`면세`)·`합계`·`청구금액`·`받을금액`·`거스름돈`
- 결제: `신용카드`/`카드결제액`/`현금`, `카드번호 5272-89**-****-****`, `승인번호 30020479`, `할부개월 일시불`, `가맹점NO`
- 우이마루 매칭용 키: 상호에 `우이마루`(또는 `노원우이마루`), 품목에 `아메리카노`·`라면` 등; 금액은 3,000~4,000원대 → 실제 영수증 양식은 **미확인**(개장 2026-04, 공개 영수증 사진 없음)
