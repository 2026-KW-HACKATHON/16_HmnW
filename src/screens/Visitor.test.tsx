import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../app/Session';
import App from '../app/App';
import { localDataSource } from '../data/local';
import type { DataSource } from '../data';
import type { EventDoc } from '../data/types';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('오늘·내일 회차가 없으면 다가오는 공연을 같은 공연끼리 합쳐 보여준다', async () => {
  const base = new Date(Date.now() + 10 * 86_400_000);
  base.setHours(20, 0, 0, 0);
  const next = new Date(base.getTime() + 86_400_000);
  const events: EventDoc[] = [
    {
      id: 'e1',
      venue: 'donghae',
      title: '케니 지 내한 공연',
      startsAt: base.toISOString(),
      hall: '대극장',
      kopisId: 'kopis-1',
    },
    {
      id: 'e2',
      venue: 'donghae',
      title: '케니 지 내한 공연',
      startsAt: next.toISOString(),
      hall: '대극장',
      kopisId: 'kopis-1',
    },
  ];
  const source: DataSource = {
    ...localDataSource,
    events: { ...localDataSource.events, subscribe: (cb) => (cb(events), () => {}) },
  };
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/verify/visitor/donghae']} future={future}>
      <SessionProvider source={Promise.resolve(source)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  await screen.findByText('아직 등록된 공연이 없어요');
  expect(await screen.findByText('다가오는 공연')).toBeTruthy();
  expect(
    screen.getByText(
      /^케니 지 내한 공연 · \d{1,2}\/\d{1,2}\(.\)·\d{1,2}\/\d{1,2}\(.\) 20:00 · 대극장$/,
    ),
  ).toBeTruthy();
});
