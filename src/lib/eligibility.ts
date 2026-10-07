import type { Coupon, Redemption, UserDoc } from '../data/types';
export type Eligibility = {
  eligible: boolean;
  reason: string;
  usableNow: boolean;
  usedToday: boolean;
  used?: boolean;
};
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const validDate = (value: string | undefined, end = false) =>
  !value ? undefined : new Date(`${value}${end ? 'T23:59:59' : 'T00:00:00'}`);
export function evaluateEligibility(
  user: UserDoc,
  coupon: Coupon,
  now = new Date(),
  redemptions: Redemption[] = [],
): Eligibility {
  if (!coupon.active)
    return {
      eligible: false,
      reason: '현재 중단된 혜택이에요.',
      usableNow: false,
      usedToday: false,
    };
  const start = validDate(coupon.validFrom),
    end = validDate(coupon.validTo, true);
  if (start && now < start)
    return {
      eligible: false,
      reason: '아직 시작하지 않은 혜택이에요.',
      usableNow: false,
      usedToday: false,
    };
  if (end && now > end)
    return {
      eligible: false,
      reason: '기간이 끝난 혜택이에요.',
      usableNow: false,
      usedToday: false,
    };
  let verificationAt: string | undefined;
  if (coupon.audience.type === 'student') {
    const q = user.student;
    if (!q || new Date(q.expiresAt) < now)
      return {
        eligible: false,
        reason: '학생 인증이 필요해요.',
        usableNow: false,
        usedToday: false,
      };
    if (coupon.audience.colleges?.length && !coupon.audience.colleges.includes(q.college))
      return {
        eligible: false,
        reason: '해당 단과대 대상 혜택이에요.',
        usableNow: false,
        usedToday: false,
      };
    if (coupon.audience.clubs?.length && !coupon.audience.clubs.some((x) => q.clubs.includes(x)))
      return {
        eligible: false,
        reason: '해당 동아리 대상 혜택이에요.',
        usableNow: false,
        usedToday: false,
      };
    verificationAt = q.verifiedAt;
  }
  if (coupon.audience.type === 'visitor') {
    const q = user.visitor;
    if (!q || new Date(q.expiresAt) < now)
      return {
        eligible: false,
        reason: '방문 인증이 필요해요.',
        usableNow: false,
        usedToday: false,
      };
    if (coupon.audience.venues?.length && !coupon.audience.venues.includes(q.venue))
      return {
        eligible: false,
        reason: '다른 방문지 대상 혜택이에요.',
        usableNow: false,
        usedToday: false,
      };
    verificationAt = q.verifiedAt;
  }
  const usedToday = redemptions.some((r) => r.couponId === coupon.id && r.dayKey === dayKey(now));
  const usedVerification =
    coupon.limit === 'once_per_verification' &&
    redemptions.some((r) => r.couponId === coupon.id && r.verificationAt === verificationAt);
  if ((coupon.limit === 'once_per_day' && usedToday) || usedVerification)
    return {
      eligible: false,
      reason: '이미 사용한 혜택이에요.',
      usableNow: false,
      usedToday,
      used: true,
    };
  const minute = now.getHours() * 60 + now.getMinutes(),
    parse = (s: string) => {
      const [a, b] = s.split(':').map(Number);
      return a * 60 + b;
    },
    from = parse(coupon.timeFrom),
    to = parse(coupon.timeTo),
    overnight = from > to;
  const inTime =
    from === to || (overnight ? minute >= from || minute < to : minute >= from && minute < to);
  const base = new Date(now);
  if (overnight && minute < to) base.setDate(base.getDate() - 1);
  const day = base.getDay(),
    dayAllowed =
      coupon.days === 'all' ||
      (coupon.days === 'weekday' && day >= 1 && day <= 5) ||
      (coupon.days === 'weekend' && (day === 0 || day === 6)) ||
      (Array.isArray(coupon.days) && coupon.days.includes(day));
  const usableNow = Boolean(inTime && dayAllowed);
  return {
    eligible: true,
    reason: usableNow ? '지금 사용할 수 있어요.' : '사용 가능한 시간이 아니에요.',
    usableNow,
    usedToday,
  };
}
