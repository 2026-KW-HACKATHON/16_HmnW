import { describe, expect, it } from 'vitest';
import { formatRedemptionTime } from './format';

describe('formatRedemptionTime', () => {
  const now = new Date(2026, 9, 8, 18, 0);

  it('uses a relative label only for today', () => {
    expect(formatRedemptionTime(new Date(2026, 9, 8, 14, 17), now)).toBe('오늘 14:17');
    expect(formatRedemptionTime(new Date(2026, 9, 7, 14, 17), now)).toBe('10/7(수) 14:17');
  });

  it('uses a compact dated label for older history', () => {
    expect(formatRedemptionTime(new Date(2026, 9, 6, 14, 17), now)).toBe('10/6(화) 14:17');
  });
});
