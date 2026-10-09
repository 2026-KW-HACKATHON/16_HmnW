import { useParams } from 'react-router-dom';
import { useSession } from '../app/Session';
import { evaluateEligibility } from '../lib/eligibility';
import { formatHours } from '../lib/format';
import { mapLinks } from '../lib/geo';
import { AppBar } from '../ui/AppBar';
import { Badge } from '../ui/Badge';
import { Button, ButtonLink } from '../ui/Button';
import { FixedCta } from '../ui/FixedCta';
import { AlertIcon, ClockIcon, NavigationIcon, PhoneIcon, StoreIcon } from '../ui/icons';

const dayLabel = { all: '매일', weekday: '평일', weekend: '주말' } as const;
const limitLabel = {
  once_per_day: '하루 1번',
  once_per_verification: '인증 1번당 1번',
  unlimited: '제한 없음',
} as const;
// evaluateEligibility가 활성 기간이 아니라고 판단할 때 돌려주는 reason들(종료/비활성 묶음)
const endedReasons = new Set([
  '현재 중단된 혜택이에요.',
  '아직 시작하지 않은 혜택이에요.',
  '기간이 끝난 혜택이에요.',
]);

export default function CouponDetail() {
  const { id } = useParams();
  const session = useSession();
  const coupon = session.coupons.find((item) => item.id === id);
  const shop = session.shops.find((item) => item.id === coupon?.shopId);
  if (session.loading) {
    return (
      <div className="route-loading" role="status">
        혜택을 불러오는 중이에요
      </div>
    );
  }
  if (!coupon || !shop)
    return <p className="screen__content">혜택을 찾을 수 없어요. 목록에서 다시 선택해 주세요.</p>;
  const links = mapLinks(shop.name, shop);
  const days = Array.isArray(coupon.days) ? coupon.days.join('·') : dayLabel[coupon.days];
  const status =
    session.user && evaluateEligibility(session.user, coupon, new Date(), session.redemptions);
  const state = !status
    ? 'ready'
    : status.used
      ? 'used'
      : endedReasons.has(status.reason)
        ? 'ended'
        : !status.eligible
          ? 'unverified'
          : !status.usableNow
            ? 'off-hours'
            : 'ready';
  return (
    <article className="screen screen--with-fixed-cta coupon-detail">
      <AppBar title={shop.name} />
      <div className="coupon-detail__ticket">
        <p>
          {shop.name} · {shop.category}
        </p>
        <h1>{coupon.title}</h1>
        <div className="coupon-detail__badges">
          <Badge audience={coupon.audience.type} />
          <span>오늘 ~{coupon.timeTo}</span>
        </div>
        <div
          className={`status-box${state === 'ready' || state === 'used' ? '' : ' status-box--warning'}`}
        >
          {state === 'ready' || state === 'used' ? <ClockIcon /> : <AlertIcon />}
          <span>
            {state === 'used' ? (
              <>
                <strong>{status?.usedToday ? '오늘 사용함' : '이미 사용함'}</strong>
                <small>{limitLabel[coupon.limit]}만 사용할 수 있어요</small>
              </>
            ) : state === 'off-hours' ? (
              <>
                <strong>지금은 사용 시간이 아니에요</strong>
                <small>
                  {days} {coupon.timeFrom}–{coupon.timeTo}에 쓸 수 있어요
                </small>
              </>
            ) : state === 'unverified' ? (
              <>
                <strong>
                  {coupon.audience.type === 'visitor'
                    ? '방문객'
                    : coupon.audience.type === 'student_or_visitor'
                      ? '학생 또는 방문객'
                      : '학생'}{' '}
                  인증이 필요해요
                </strong>
                <small>인증하면 바로 사용할 수 있어요</small>
              </>
            ) : state === 'ended' ? (
              <>
                <strong>종료된 혜택이에요</strong>
                <small>다른 혜택을 둘러봐 주세요</small>
              </>
            ) : (
              <>
                <strong>지금 사용할 수 있어요</strong>
                <small>오늘 {coupon.timeTo}까지 사용해 주세요</small>
              </>
            )}
          </span>
        </div>
      </div>
      <hr className="section-band" />
      <section className="coupon-detail__section">
        <h2>이용 조건</h2>
        <dl>
          <dt>대상</dt>
          <dd>
            {coupon.audience.type === 'all'
              ? '누구나'
              : coupon.audience.type === 'student'
                ? '광운대 학생'
                : coupon.audience.type === 'student_or_visitor'
                  ? '광운대 학생 또는 방문객'
                  : '방문객'}
          </dd>
          <dt>요일</dt>
          <dd>{days}</dd>
          <dt>시간</dt>
          <dd className="num">
            {coupon.timeFrom}–{coupon.timeTo}
          </dd>
          <dt>1인 제한</dt>
          <dd>{limitLabel[coupon.limit]}</dd>
        </dl>
        {coupon.desc && <p>{coupon.desc}</p>}
      </section>
      <hr className="section-band" />
      <section className="coupon-detail__section">
        <h2>가게 정보</h2>
        <p>
          <StoreIcon size={20} />
          {shop.address}
        </p>
        {shop.phone && (
          <a href={`tel:${shop.phone}`}>
            <PhoneIcon size={20} />
            {shop.phone}
          </a>
        )}
        <p>
          <ClockIcon size={20} />
          {formatHours(shop.hours) || '영업시간은 매장에 문의해 주세요'}
        </p>
        <div className="button-row">
          <a
            className="button button--secondary button--m"
            href={links.naver}
            target="_blank"
            rel="noreferrer"
          >
            <NavigationIcon size={18} />
            네이버지도
          </a>
          <a
            className="button button--secondary button--m"
            href={links.kakao}
            target="_blank"
            rel="noreferrer"
          >
            <NavigationIcon size={18} />
            카카오맵
          </a>
        </div>
      </section>
      <FixedCta>
        {state === 'used' ? (
          <Button size="l" full disabled>
            이미 사용했어요
          </Button>
        ) : state === 'off-hours' ? (
          <Button size="l" full disabled>
            사용 시간이 아니에요
          </Button>
        ) : state === 'ended' ? (
          <Button size="l" full disabled>
            종료된 혜택이에요
          </Button>
        ) : state === 'unverified' ? (
          <ButtonLink to="/verify" size="l" full>
            인증하고 사용하기
          </ButtonLink>
        ) : (
          <ButtonLink to={`/coupon/${coupon.id}/use`} size="l" full>
            매장에서 사용하기
          </ButtonLink>
        )}
      </FixedCta>
    </article>
  );
}
