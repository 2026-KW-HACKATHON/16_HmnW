import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../app/Session';
import type { Coupon } from '../data/types';
import { evaluateEligibility } from '../lib/eligibility';
import { formatClock } from '../lib/format';
import { sha256Hex } from '../lib/hash';
import { Badge } from '../ui/Badge';
import { authErrorMessage } from '../ui/AuthErrorBanner';
import { Button } from '../ui/Button';
import { FixedCta } from '../ui/FixedCta';
import { CheckIcon, XIcon } from '../ui/icons';

const dayLabel: Record<Exclude<Coupon['days'], number[]>, string> = {
  all: '매일',
  weekday: '평일',
  weekend: '주말',
};

const limitLabel: Record<Coupon['limit'], string> = {
  once_per_day: '하루 1번',
  once_per_verification: '인증 1번당 1번',
  unlimited: '제한 없음',
};

export default function CouponUse() {
  const { id } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const coupon = session.coupons.find((item) => item.id === id);
  const shop = session.shops.find((item) => item.id === coupon?.shopId);
  const [clock, setClock] = useState(new Date());
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number>();

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer.current);
    };
  }, []);

  if (session.loading) {
    return (
      <div className="route-loading" role="status">
        혜택을 불러오는 중이에요
      </div>
    );
  }
  if (!coupon || !shop) return <Navigate to="/" replace />;

  const days = Array.isArray(coupon.days) ? coupon.days.join('·') : dayLabel[coupon.days];
  const qualification =
    coupon.audience.type === 'student'
      ? session.user?.student?.college
        ? `학생 인증 · ${session.user.student.college}`
        : '학생 인증'
      : coupon.audience.type === 'visitor'
        ? `${session.user?.visitor?.venue === 'icerink' ? '아이스링크' : '동해문화예술관'} 방문 · 오늘`
        : '별도 인증 없이 사용할 수 있어요';
  // 방금 이 화면에서 사용한 경우(pending/done)는 완료 화면을 우선합니다.
  const status =
    session.user && evaluateEligibility(session.user, coupon, clock, session.redemptions);
  const used = !done && !pending && !!status?.used;
  const usedMessage = status?.usedToday ? '오늘 이미 사용한 혜택이에요' : '이미 사용한 혜택이에요';
  const alreadyRedeemed = error === 'already-redeemed';
  const liveDots = [0, 1, 2]
    .map((index) => (clock.getSeconds() % 3 === index ? '●' : '○'))
    .join('');

  const redeem = async () => {
    if (shop.pinHash && (await sha256Hex(pin)) !== shop.pinHash) {
      setMessage('PIN이 맞지 않아요. 직원에게 번호를 다시 확인해 주세요.');
      return;
    }
    setError('');
    setPending(true);
    const now = new Date();
    const verificationAt =
      coupon.audience.type === 'student'
        ? session.user?.student?.verifiedAt
        : coupon.audience.type === 'visitor'
          ? session.user?.visitor?.verifiedAt
          : undefined;
    try {
      await session.data!.redemptions.create(
        {
          uid: session.auth!.uid,
          couponId: coupon.id,
          shopId: shop.id,
          at: now.toISOString(),
          dayKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
          verificationAt,
        },
        coupon.limit,
      );
      setHolding(false);
      setPending(false);
      setDone(true);
    } catch (err) {
      setHolding(false);
      setPending(false);
      setError((err as { code?: string })?.code || String(err));
    }
  };

  const start = () => {
    if (timer.current !== undefined || pending) return;
    setMessage('');
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void redeem();
    }, 1500);
  };

  const stop = () => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
    setMessage('1.5초 동안 눌러야 완료돼요');
  };

  return (
    <section className={`coupon-use${done ? ' coupon-use--complete' : ''}`} data-theme="light">
      <div className="coupon-use__pattern" aria-hidden="true" />
      <button
        className="coupon-use__close"
        type="button"
        aria-label="혜택 상세로 돌아가기"
        onClick={() => navigate(`/coupon/${coupon.id}`)}
      >
        <XIcon />
      </button>
      <header className="coupon-use__clock">
        <time className="num">{formatClock(clock)}</time>
        <span>
          {clock.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </span>
        <small className="coupon-use__live" aria-label="실시간 화면 표시">
          <span className="num" aria-hidden="true">
            {liveDots}
          </span>
          실시간
        </small>
      </header>

      <main className="coupon-use__content">
        <p className="coupon-use__guide">직원에게 이 화면을 보여 주세요</p>
        <article className="coupon-use__ticket">
          <div className="coupon-use__ticket-top">
            <p>{shop.name}</p>
            <h1>{coupon.title}</h1>
            <div className="coupon-use__qualification">
              <Badge audience={coupon.audience.type} />
              <span>{qualification}</span>
            </div>
          </div>
          <div className="coupon-use__ticket-bottom">
            <p>
              {days}{' '}
              <span className="num">
                {coupon.timeFrom}–{coupon.timeTo}
              </span>{' '}
              · {limitLabel[coupon.limit]}
            </p>
            {shop.pinHash && !done && (
              <label className="coupon-use__pin">
                <span>직원 PIN</span>
                <input
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="one-time-code"
                />
              </label>
            )}
            {done && (
              <div className="coupon-use__complete">
                <strong>
                  <CheckIcon size={40} />
                  사용 완료
                </strong>
                <p>직원이 화면을 확인했어요</p>
              </div>
            )}
          </div>
        </article>
      </main>

      <FixedCta className="fixed-cta--employee">
        {done ? (
          <>
            <p className="fixed-cta__help">{formatClock(clock)}에 사용 완료</p>
            <Button variant="secondary" size="l" full onClick={() => navigate('/coupons')}>
              내 쿠폰 보기
            </Button>
          </>
        ) : shop.pinHash ? (
          <>
            <p className="fixed-cta__help">
              {session.authError
                ? authErrorMessage(session.authError)
                : used
                  ? usedMessage
                  : '직원에게 PIN 입력을 부탁해 주세요'}
            </p>
            <Button
              variant="inverse"
              size="l"
              full
              onClick={redeem}
              disabled={pending || !!session.authError || used}
            >
              {pending ? '처리 중…' : 'PIN으로 사용 완료'}
            </Button>
            {error && (
              <p className="fixed-cta__help fixed-cta__help--warning">
                {alreadyRedeemed ? (
                  '이미 사용한 혜택이에요'
                ) : (
                  <>
                    사용 처리에 실패했어요. 네트워크를 확인하고 다시 눌러 주세요.
                    <br />
                    <small>{error}</small>
                  </>
                )}
              </p>
            )}
          </>
        ) : (
          <>
            <p className={`fixed-cta__help${message || used ? ' fixed-cta__help--warning' : ''}`}>
              {session.authError
                ? authErrorMessage(session.authError)
                : used
                  ? usedMessage
                  : message || '직원 확인 후, 직원이 버튼을 길게 눌러 주세요'}
            </p>
            <Button
              className={`hold-button${holding ? ' hold-button--active' : ''}`}
              variant="inverse"
              size="l"
              full
              disabled={pending || !!session.authError || used}
              aria-describedby="hold-description"
              onPointerDown={start}
              onPointerUp={stop}
              onPointerCancel={stop}
              onPointerLeave={stop}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault();
                  start();
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'Enter') stop();
              }}
            >
              <span className="hold-button__fill" aria-hidden="true" />
              <span className="hold-button__label">
                {pending
                  ? '처리 중…'
                  : holding
                    ? '계속 누르고 있어 주세요'
                    : '1.5초 길게 눌러 사용 완료'}
              </span>
              <small>직원용</small>
            </Button>
            {error && (
              <p className="fixed-cta__help fixed-cta__help--warning">
                {alreadyRedeemed ? (
                  '이미 사용한 혜택이에요'
                ) : (
                  <>
                    사용 처리에 실패했어요. 네트워크를 확인하고 다시 눌러 주세요.
                    <br />
                    <small>{error}</small>
                  </>
                )}
              </p>
            )}
            <span id="hold-description" className="sr-only">
              1.5초 동안 길게 누르면 사용 완료돼요
            </span>
          </>
        )}
      </FixedCta>
    </section>
  );
}
