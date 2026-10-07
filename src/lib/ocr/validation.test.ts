import { describe, expect, it } from 'vitest';
import { validateRinkResult, validateTicketResult, validateTicketWithoutEvent } from './validation';
const now = new Date('2026-10-08T20:00:00+09:00');
describe('OCR 확인값 검증', () => {
  it('공연명과 일시를 요구하고 공연 전날부터 당일만 허용한다', () => {
    expect(validateTicketResult('', null, new Date('2026-10-08T19:30:00+09:00'), now)).toContain(
      '공연명',
    );
    expect(
      validateTicketResult(
        '가을 음악회',
        new Date('2026-10-06T19:30:00+09:00'),
        new Date('2026-10-08T19:30:00+09:00'),
        now,
      ),
    ).toContain('전날');
  });
  it('아이스링크 인원은 1~20명이고 영수증은 24시간 이내여야 한다', () => {
    expect(validateRinkResult(21, now, now)).toContain('1~20');
    expect(validateRinkResult(2, new Date(now.getTime() - 25 * 36e5), now)).toContain('24시간');
  });
  it('일정이 없으면 티켓 날짜가 어제부터 오늘 사이여야 한다', () => {
    expect(
      validateTicketWithoutEvent('가을 음악회', new Date('2026-10-07T19:30:00+09:00'), now),
    ).toBe('');
    expect(
      validateTicketWithoutEvent('가을 음악회', new Date('2026-10-06T19:30:00+09:00'), now),
    ).toContain('어제');
  });
});
