import { describe, expect, it } from 'vitest';
import { evaluateEligibility } from './eligibility';
import type { Coupon, UserDoc, Redemption } from '../data/types';
const user: UserDoc = { id: 'u', role: 'customer', createdAt: '2026-01-01T00:00:00Z' };
const coupon = (patch: Partial<Coupon> = {}): Coupon => ({
  id: 'c',
  shopId: 's',
  title: '혜택',
  audience: { type: 'all' },
  days: 'all',
  timeFrom: '00:00',
  timeTo: '00:00',
  limit: 'once_per_day',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  ...patch,
});
const at = (iso: string) => new Date(iso);
describe('evaluateEligibility', () => {
  it('자정을 넘는 주말 시간대는 전날 요일로 판단한다', () =>
    expect(
      evaluateEligibility(
        user,
        coupon({ days: 'weekend', timeFrom: '18:00', timeTo: '02:00' }),
        at('2026-10-05T01:00:00+09:00'),
        [],
      ).usableNow,
    ).toBe(true));
  it('유효 기간 밖이면 사용할 수 없다', () =>
    expect(
      evaluateEligibility(
        user,
        coupon({ validTo: '2026-10-07' }),
        at('2026-10-08T12:00:00+09:00'),
        [],
      ).reason,
    ).toBe('기간이 끝난 혜택이에요.'));
  it('학생 자격 만료와 단과대 조건을 검사한다', () => {
    const u = {
      ...user,
      student: {
        method: 'card' as const,
        studentNoMasked: '2026******',
        college: '공과대학',
        clubs: [],
        verifiedAt: '2026-09-01T00:00:00Z',
        expiresAt: '2026-12-31T23:59:59+09:00',
      },
    };
    expect(
      evaluateEligibility(
        u,
        coupon({ audience: { type: 'student', colleges: ['공과대학'] } }),
        at('2026-10-08T12:00:00+09:00'),
        [],
      ).eligible,
    ).toBe(true);
  });
  it('외부인 방문지와 24시간 만료를 검사한다', () => {
    const u = {
      ...user,
      visitor: {
        venue: 'icerink' as const,
        verifiedAt: '2026-10-07T00:00:00Z',
        expiresAt: '2026-10-08T00:00:00Z',
      },
    };
    expect(
      evaluateEligibility(
        u,
        coupon({ audience: { type: 'visitor', venues: ['icerink'] } }),
        at('2026-10-08T12:00:00Z'),
        [],
      ).eligible,
    ).toBe(false);
  });
  it('오늘 사용 기록을 제한한다', () => {
    const r: Redemption = {
      id: 'r',
      uid: 'u',
      couponId: 'c',
      shopId: 's',
      at: '2026-10-08T01:00:00Z',
      dayKey: '2026-10-08',
    };
    expect(
      evaluateEligibility(user, coupon(), at('2026-10-08T12:00:00+09:00'), [r]).usedToday,
    ).toBe(true);
  });
  it('인증당 1회 사용을 제한한다', () => {
    const verifiedAt = '2026-10-08T00:00:00Z';
    const u = {
      ...user,
      visitor: { venue: 'donghae' as const, verifiedAt, expiresAt: '2026-10-09T00:00:00Z' },
    };
    const r: Redemption = {
      id: 'r',
      uid: 'u',
      couponId: 'c',
      shopId: 's',
      at: '2026-10-08T01:00:00Z',
      dayKey: '2026-10-08',
      verificationAt: verifiedAt,
    };
    expect(
      evaluateEligibility(
        u,
        coupon({ audience: { type: 'visitor' }, limit: 'once_per_verification' }),
        at('2026-10-08T12:00:00Z'),
        [r],
      ).eligible,
    ).toBe(false);
  });
  describe('student_or_visitor', () => {
    const stu = {
      method: 'card' as const,
      studentNoMasked: '2026******',
      college: '공과대학',
      clubs: [],
      verifiedAt: '2026-10-08T00:00:00Z',
      expiresAt: '2027-01-01T00:00:00Z',
    };
    const vis = {
      venue: 'donghae' as const,
      verifiedAt: '2026-10-08T00:00:00Z',
      expiresAt: '2027-01-01T00:00:00Z',
    };
    const c = coupon({ audience: { type: 'student_or_visitor', colleges: ['경영대학'] } });
    const now = at('2026-10-09T12:00:00');
    it('학생만 통과', () => {
      const r = evaluateEligibility({ ...user, student: { ...stu, college: '경영대학' } }, c, now);
      expect(r.eligible && r.via).toBe('student');
    });
    it('방문객만 통과', () => {
      const r = evaluateEligibility({ ...user, visitor: vis }, c, now);
      expect(r.eligible && r.via).toBe('visitor');
    });
    it('둘 다 없으면 불가', () => {
      const r = evaluateEligibility(user, c, now);
      expect(r.eligible).toBe(false);
      expect(r.reason).toBe('학생 인증이 필요해요.');
    });
    it('단과대 불일치여도 방문객이면 통과', () => {
      const r = evaluateEligibility({ ...user, student: stu, visitor: vis }, c, now);
      expect(r.eligible && r.via).toBe('visitor');
    });
  });
});
