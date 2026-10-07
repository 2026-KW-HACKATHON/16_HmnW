import { describe, expect, it } from 'vitest';
import { redemptionId } from './redemption';

describe('redemptionId', () => {
  it('once_per_day는 uid·coupon·dayKey로만 결정된다', () => {
    expect(redemptionId('u1', { id: 'c1', limit: 'once_per_day' }, '2026-10-08')).toBe(
      'u1_c1_2026-10-08',
    );
    expect(redemptionId('u1', { id: 'c1', limit: 'once_per_day' }, '2026-10-08')).toBe(
      redemptionId('u1', { id: 'c1', limit: 'once_per_day' }, '2026-10-08'),
    );
  });
  it('once_per_verification은 verificationAt을 안전한 키로 바꾸고, 없으면 novf를 쓴다', () => {
    expect(
      redemptionId(
        'u1',
        { id: 'c1', limit: 'once_per_verification' },
        '2026-10-08',
        '2026-10-08T00:00:00Z',
      ),
    ).toBe('u1_c1_2026-10-08T00-00-00Z');
    expect(redemptionId('u1', { id: 'c1', limit: 'once_per_verification' }, '2026-10-08')).toBe(
      'u1_c1_novf',
    );
  });
  it('unlimited는 매번 다른 id를 만든다', () => {
    const a = redemptionId('u1', { id: 'c1', limit: 'unlimited' }, '2026-10-08');
    const b = redemptionId('u1', { id: 'c1', limit: 'unlimited' }, '2026-10-08');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^u1_c1_\d+_\d{4}$/);
  });
});
