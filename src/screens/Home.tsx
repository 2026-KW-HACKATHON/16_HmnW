import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session';
import type { Coupon, Shop, UserDoc, Venue } from '../data/types';
import { AREA_POINTS, VENUE_POINTS } from '../data/places';
import { evaluateEligibility } from '../lib/eligibility';
import { goldenWindow, GOLDEN_TIME_MINUTES } from '../lib/goldenTime';
import {
  distanceMeters,
  distanceToPolylineMeters,
  formatDistance,
  progressAlongPolylineMeters,
} from '../lib/geo';
import { AppBar } from '../ui/AppBar';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { ClockIcon, MapPinIcon, ShieldIcon } from '../ui/icons';
import { TicketCard, TicketSkeleton } from '../ui/ListItem';
import { areaName } from './shared';

const categories = ['전체', '식당', '카페', '술집', '미용실', '당구장', '볼링장'];
const HOMEWARD_ROUTE = [VENUE_POINTS.donghae, AREA_POINTS.back_gate, AREA_POINTS.station];
const HOMEWARD_STORAGE_KEY = 'nearby-homeward-only';

type CouponRow = { coupon: Coupon; shop: Shop };

const pad = (value: number) => String(value).padStart(2, '0');
const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const countdown = (milliseconds: number) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
};

function lockedReason(user: UserDoc, coupon: Coupon, reason: string, now: Date) {
  if (coupon.audience.type === 'student') {
    return user.student && new Date(user.student.expiresAt) < now
      ? '학생 인증 만료'
      : '학생 인증 필요';
  }
  if (coupon.audience.type === 'visitor') return '방문객 인증 필요(동해문화예술관·아이스링크)';
  if (reason.includes('인증')) return '조건 확인 필요';
  return '조건 확인 필요';
}

function readHomewardMode() {
  try {
    return localStorage.getItem(HOMEWARD_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Home() {
  return <Benefits nearby={false} />;
}

export function Benefits({ nearby }: { nearby: boolean }) {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('전체');
  const [area, setArea] = useState('전체');
  const [reference, setReference] = useState<'current' | 'donghae' | 'station' | 'main'>(
    session.location ? 'current' : 'donghae',
  );
  const [locationMessage, setLocationMessage] = useState('');
  const [homewardOnly, setHomewardOnly] = useState(readHomewardMode);
  const [now, setNow] = useState(() => new Date());
  const [focusShopId, setFocusShopId] = useState<string | null>(null);
  const uses = session.redemptions;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // 매장 QR 포스터로 들어온 손님(?shop=)을 그 가게에 포커스한다. 쿼리를 최우선으로 읽고
    // 지운 뒤, 다른 진입점(App.tsx의 sessionStorage 경로)도 대비해 둔다.
    const shopFromQuery = new URLSearchParams(location.search).get('shop');
    if (shopFromQuery) {
      setFocusShopId(shopFromQuery);
      navigate('/', { replace: true });
      return;
    }
    try {
      const stored = sessionStorage.getItem('focusShop');
      sessionStorage.removeItem('focusShop');
      if (stored) setFocusShopId(stored);
    } catch {
      // 세션 저장소를 쓸 수 없으면 QR 포커스는 건너뜁니다.
    }
  }, [location.search, navigate]);

  const nearbyOrigins = {
    current: session.location || VENUE_POINTS.donghae,
    donghae: VENUE_POINTS.donghae,
    station: AREA_POINTS.station,
    main: AREA_POINTS.main_gate,
  };
  const origin = nearby
    ? nearbyOrigins[reference]
    : session.location ||
      (session.destination ? VENUE_POINTS[session.destination as Venue] : AREA_POINTS.main_gate);

  const allRows = useMemo(
    () =>
      session.coupons
        .map((coupon) => ({
          coupon,
          shop: session.shops.find((shop) => shop.id === coupon.shopId),
        }))
        .filter((entry): entry is CouponRow => Boolean(entry.shop)),
    [session.coupons, session.shops],
  );

  const rows = useMemo(
    () =>
      session.user
        ? allRows
            .filter(({ coupon }) => {
              const status = evaluateEligibility(session.user!, coupon, now, uses);
              return status.eligible || Boolean(status.used);
            })
            .filter(({ shop }) => category === '전체' || shop.category === category)
            .filter(({ shop }) => area === '전체' || shop.area === area)
            .filter(
              ({ shop }) =>
                !nearby || !homewardOnly || distanceToPolylineMeters(shop, HOMEWARD_ROUTE) <= 120,
            )
            .sort((a, b) => {
              if (nearby && homewardOnly) {
                return (
                  progressAlongPolylineMeters(a.shop, HOMEWARD_ROUTE) -
                  progressAlongPolylineMeters(b.shop, HOMEWARD_ROUTE)
                );
              }
              return nearby
                ? distanceMeters(origin, a.shop) - distanceMeters(origin, b.shop)
                : Number(evaluateEligibility(session.user!, b.coupon, now, uses).usableNow) -
                    Number(evaluateEligibility(session.user!, a.coupon, now, uses).usableNow) ||
                    distanceMeters(origin, a.shop) - distanceMeters(origin, b.shop);
            })
        : [],
    [allRows, session.user, now, uses, category, area, nearby, homewardOnly, origin],
  );

  const lockedRows = useMemo(
    () =>
      session.user
        ? allRows.filter(({ coupon }) => {
            const status = evaluateEligibility(session.user!, coupon, now, uses);
            return coupon.active && !status.eligible && !status.used;
          })
        : [],
    [allRows, session.user, now, uses],
  );

  const focusShop = focusShopId ? session.shops.find((shop) => shop.id === focusShopId) : undefined;
  const focusRows =
    focusShop && session.user
      ? allRows
          .filter(({ shop }) => shop.id === focusShop.id)
          .map((row) => {
            const status = evaluateEligibility(session.user!, row.coupon, now, uses);
            return { row, locked: !status.eligible && !status.used };
          })
          .filter(({ row, locked }) => !locked || row.coupon.active)
      : [];

  const golden = goldenWindow(now, session.events);
  const visitorBenefitCount = allRows.filter(({ coupon }) => {
    if (!coupon.active || coupon.audience.type !== 'visitor') return false;
    if (session.user?.visitor) {
      return evaluateEligibility(session.user, coupon, now, uses).usableNow;
    }
    const venue = coupon.audience.venues?.[0] || 'donghae';
    const previewUser: UserDoc = {
      id: 'preview',
      role: 'customer',
      createdAt: now.toISOString(),
      visitor: {
        venue,
        verifiedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
      },
    };
    return evaluateEligibility(previewUser, coupon, now, []).usableNow;
  }).length;

  const qualification = session.user?.student
    ? '학생 인증됨'
    : session.user?.visitor
      ? '방문객 인증됨'
      : '인증하기';
  const referenceLabel = nearby
    ? reference === 'current' && session.location
      ? '현재 위치'
      : reference === 'station'
        ? '광운대역'
        : reference === 'main'
          ? '광운대 정문'
          : '동해문화예술관'
    : session.location
      ? '내 위치'
      : '광운대 정문';

  function chooseCurrentLocation() {
    if (!navigator.geolocation) {
      setReference('donghae');
      setLocationMessage('위치를 확인할 수 없어 동해문화예술관 기준으로 보여 드려요');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        session.setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setReference('current');
        setLocationMessage('');
      },
      () => {
        setReference('donghae');
        setLocationMessage('위치 권한을 확인하지 못해 동해문화예술관 기준으로 보여 드려요');
      },
    );
  }

  function toggleHomeward() {
    setHomewardOnly((current) => {
      const next = !current;
      try {
        localStorage.setItem(HOMEWARD_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // 저장소를 사용할 수 없어도 현재 세션의 필터는 유지합니다.
      }
      return next;
    });
  }

  const renderCard = ({ coupon, shop }: CouponRow, locked = false) => {
    const status = evaluateEligibility(session.user!, coupon, now, uses);
    const meters = distanceMeters(origin, shop);
    const stationMinutes = Math.max(1, Math.round(distanceMeters(shop, AREA_POINTS.station) / 80));
    const days =
      coupon.days === 'all'
        ? '매일'
        : coupon.days === 'weekday'
          ? '평일'
          : coupon.days === 'weekend'
            ? '주말'
            : coupon.days.join('·');
    return (
      <TicketCard
        key={coupon.id}
        to={locked ? '/verify' : `/coupon/${coupon.id}`}
        shopName={shop.name}
        category={shop.category}
        title={coupon.title}
        audience={coupon.audience.type}
        condition={`${days} ${coupon.timeFrom}–${coupon.timeTo}`}
        distance={formatDistance(meters)}
        walkMinutes={Math.max(1, Math.round(meters / 80))}
        usableNow={status.usableNow}
        used={Boolean(status.used)}
        goldenTime={golden.state === 'active' && coupon.audience.type === 'visitor'}
        lockedReason={locked ? lockedReason(session.user!, coupon, status.reason, now) : undefined}
        stubSecondary={nearby && homewardOnly ? `역까지 ${stationMinutes}분` : undefined}
      />
    );
  };

  return (
    <section className="screen benefits">
      <AppBar
        root
        title={nearby ? '주변' : '위월계더'}
        action={
          <Link className="qualification-chip" to="/verify">
            {qualification}
          </Link>
        }
      />
      <div className="benefits__heading">
        <h1>{nearby ? '가까운 혜택' : '오늘의 혜택'}</h1>
        <p>{nearby ? '가까운 순으로 보여 드려요' : '지금 쓸 수 있는 혜택을 먼저 보여 드려요'}</p>
      </div>
      {!session.user ? (
        <div className="ticket-list-region ticket-list-region--loading">
          <ul className="ticket-list" aria-label="혜택을 불러오는 중">
            {[0, 1, 2, 3].map((item) => (
              <TicketSkeleton key={item} />
            ))}
          </ul>
        </div>
      ) : (
        <>
          {!session.user.student && !session.user.visitor && lockedRows.length > 0 && (
            <Link className="verification-banner" to="/verify">
              <ShieldCopy />
              <span>
                <strong>인증하면 혜택 {lockedRows.length}개가 더 열려요</strong>
                <small>학생증이나 방문 티켓을 준비해 주세요</small>
              </span>
            </Link>
          )}
          {!nearby && golden.state !== 'none' && golden.endsAt && (
            <section className={`golden-card golden-card--${golden.state}`}>
              {golden.state === 'active' ? (
                <>
                  <strong>
                    <ClockIcon size={20} />
                    {golden.source === 'rink'
                      ? `스케이트 끝나고 골든타임 · ${clock(golden.endsAt)}까지`
                      : `공연 끝나고 골든타임 · ${golden.title}`}
                  </strong>
                  <span className="golden-card__countdown num">{countdown(golden.until)}</span>
                  <small>
                    {session.user.visitor ? '지금' : '인증하면'} {visitorBenefitCount}개 혜택이 열려
                    있어요
                  </small>
                </>
              ) : (
                <>
                  <strong>
                    <ClockIcon size={20} />
                    오늘 {clock(
                      new Date(golden.endsAt.getTime() - GOLDEN_TIME_MINUTES * 60_000),
                    )}{' '}
                    {golden.source === 'rink' ? '스케이트 종료' : `${golden.title} 종료`} 후 60분
                    골든타임
                  </strong>
                  <small>공연 있는 날은 공연 종료 후에도 열려요</small>
                </>
              )}
            </section>
          )}
          <div className="chip-row" aria-label="업종 필터">
            {categories.map((item) => (
              <Chip key={item} pressed={category === item} onClick={() => setCategory(item)}>
                {item}
              </Chip>
            ))}
          </div>
          {nearby ? (
            <>
              <div className="reference-segment" aria-label="거리 기준점">
                <button aria-pressed={reference === 'current'} onClick={chooseCurrentLocation}>
                  현재 위치
                </button>
                <button
                  aria-pressed={reference === 'donghae'}
                  onClick={() => setReference('donghae')}
                >
                  공연장
                </button>
                <button
                  aria-pressed={reference === 'station'}
                  onClick={() => setReference('station')}
                >
                  광운대역
                </button>
                <button aria-pressed={reference === 'main'} onClick={() => setReference('main')}>
                  정문
                </button>
              </div>
              <div className="homeward-filter">
                <Chip pressed={homewardOnly} onClick={toggleHomeward}>
                  귀갓길만
                </Chip>
              </div>
              {homewardOnly && (
                <p className="homeward-guide">
                  공연장에서 광운대역까지 549m, 걸어서 6분 길 위의 가게예요
                </p>
              )}
              {locationMessage && (
                <p className="reference-message" role="status">
                  {locationMessage}
                </p>
              )}
            </>
          ) : (
            <div className="chip-row chip-row--area" aria-label="구역 필터">
              <MapPinIcon size={16} />
              {([['전체', '전체 구역'], ...Object.entries(areaName)] as [string, string][]).map(
                ([value, label]) => (
                  <Chip key={value} pressed={area === value} onClick={() => setArea(value)}>
                    {label}
                  </Chip>
                ),
              )}
            </div>
          )}
          {!nearby && focusShop && (
            <section className="focus-shop" aria-label="QR로 들어온 가게">
              <div className="focus-shop__head">
                <h2>QR로 들어온 가게</h2>
                <button type="button" className="text-action" onClick={() => setFocusShopId(null)}>
                  전체 혜택 보기
                </button>
              </div>
              <p className="focus-shop__shop">
                {focusShop.name} · {focusShop.category} · {focusShop.address}
              </p>
              <ul className="ticket-list">
                {focusRows.map(({ row, locked }) => renderCard(row, locked))}
              </ul>
            </section>
          )}
          <div className="ticket-list-region">
            <p className="distance-reference">
              <MapPinIcon size={16} />
              {referenceLabel} 기준 거리예요
            </p>
            <ul className="ticket-list">{rows.map((row) => renderCard(row))}</ul>
            {!rows.length && (
              <div className="ticket-list__empty">
                <div className="ticket-list__empty-body">
                  <EmptyState
                    title={
                      nearby && homewardOnly
                        ? '귀갓길 120m 안에 아직 제휴 가게가 없어요'
                        : '조건에 맞는 혜택이 없어요'
                    }
                    description={
                      nearby && homewardOnly
                        ? '귀갓길 필터를 끄면 주변의 다른 혜택을 볼 수 있어요'
                        : '인증 상태나 필터를 바꾸면 다른 혜택을 볼 수 있어요'
                    }
                  />
                </div>
                <span className="ticket-list__empty-stub" aria-hidden="true" />
              </div>
            )}
            {!nearby && lockedRows.length > 0 && (
              <details className="locked-benefits">
                <summary>인증하면 열리는 혜택 {lockedRows.length}개</summary>
                <ul className="ticket-list">{lockedRows.map((row) => renderCard(row, true))}</ul>
              </details>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function ShieldCopy() {
  return (
    <span aria-hidden="true" className="verification-banner__icon">
      <ShieldIcon />
    </span>
  );
}
