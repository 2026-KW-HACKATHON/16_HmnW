import type { Coupon, Redemption, UserDoc } from '../data/types';
export type Eligibility = {
  eligible: boolean;
  reason: string;
  usableNow: boolean;
  usedToday: boolean;
  used?: boolean;
  via?: 'student' | 'visitor';
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
  const a = coupon.audience;
  const fail = (reason: string): Eligibility => ({
    eligible: false,
    reason,
    usableNow: false,
    usedToday: false,
  });
  const checkStudent = ():
    { reason: string; at?: undefined } | { at: string; reason?: undefined } => {
    const q = user.student;
    if (!q || new Date(q.expiresAt) < now) return { reason: '학생 인증이 필요해요.' };
    if (a.colleges?.length && !a.colleges.includes(q.college))
      return { reason: '해당 단과대 대상 혜택이에요.' };
    if (a.clubs?.length && !a.clubs.some((x) => q.clubs.includes(x)))
      return { reason: '해당 동아리 대상 혜택이에요.' };
    return { at: q.verifiedAt };
  };
  const checkVisitor = ():
    { reason: string; at?: undefined } | { at: string; reason?: undefined } => {
    const q = user.visitor;
    if (!q || new Date(q.expiresAt) < now) return { reason: '방문 인증이 필요해요.' };
    if (a.venues?.length && !a.venues.includes(q.venue))
      return { reason: '다른 방문지 대상 혜택이에요.' };
    return { at: q.verifiedAt };
  };
  let verificationAt: string | undefined;
  let via: Eligibility['via'];
  if (a.type === 'student' || a.type === 'visitor') {
    const r = a.type === 'student' ? checkStudent() : checkVisitor();
    if (r.reason) return fail(r.reason);
    verificationAt = r.at;
  } else if (a.type === 'student_or_visitor') {
    const st = checkStudent(),
      vi = checkVisitor();
    if (st.reason && vi.reason) return fail(st.reason);
    via = st.reason ? 'visitor' : 'student';
    verificationAt = st.reason ? vi.at : st.at;
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
    via,
  };
}
