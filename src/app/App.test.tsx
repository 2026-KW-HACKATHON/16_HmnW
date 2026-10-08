import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SessionProvider } from './Session';
import App from './App';
import { localDataSource } from '../data/local';
import type { DataSource } from '../data';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('로컬 모드 앱 셸에서 홈과 인증 경로를 오류 없이 표시한다', async () => {
  const error = vi.mocked(console.error),
    warn = vi.mocked(console.warn);
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  const { unmount } = render(
    <MemoryRouter initialEntries={['/']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: '오늘의 혜택' });
  expect(screen.getAllByText(/위월계더/).length).toBeGreaterThan(0);
  unmount();
  render(
    <MemoryRouter initialEntries={['/verify']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: '자격 인증' });
  await waitFor(() => expect(error).not.toHaveBeenCalled());
  expect(warn).not.toHaveBeenCalled();
});

it('혜택 상세에서 길게 눌러 사용하고 내 쿠폰 기록을 표시한다', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 8, 12, 0, 0));
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  const benefit = await screen.findByText('곱빼기 무료');
  fireEvent.click(benefit.closest('a')!);
  fireEvent.click(await screen.findByRole('link', { name: '매장에서 사용하기' }));
  const hold = await screen.findByRole('button', { name: /1.5초/ });
  await act(async () => {
    fireEvent.pointerDown(hold);
    await new Promise((resolve) => setTimeout(resolve, 1600));
  });
  expect(await screen.findByText('사용 완료')).toBeTruthy();
  // 같은 세션에서 상세로 돌아가면 즉시 '오늘 사용함'이고, 뒤로 가서 연 사용 화면은 재사용을 막는다.
  fireEvent.click(screen.getByRole('button', { name: '혜택 상세로 돌아가기' }));
  expect(await screen.findByText('오늘 사용함')).toBeTruthy();
  expect(
    (screen.getByRole('button', { name: '이미 사용했어요' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
  expect(await screen.findByText('오늘 이미 사용한 혜택이에요')).toBeTruthy();
  expect((screen.getByRole('button', { name: /1.5초/ }) as HTMLButtonElement).disabled).toBe(true);
  cleanup();
  render(
    <MemoryRouter initialEntries={['/coupons']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText(/곱빼기 무료/)).toBeTruthy();
  expect(console.error).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
});

it('쿠폰 사용 기록 저장이 실패하면 사용 완료로 바뀌지 않고 실패 문구를 보여준다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  const failingDataSource: DataSource = {
    ...localDataSource,
    redemptions: {
      ...localDataSource.redemptions,
      subscribe: (_uid, cb) => {
        cb([]);
        return () => {};
      },
      create: async () => {
        throw { code: 'test/network-error' };
      },
    },
  };
  render(
    <MemoryRouter initialEntries={['/coupon/c2/use']} future={future}>
      <SessionProvider source={Promise.resolve(failingDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  const hold = await screen.findByRole('button', { name: /1.5초/ });
  await act(async () => {
    fireEvent.pointerDown(hold);
    await new Promise((resolve) => setTimeout(resolve, 1600));
  });
  expect(screen.queryByText('사용 완료')).toBeNull();
  expect(
    await screen.findByText('사용 처리에 실패했어요. 네트워크를 확인하고 다시 눌러 주세요.'),
  ).toBeTruthy();
  expect(await screen.findByText('test/network-error')).toBeTruthy();
  const retryButton = (await screen.findByRole('button', {
    name: /1.5초/,
  })) as HTMLButtonElement;
  expect(retryButton.disabled).toBe(false);
});

it('모든 라우트를 콘솔 오류 없이 표시한다', async () => {
  const routes = [
    '/nearby',
    '/coupons',
    '/verify/student/card',
    '/verify/student/qr',
    '/verify/visitor/donghae',
    '/verify/visitor/icerink',
    '/coupon/c1',
    '/coupon/c1/use',
    '/more',
    '/owner',
    '/dev',
  ];
  const future = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as const;

  for (const route of routes) {
    const view = render(
      <MemoryRouter initialEntries={[route]} future={future}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(document.querySelector('.app')).toBeTruthy());
    view.unmount();
  }

  expect(console.error).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
});

it('혜택 구독이 늦게 도착해도 사용 화면을 유지한다', async () => {
  const delay =
    <T,>(subscribe: (callback: (value: T) => void) => () => void) =>
    (callback: (value: T) => void) =>
      subscribe((value) => window.setTimeout(() => callback(value), 30));
  const delayedSource: DataSource = {
    ...localDataSource,
    shops: { ...localDataSource.shops, subscribe: delay(localDataSource.shops.subscribe) },
    coupons: { ...localDataSource.coupons, subscribe: delay(localDataSource.coupons.subscribe) },
  };
  const future = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as const;

  render(
    <MemoryRouter initialEntries={['/coupon/c1/use']} future={future}>
      <SessionProvider source={Promise.resolve(delayedSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(screen.getByText('혜택을 불러오는 중이에요')).toBeTruthy();
  expect(await screen.findByText('직원에게 이 화면을 보여 주세요')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: '오늘의 혜택' })).toBeNull();
});

// c1은 학생(공과대학) 전용·평일 11:00-15:00 혜택이라, CTA가 '매장에서 사용하기'로 뜨려면
// 학생 자격을 주입하고 시각을 그 시간대 안으로 고정해야 합니다.
const verifiedStudentSource: DataSource = {
  ...localDataSource,
  users: {
    ...localDataSource.users,
    async get(uid) {
      const base = await localDataSource.users.get(uid);
      return (
        base && {
          ...base,
          student: {
            method: 'card' as const,
            studentNoMasked: '2026******',
            college: '공과대학',
            clubs: [],
            verifiedAt: '2026-10-05T00:00:00+09:00',
            expiresAt: '2099-01-01T00:00:00+09:00',
          },
        }
      );
    },
  },
};

it('혜택 상세는 고정 CTA 여백을 사용하고 직원 화면은 티켓 정보를 표시한다', async () => {
  vi.setSystemTime(new Date('2026-10-05T12:00:00+09:00'));
  const future = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as const;
  const view = render(
    <MemoryRouter initialEntries={['/coupon/c1']} future={future}>
      <SessionProvider source={Promise.resolve(verifiedStudentSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  const useLink = await screen.findByRole('link', { name: '매장에서 사용하기' });
  expect(document.querySelector('.screen--with-fixed-cta')).toBeTruthy();
  fireEvent.click(useLink);

  expect(await screen.findByText('직원에게 이 화면을 보여 주세요')).toBeTruthy();
  expect(screen.getByText('학생')).toBeTruthy();
  expect(document.querySelector('.coupon-use__ticket-bottom > p')?.textContent).toBe(
    '평일 11:00–15:00 · 하루 1번',
  );
  expect(screen.getByLabelText('실시간 화면 표시')).toBeTruthy();
  view.unmount();
});

it('혜택 상세는 시간대가 아니면 CTA를 비활성화하고 안내 문구를 보여준다', async () => {
  // c1은 평일 11:00-15:00만 사용 가능. 같은 평일의 10시는 시간대 밖이다.
  vi.setSystemTime(new Date('2026-10-05T10:00:00+09:00'));
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/coupon/c1']} future={future}>
      <SessionProvider source={Promise.resolve(verifiedStudentSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('지금은 사용 시간이 아니에요')).toBeTruthy();
  expect(screen.getByText('평일 11:00–15:00에 쓸 수 있어요')).toBeTruthy();
  const cta = (await screen.findByRole('button', {
    name: '사용 시간이 아니에요',
  })) as HTMLButtonElement;
  expect(cta.disabled).toBe(true);
});

it('혜택 상세는 학생 인증이 없으면 인증 화면으로 보내는 CTA를 보여준다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/coupon/c1']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('학생 인증이 필요해요')).toBeTruthy();
  fireEvent.click(await screen.findByRole('link', { name: '인증하고 사용하기' }));
  expect(await screen.findByRole('heading', { name: '자격 인증' })).toBeTruthy();
});

it('익명 로그인이 거부돼도 크래시 없이 렌더되고 안내 배너를 보여준다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  const failingSource: DataSource = {
    ...localDataSource,
    auth: {
      ...localDataSource.auth,
      anonymous: () => Promise.reject({ code: 'auth/configuration-not-found' }),
    },
  };

  render(
    <MemoryRouter initialEntries={['/']} future={future}>
      <SessionProvider source={Promise.resolve(failingSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('Firebase 콘솔에서 익명 로그인을 켜야 해요')).toBeTruthy();
  expect(await screen.findByRole('heading', { name: '오늘의 혜택' })).toBeTruthy();
});

it('주변 기준점은 공연장 한 줄 라벨을 사용한다', async () => {
  const future = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as const;
  render(
    <MemoryRouter initialEntries={['/nearby']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByRole('button', { name: '공연장' })).toBeTruthy();
  expect(screen.getByText('동해문화예술관 기준 거리예요')).toBeTruthy();
});

it('데이터 구독이 실패하면 배너로 알리고 다시 시도로 재구독한다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  let fail = true;
  const flakySource: DataSource = {
    ...localDataSource,
    coupons: {
      ...localDataSource.coupons,
      subscribe: (cb, onError) => {
        if (!fail) return localDataSource.coupons.subscribe(cb);
        onError?.({ code: 'permission-denied' });
        return () => {};
      },
    },
  };
  render(
    <MemoryRouter initialEntries={['/']} future={future}>
      <SessionProvider source={Promise.resolve(flakySource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText('데이터를 불러오지 못했어요 ·')).toBeTruthy();
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await waitFor(() => expect(screen.queryByText('데이터를 불러오지 못했어요 ·')).toBeNull());
  expect(await screen.findByText('계란말이 서비스')).toBeTruthy();
});

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-probe">{location.pathname + location.search}</span>;
}

it('QR 쿼리(?shop=)로 들어온 가게 섹션을 보여주고 URL을 /로 정리한다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/?shop=shop-food']} future={future}>
      <SessionProvider>
        <LocationProbe />
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText('QR로 들어온 가게')).toBeTruthy();
  expect(screen.getAllByText(/월계식당/).length).toBeGreaterThan(0);
  await waitFor(() => expect(screen.getByTestId('location-probe').textContent).toBe('/'));
});

it('QR로 들어온 가게 섹션은 세션 저장소의 가게를 보여주고 읽은 뒤 키를 지운다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  sessionStorage.setItem('focusShop', 'shop-food');
  render(
    <MemoryRouter initialEntries={['/']} future={future}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText('QR로 들어온 가게')).toBeTruthy();
  expect(screen.getAllByText(/월계식당/).length).toBeGreaterThan(0);
  expect(sessionStorage.getItem('focusShop')).toBeNull();
});
