import { expect, it } from 'vitest';
import type { EventDoc } from '../data/types';
import { recalcToTodayTomorrow } from './shared';

it('샘플 공연의 시각은 유지하고 날짜만 오늘·내일로 재계산한다', () => {
  const now = new Date('2026-10-08T12:00:00+09:00');
  const events: EventDoc[] = [
    {
      id: 'event-today-1',
      venue: 'donghae',
      title: '가을 음악회',
      startsAt: '2099-01-01T19:30:00+09:00',
    },
    {
      id: 'event-tomorrow-1',
      venue: 'donghae',
      title: '재즈 나이트',
      startsAt: '2099-01-02T19:00:00+09:00',
    },
  ];
  const [today, tomorrow] = recalcToTodayTomorrow(events, now);
  expect(new Date(today.startsAt)).toEqual(new Date('2026-10-08T19:30:00+09:00'));
  expect(new Date(tomorrow.startsAt)).toEqual(new Date('2026-10-09T19:00:00+09:00'));
  expect(today.id).toBe('demo-event-today-1');
  expect(today.title).toBe('가을 음악회');
});
