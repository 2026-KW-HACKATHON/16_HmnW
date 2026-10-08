import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from './Session';
import App from './App';

// 최소 Firestore 가짜: 규칙처럼 uid 필터 없는 redemptions 구독은 거부하고,
// addDoc은 응답 전에 리스너를 호출해(지연 보정) 실제 SDK 순서를 흉내 냅니다.
vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/ai', () => ({
  getAI: vi.fn(),
  getGenerativeModel: vi.fn(),
  GoogleAIBackend: vi.fn(),
  Schema: {
    object: vi.fn(() => ({})),
    string: vi.fn(() => ({})),
    enumString: vi.fn(() => ({})),
    boolean: vi.fn(() => ({})),
    integer: vi.fn(() => ({})),
    number: vi.fn(() => ({})),
    array: vi.fn(() => ({})),
  },
}));
vi.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
  signInAnonymously: async () => ({ user: { uid: 'u1', email: null } }),
  EmailAuthProvider: { credential: () => ({}) },
  linkWithCredential: async () => ({}),
  signInWithEmailAndPassword: async () => ({}),
  signOut: async () => {},
}));
vi.mock('firebase/firestore', async () => {
  const partners = (await import('../../seed/partners.sample.json')).default;
  type Row = { id: string; [k: string]: unknown };
  type Target = { name: string; wheres?: { field: string; op: string; value: unknown }[] };
  const store: Record<string, Row[]> = {
    shops: partners.shops as Row[],
    coupons: partners.coupons as Row[],
    events: [],
    redemptions: [],
  };
  const listeners = new Set<() => void>();
  return {
    initializeFirestore: () => ({}),
    persistentLocalCache: () => ({}),
    persistentMultipleTabManager: () => ({}),
    collection: (_db: unknown, name: string) => ({ name }),
    query: (c: Target, ...wheres: Target['wheres'] & object) => ({ ...c, wheres }),
    where: (field: string, op: string, value: unknown) => ({ field, op, value }),
    doc: (_db: unknown, name: string, id?: string) => ({ name, id }),
    getDoc: async () => ({ exists: () => true, id: 'u1', data: () => ({ role: 'customer' }) }),
    getDocs: async () => ({ docs: [] }),
    setDoc: async (ref: { name: string; id?: string }, v: Record<string, unknown>) => {
      const rows = store[ref.name];
      const index = rows.findIndex((r) => r.id === ref.id);
      if (index === -1) rows.push({ id: ref.id!, ...v });
      else rows[index] = { id: ref.id!, ...v };
      listeners.forEach((f) => f());
    },
    updateDoc: async () => {},
    addDoc: async (c: Target, v: Record<string, unknown>) => {
      const id = `r${store[c.name].length}`;
      store[c.name].push({ id, ...v });
      listeners.forEach((f) => f());
      return { id };
    },
    onSnapshot: (t: Target, next: (s: unknown) => void, error?: (e: unknown) => void) => {
      const where = t.wheres?.find((w) => w.field === 'uid' && w.op === '==');
      if (t.name === 'redemptions' && !where) {
        error?.({ code: 'permission-denied' });
        return () => {};
      }
      const emit = () =>
        next({
          docs: store[t.name]
            .filter((d) => !where || d.uid === where.value)
            .map(({ id, ...d }) => ({ id, data: () => d })),
        });
      emit();
      listeners.add(emit);
      return () => listeners.delete(emit);
    },
  };
});

afterEach(cleanup);

it('Firebase 어댑터: 사용 직후 상세는 오늘 사용함, 사용 화면은 재사용을 막는다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  const source = import('../data/firebase').then((m) => m.firebaseDataSource);
  render(
    <MemoryRouter initialEntries={['/coupon/c2/use']} future={future}>
      <SessionProvider source={source}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  const hold = await screen.findByRole('button', { name: /1.5초/ });
  await act(async () => {
    fireEvent.pointerDown(hold);
    await new Promise((resolve) => setTimeout(resolve, 1600));
  });
  expect(await screen.findByText('사용 완료')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '혜택 상세로 돌아가기' }));
  expect(await screen.findByText('오늘 사용함')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
  expect(await screen.findByText('오늘 이미 사용한 혜택이에요')).toBeTruthy();
  expect((screen.getByRole('button', { name: /1.5초/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText('데이터를 불러오지 못했어요 ·')).toBeNull();
});
