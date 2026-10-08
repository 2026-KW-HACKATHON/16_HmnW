import { beforeEach, expect, it, vi } from 'vitest';

const currentUserRef: { current: { uid: string; isAnonymous: boolean } | null } = {
  current: null,
};
const signInWithEmailAndPassword = vi.fn(
  async (_auth: unknown, email: string, _password: string) => ({
    user: { uid: 'owner-uid', email },
  }),
);
const linkWithCredential = vi.fn();
type FakeSnapshot = {
  exists(): boolean;
  data?(): Record<string, unknown>;
};
const getDoc = vi.fn(async (..._args: unknown[]): Promise<FakeSnapshot> => ({
  exists: () => false,
}));
const setDoc = vi.fn(async (..._args: unknown[]) => {});

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
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
  getAuth: vi.fn(() => ({
    get currentUser() {
      return currentUserRef.current;
    },
  })),
  EmailAuthProvider: { credential: vi.fn((email, password) => ({ email, password })) },
  linkWithCredential: (...args: unknown[]) => linkWithCredential(...args),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: (...args: Parameters<typeof signInWithEmailAndPassword>) =>
    signInWithEmailAndPassword(...args),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  setDoc: (...args: unknown[]) => setDoc(...args),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({ id: 'id' })),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: vi.fn(async () => ({ docs: [] })),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn((_collection: unknown, ...constraints: unknown[]) => ({ constraints })),
  updateDoc: vi.fn(async () => {}),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

beforeEach(() => {
  currentUserRef.current = null;
  signInWithEmailAndPassword.mockClear();
  linkWithCredential.mockReset();
  getDoc.mockReset().mockResolvedValue({ exists: () => false });
  setDoc.mockClear();
});

it('코드를 조회해 학생 자격을 사용자 문서에 저장한다', async () => {
  currentUserRef.current = { uid: 'student-uid', isAnonymous: true };
  getDoc.mockResolvedValueOnce({
    exists: () => true,
    data: () => ({
      label: '체험 · 광운대 학생',
      grant: 'student',
      college: '인공지능융합대학',
      active: true,
    }),
  });
  const { firebaseDataSource } = await import('./firebase');

  const result = await firebaseDataSource.accessCodes.redeem(' kw 2026 ');

  expect(result.label).toBe('체험 · 광운대 학생');
  expect(setDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      student: expect.objectContaining({ method: 'code', studentNoMasked: '체험' }),
    }),
    { merge: true },
  );
});

it('없는 코드는 invalid-code 오류로 거절한다', async () => {
  currentUserRef.current = { uid: 'student-uid', isAnonymous: true };
  getDoc.mockResolvedValue({ exists: () => false });
  const { firebaseDataSource } = await import('./firebase');

  await expect(firebaseDataSource.accessCodes.redeem('missing')).rejects.toEqual({
    code: 'invalid-code',
  });
});

it('익명 상태에서 기존 이메일로 가입을 시도하면 link 실패 후 signIn으로 폴백한다', async () => {
  currentUserRef.current = { uid: 'anon-uid', isAnonymous: true };
  linkWithCredential.mockRejectedValueOnce(
    Object.assign(new Error('이미 사용 중'), { code: 'auth/email-already-in-use' }),
  );
  const { firebaseDataSource } = await import('./firebase');

  const result = await firebaseDataSource.auth.owner('owner@example.com', 'secret123', true);

  expect(linkWithCredential).toHaveBeenCalledTimes(1);
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'owner@example.com',
    'secret123',
  );
  expect(result).toEqual({ uid: 'owner-uid', email: 'owner@example.com' });
});

it('사용 기록 구독은 현재 uid로 필터한 쿼리를 듣고 오류를 삼키지 않는다', async () => {
  const { onSnapshot } = await import('firebase/firestore');
  const { firebaseDataSource } = await import('./firebase');
  const onError = vi.fn();

  firebaseDataSource.redemptions.subscribe('u1', vi.fn(), onError);

  const [target, , error] = vi.mocked(onSnapshot).mock.calls.at(-1) as unknown as [
    unknown,
    unknown,
    (e: unknown) => void,
  ];
  expect(target).toEqual({ constraints: [{ field: 'uid', op: '==', value: 'u1' }] });
  error({ code: 'permission-denied' });
  expect(onError).toHaveBeenCalledWith({ code: 'permission-denied' });
});

it('가게별 사용 기록 구독은 shopId로 필터한 쿼리를 듣는다', async () => {
  const { onSnapshot } = await import('firebase/firestore');
  const { firebaseDataSource } = await import('./firebase');

  firebaseDataSource.redemptions.subscribeByShop('shop-1', vi.fn());

  const [target] = vi.mocked(onSnapshot).mock.calls.at(-1) as unknown as [unknown];
  expect(target).toEqual({ constraints: [{ field: 'shopId', op: '==', value: 'shop-1' }] });
});
