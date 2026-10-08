import { describe, expect, it } from 'vitest';
import { formatHours, formatRedemptionTime } from './format';

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

describe('formatHours', () => {
  it('normalizes hyphenated time ranges to an en dash', () => {
    expect(formatHours('11:00-21:00')).toBe('11:00–21:00');
    expect(formatHours('월-토 15:00-23:00, 일 휴무')).toBe('월-토 15:00–23:00, 일 휴무');
    expect(formatHours('10:00–22:00')).toBe('10:00–22:00');
    expect(formatHours(undefined)).toBeUndefined();
  });
});
