# API 명세 초안

Supabase 클라이언트 + Edge Function 기준. 인증은 Supabase Auth(JWT), 권한은 RLS.

## 인증 · 소속
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | /auth/signup | 학교 이메일 또는 휴대폰으로 가입 |
| POST | /auth/verify-school | @kw.ac.kr 메일 인증 → users.school_verified = true |
| GET | /affiliations | 소속 목록 (총학·단과대·학부·동아리) |
| PUT | /me/affiliations | 내 소속 등록·수정 |

## 식당 · 할인
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /restaurants?lat&lng&filter | 근처 식당 목록. filter = mine(내 제휴) / timesale / stamp |
| GET | /restaurants/{id} | 상세 + 지금 적용되는 할인 (내 소속 기준) |
| GET | /me/deals | 내게 적용되는 제휴·타임세일 모아보기 |
| POST | /restaurants/{id}/deals | (사장님) 할인 등록. notify=true 면 즉시 푸시 |
| PATCH | /deals/{id} | (사장님) 할인 수정·종료 |

## 스탬프 · 방문
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | /visits/qr | QR 토큰 검증 후 방문 기록, 스탬프 +1 (같은 가게 하루 1회, 반경 50m 검증) |
| GET | /me/stamps | 내 스탬프 카드 목록 (가게별 count / goal / reward) |
| POST | /stamps/{restaurant_id}/redeem | 혜택 교환 (사장님 화면에서 승인) |
| PATCH | /restaurants/{id}/stamp-rule | (사장님) 몇 개에 무엇을 줄지 설정 |

## 리그 · 사장님
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /league?month | 소속별 월간 순위 |
| GET | /owner/dashboard | 오늘 방문, 타임세일 → 방문 전환, 알림 수신 학생 수, 시간대별 방문 |

## 푸시
- 타임세일 등록 시 반경 1km 이내 + 해당 소속 학생에게 Web Push 발송, notifications 에 기록.
- 알림 후 방문(visits)이 생기면 notifications.visited = true 로 갱신해 반응률을 계산.
