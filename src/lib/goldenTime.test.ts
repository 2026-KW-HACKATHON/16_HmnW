import { describe, expect, it } from 'vitest';
import { goldenWindow } from './goldenTime';

describe('goldenWindow', () => {
  it('returns the active weekday rink window at 17:10', () => {
    const result = goldenWindow(new Date(2026, 9, 8, 17, 10), []);

    expect(result.source).toBe('rink');
    expect(result.state).toBe('active');
    expect(result.endsAt).toEqual(new Date(2026, 9, 8, 17, 50));
    expect(result.until).toBe(40 * 60_000);
  });

  it('returns the upcoming weekday rink window at 14:00', () => {
    const result = goldenWindow(new Date(2026, 9, 8, 14, 0), []);

    expect(result.source).toBe('rink');
    expect(result.state).toBe('upcoming');
    expect(result.endsAt).toEqual(new Date(2026, 9, 8, 17, 50));
  });

  it('returns an active event window after a 19:30 performance', () => {
    const result = goldenWindow(new Date(2026, 9, 8, 21, 30), [
      {
        id: 'event-1',
        venue: 'donghae',
        title: '가을 음악회',
        startsAt: new Date(2026, 9, 8, 19, 30).toISOString(),
      },
    ]);

    expect(result.source).toBe('event');
    expect(result.title).toBe('가을 음악회');
    expect(result.state).toBe('active');
    expect(result.endsAt).toEqual(new Date(2026, 9, 8, 22, 30));
  });

  it('returns none after every window has ended', () => {
    expect(goldenWindow(new Date(2026, 9, 8, 23, 50), [])).toEqual({
      source: 'rink',
      title: '',
      endsAt: null,
      until: 0,
      state: 'none',
    });
  });
});
