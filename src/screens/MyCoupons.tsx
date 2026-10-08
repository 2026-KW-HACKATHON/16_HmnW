import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../app/Session';
import { evaluateEligibility } from '../lib/eligibility';
import { formatRedemptionTime } from '../lib/format';
import { AppBar } from '../ui/AppBar';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

const pad = (value: number) => String(value).padStart(2, '0');
const passVenueName = { donghae: '동해문화예술관', icerink: '아이스링크' } as const;

export default function MyCoupons() {
  const session = useSession();
  const items = session.redemptions;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const openedCount = session.user
    ? session.coupons.filter(
        (coupon) => evaluateEligibility(session.user!, coupon, now, items).eligible,
      ).length
    : 0;
  const visitorRemaining = session.user?.visitor
    ? Math.max(0, new Date(session.user.visitor.expiresAt).getTime() - now.getTime())
    : 0;
  const remainingMinutes = Math.max(0, Math.ceil(visitorRemaining / 60_000));
  const remainingLabel = `${pad(Math.floor(remainingMinutes / 60))}:${pad(remainingMinutes % 60)}`;

  return (
    <section className="screen my-coupons">
      <AppBar root title="내 쿠폰" />
      <div className="screen__content">
        <section className="qualification qualification--passes">
          <h2>자격 상태</h2>
          <div className="pass-list">
            {session.user?.student && (
              <article className="pass-card">
                <span className="pass-card__body">
                  <Badge audience="student" />
                  <strong>광운대 학생 패스</strong>
                  <span>{session.user.student.college} · 12월 31일까지</span>
                  <small>열린 혜택 {openedCount}개</small>
                </span>
                <span className="pass-card__stub">학생</span>
              </article>
            )}
            {session.user?.visitor && (
              <article className="pass-card">
                <span className="pass-card__body">
                  <Badge audience="visitor" />
                  <strong>방문객 패스</strong>
                  <span>{passVenueName[session.user.visitor.venue]}</span>
                  {session.user.visitor.partySize && (
                    <small>{session.user.visitor.partySize}명</small>
                  )}
                  <small>열린 혜택 {openedCount}개</small>
                </span>
                <span
                  className={`pass-card__stub${remainingMinutes < 60 ? ' pass-card__stub--warning' : ''}`}
                >
                  <small>남은 시간</small>
                  <strong className="num">{remainingLabel}</strong>
                </span>
              </article>
            )}
            {!session.user?.student && !session.user?.visitor && (
              <Link className="pass-card pass-card--empty" to="/verify">
                <span className="pass-card__body">
                  <strong>인증하면 패스가 생겨요</strong>
                  <small>학생증이나 방문 티켓으로 인증해 주세요</small>
                </span>
                <span className="pass-card__stub">인증하기</span>
              </Link>
            )}
          </div>
        </section>
        <section className="history">
          <h2>사용 내역</h2>
          {items.length ? (
            <ul>
              {[...items]
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((item) => {
                  const coupon = session.coupons.find((entry) => entry.id === item.couponId);
                  const shop = session.shops.find((entry) => entry.id === item.shopId);
                  return (
                    <li key={item.id}>
                      <strong>
                        {shop?.name || '가게'} · {coupon?.title || '혜택'}
                      </strong>
                      <time dateTime={item.at}>{formatRedemptionTime(new Date(item.at), now)}</time>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <EmptyState
              title="아직 사용한 혜택이 없어요"
              description="매장에서 혜택을 사용하면 이곳에 기록이 남아요"
            />
          )}
        </section>
      </div>
    </section>
  );
}
