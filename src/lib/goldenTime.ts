import type { EventDoc } from '../data/types';

export const PERFORMANCE_DURATION_MINUTES = 120;
export const GOLDEN_TIME_MINUTES = 60;
export const RINK_WEEKDAY_CLOSE = '16:50';
export const RINK_WEEKEND_CLOSE = '15:50';

export type GoldenWindow = {
  source: 'rink' | 'event';
  title: string;
  endsAt: Date | null;
  until: number;
  state: 'active' | 'upcoming' | 'none';
};

type Candidate = Omit<GoldenWindow, 'until' | 'state'> & { startsAt: Date };

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function goldenWindow(now: Date, events: EventDoc[]): GoldenWindow {
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  const [rinkHour, rinkMinute] = (weekend ? RINK_WEEKEND_CLOSE : RINK_WEEKDAY_CLOSE)
    .split(':')
    .map(Number);
  const rinkClose = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    rinkHour,
    rinkMinute,
  );
  const rinkEnd = new Date(rinkClose.getTime() + GOLDEN_TIME_MINUTES * 60_000);
  const candidates: Candidate[] = [
    { source: 'rink', title: '스케이트', startsAt: rinkClose, endsAt: rinkEnd },
    ...events
      .filter((event) => sameLocalDay(new Date(event.startsAt), now))
      .map((event) => {
        const startsAt = event.endsAt
          ? new Date(event.endsAt)
          : new Date(new Date(event.startsAt).getTime() + PERFORMANCE_DURATION_MINUTES * 60_000);
        return {
          source: 'event' as const,
          title: event.title,
          startsAt,
          endsAt: new Date(startsAt.getTime() + GOLDEN_TIME_MINUTES * 60_000),
        };
      }),
  ];

  const active = candidates
    .filter(({ startsAt, endsAt }) => startsAt <= now && Boolean(endsAt && now < endsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  if (active?.endsAt) {
    return { ...active, state: 'active', until: active.endsAt.getTime() - now.getTime() };
  }

  const upcoming = candidates
    .filter(({ startsAt }) => now < startsAt)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  if (upcoming?.endsAt) {
    return { ...upcoming, state: 'upcoming', until: upcoming.startsAt.getTime() - now.getTime() };
  }

  return { source: 'rink', title: '', endsAt: null, until: 0, state: 'none' };
}
