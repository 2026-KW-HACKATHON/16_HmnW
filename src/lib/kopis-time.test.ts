import { describe, expect, it } from 'vitest';
import { expandDtGuidance, parseDtGuidance } from '../../scripts/kopis-time.mjs';

describe('KOPIS 공연시간 해석', () => {
  it('한국어 요일 범위와 복수 시각을 읽는다', () => {
    const parsed = parseDtGuidance('화요일 ~ 금요일(19:30), 토요일(15:00,19:00)');
    expect(parsed.get(2)).toEqual(['19:30']);
    expect(parsed.get(5)).toEqual(['19:30']);
    expect(parsed.get(6)).toEqual(['15:00', '19:00']);
  });
  it('붙어 있는 물결표와 공휴일 표기를 허용한다', () => {
    const parsed = parseDtGuidance('월요일~수요일(20:00), 공휴일(15:00)');
    expect(parsed.get(1)).toEqual(['20:00']);
    expect(parsed.get(3)).toEqual(['20:00']);
    expect(parsed.has(0)).toBe(false);
  });
  it('기간의 실제 날짜와 회차로 전개한다', () => {
    const sessions = expandDtGuidance(
      '2026.10.05',
      '2026.10.11',
      '화요일~금요일(19:30), 토요일(15:00,19:00)',
    );
    expect(sessions).toContain('2026-10-06T19:30:00+09:00');
    expect(sessions).toContain('2026-10-10T15:00:00+09:00');
    expect(sessions).toHaveLength(6);
  });
});
