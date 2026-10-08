import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createDataSource, type DataSource } from '../data';
import type { AuthUser, Coupon, EventDoc, Redemption, Shop, UserDoc } from '../data/types';
import type { Point } from '../lib/geo';

type Session = {
  data: DataSource | null;
  auth: AuthUser | null;
  user: UserDoc | null;
  shops: Shop[];
  coupons: Coupon[];
  events: EventDoc[];
  /** 현재 사용자의 사용 기록(한 번 구독해 모든 화면이 공유) */
  redemptions: Redemption[];
  loading: boolean;
  authError: string | null;
  dataError: string | null;
  location: Point | null;
  presentation: boolean;
  destination: string | null;
  refreshUser(): Promise<void>;
  retryAuth(): Promise<void>;
  retryData(): void;
  ownerLogin(email: string, password: string, create: boolean): Promise<AuthUser>;
  setLocation(v: Point | null): void;
  setPresentation(v: boolean): void;
  setDestination(v: string | null): void;
};
const Context = createContext<Session | null>(null);

export function SessionProvider({
  children,
  source,
}: {
  children: ReactNode;
  source?: Promise<DataSource>;
}) {
  const [data, setData] = useState<DataSource | null>(null),
    [auth, setAuth] = useState<AuthUser | null>(null),
    [user, setUser] = useState<UserDoc | null>(null),
    [shops, setShops] = useState<Shop[]>([]),
    [coupons, setCoupons] = useState<Coupon[]>([]),
    [events, setEvents] = useState<EventDoc[]>([]),
    [redemptions, setRedemptions] = useState<Redemption[]>([]),
    [loaded, setLoaded] = useState({
      shops: false,
      coupons: false,
      events: false,
      redemptions: false,
    }),
    [dataError, setDataError] = useState<string | null>(null),
    [retry, setRetry] = useState(0),
    [location, setLocation] = useState<Point | null>(null),
    [presentation, setPresentationState] = useState(localStorage.getItem('presentation') === '1'),
    [destination, setDestination] = useState<string | null>(null),
    [authError, setAuthError] = useState<string | null>(null);
  const connectAuth = async (d: DataSource) => {
    setAuthError(null);
    try {
      const a = await d.auth.anonymous();
      setAuth(a);
      let u = await d.users.get(a.uid);
      if (!u) {
        await d.users.update(a.uid, { role: 'customer', createdAt: new Date().toISOString() });
        u = await d.users.get(a.uid);
      }
      setUser(u);
    } catch (error) {
      setAuthError((error as { code?: string })?.code || String(error));
    }
  };
  // 구독 결과/실패 모두 loaded로 표시해 화면이 로딩에 갇히지 않게 하고, 실패는 dataError로 드러냅니다.
  const watch = <T,>(key: keyof typeof loaded, set: (v: T[]) => void) =>
    [
      (value: T[]) => {
        set(value);
        setLoaded((current) => ({ ...current, [key]: true }));
      },
      (error: unknown) => {
        setDataError((error as { code?: string })?.code || String(error));
        setLoaded((current) => ({ ...current, [key]: true }));
      },
    ] as const;
  useEffect(() => {
    let active = true;
    (source || createDataSource()).then(async (d) => {
      if (!active) return;
      setData(d);
      await connectAuth(d);
    });
    return () => {
      active = false;
    };
  }, [source]);
  useEffect(() => {
    if (!data) return;
    const offs = [
      data.shops.subscribe(...watch('shops', setShops)),
      data.coupons.subscribe(...watch('coupons', setCoupons)),
      data.events.subscribe(...watch('events', setEvents)),
    ];
    return () => offs.forEach((off) => off());
  }, [data, retry]);
  const uid = auth?.uid;
  useEffect(() => {
    if (!data || !uid) return;
    return data.redemptions.subscribe(uid, ...watch('redemptions', setRedemptions));
  }, [data, uid, retry]);
  const refreshUser = async () => {
    if (data && auth) setUser(await data.users.get(auth.uid));
  };
  const retryAuth = async () => {
    if (data) await connectAuth(data);
  };
  const retryData = () => {
    setDataError(null);
    setRetry((n) => n + 1);
  };
  const ownerLogin = async (email: string, password: string, create: boolean) => {
    if (!data) throw new Error('데이터 연결을 준비하는 중이에요. 잠시 후 다시 시도해 주세요.');
    const a = await data.auth.owner(email, password, create);
    setAuth(a);
    setUser(await data.users.get(a.uid));
    return a;
  };
  const setPresentation = (v: boolean) => {
    localStorage.setItem('presentation', v ? '1' : '0');
    setPresentationState(v);
  };
  return (
    <Context.Provider
      value={{
        data,
        auth,
        user,
        shops,
        coupons,
        events,
        redemptions,
        // 사용 기록이 오기 전에 사용 화면이 열리면 하루 1번 제한을 우회할 수 있어 함께 기다립니다.
        loading: !loaded.shops || !loaded.coupons || (!!uid && !loaded.redemptions),
        authError,
        dataError,
        location,
        presentation,
        destination,
        refreshUser,
        retryAuth,
        retryData,
        ownerLogin,
        setLocation,
        setPresentation,
        setDestination,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => {
  const v = useContext(Context);
  if (!v) throw new Error('SessionProvider가 필요해요.');
  return v;
};
