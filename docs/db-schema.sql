-- 월계 식당 패스 · DB 설계 (Supabase / PostgreSQL)
-- 중간발표 시점 설계안. 컬럼은 구현하면서 조정한다.

create extension if not exists "uuid-ossp";

-- 사용자: 학생·주민·사장님
create table users (
  id            uuid primary key default uuid_generate_v4(),   -- auth.users.id 와 동일
  role          text not null check (role in ('student','resident','owner')),
  name          text not null,
  email         text unique,
  school_verified boolean not null default false,             -- @kw.ac.kr 인증 여부
  phone_verified  boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 소속(제휴 주체): 총학생회, 단과대, 학부, 동아리, (추후) 아파트 단지·동호회
create table affiliations (
  id         serial primary key,
  name       text not null,                                    -- 예: 정보융합학부, 총학생회, BlackCat
  kind       text not null check (kind in ('council','college','department','club','community')),
  parent_id  int references affiliations(id)
);

-- 사용자-소속 (학생 한 명이 여러 소속을 가질 수 있음)
create table user_affiliations (
  user_id        uuid references users(id) on delete cascade,
  affiliation_id int  references affiliations(id) on delete cascade,
  verified       boolean not null default false,
  primary key (user_id, affiliation_id)
);

-- 식당
create table restaurants (
  id            serial primary key,
  owner_id      uuid references users(id),
  name          text not null,
  category      text,
  address       text,
  lat           double precision,
  lng           double precision,
  open_hours    jsonb,                                         -- {"mon":"11:00-21:00", ...}
  stamp_goal    int  not null default 10,                      -- 몇 개 모으면
  stamp_reward  text,                                          -- 무엇을 주는지 (사장님이 설정)
  source        text,                                          -- 'sbiz_api' 등 초기 적재 출처
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 할인: 타임세일 / 제휴 / 방학 특가 등. 사장님이 필요한 순간에 등록한다.
create table deals (
  id             serial primary key,
  restaurant_id  int references restaurants(id) on delete cascade,
  kind           text not null check (kind in ('timesale','affiliation','event')),
  title          text not null,                                -- 예: 마감 전 30%
  discount_pct   int  check (discount_pct between 0 and 100),
  affiliation_id int references affiliations(id),              -- 제휴 할인일 때 대상 소속
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  notify         boolean not null default true,                -- 등록 즉시 푸시 알림 여부
  created_by     uuid references users(id),
  created_at     timestamptz not null default now()
);

-- 방문 (QR 인증) : 스탬프·리그 집계의 원천
create table visits (
  id             bigserial primary key,
  user_id        uuid references users(id),
  restaurant_id  int  references restaurants(id),
  deal_id        int  references deals(id),                    -- 적용된 할인 (없을 수 있음)
  amount         int,                                          -- 결제 금액 (선택 입력)
  visited_at     timestamptz not null default now(),
  unique (user_id, restaurant_id, (visited_at::date))          -- 같은 가게 하루 1회 적립
);

-- 스탬프 현황 (가게별로 따로 센다)
create table stamps (
  user_id        uuid references users(id) on delete cascade,
  restaurant_id  int  references restaurants(id) on delete cascade,
  count          int  not null default 0,
  redeemed       int  not null default 0,                      -- 혜택 교환 횟수
  updated_at     timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- 기여도 리그: 월별 소속 단위 집계 (visits 에서 배치로 계산)
create table league_scores (
  month          date not null,                                -- 매월 1일
  affiliation_id int  references affiliations(id),
  visit_count    int  not null default 0,
  total_amount   bigint not null default 0,
  primary key (month, affiliation_id)
);

-- 푸시 알림 기록 (타임세일 반응률 계산용)
create table notifications (
  id         bigserial primary key,
  user_id    uuid references users(id),
  deal_id    int  references deals(id),
  sent_at    timestamptz not null default now(),
  opened_at  timestamptz,
  visited    boolean not null default false
);

-- RLS 메모
--  * users / user_affiliations : 본인 행만 읽기·수정
--  * restaurants / deals       : 모두 읽기, owner_id = auth.uid() 인 사장님만 쓰기
--  * visits / stamps           : 본인 행 읽기, 쓰기는 QR 검증 Edge Function 에서만
--  * league_scores             : 모두 읽기, 쓰기는 배치 함수만
