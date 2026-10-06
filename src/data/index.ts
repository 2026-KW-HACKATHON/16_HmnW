import type { AuthUser, Coupon, EventDoc, Redemption, Shop, Unsubscribe, UserDoc } from './types';
type OnError = (error: unknown) => void;
export interface DataSource {
  mode: 'local' | 'firebase';
  auth: {
    anonymous(): Promise<AuthUser>;
    owner(email: string, password: string, create?: boolean): Promise<AuthUser>;
    signOut(): Promise<void>;
  };
  users: {
    get(uid: string): Promise<UserDoc | null>;
    update(uid: string, data: Partial<UserDoc>): Promise<void>;
  };
  students: {
    claim(studentNoHash: string, uid: string): Promise<void>;
  };
  shops: {
    subscribe(cb: (v: Shop[]) => void, onError?: OnError): Unsubscribe;
    create(v: Omit<Shop, 'id'>): Promise<string>;
    update(id: string, v: Partial<Shop>): Promise<void>;
  };
  coupons: {
    subscribe(cb: (v: Coupon[]) => void, onError?: OnError): Unsubscribe;
    create(v: Omit<Coupon, 'id'>): Promise<string>;
    update(id: string, v: Partial<Coupon>): Promise<void>;
  };
  events: {
    subscribe(cb: (v: EventDoc[]) => void, onError?: OnError): Unsubscribe;
    addEvents(events: EventDoc[]): Promise<void>;
  };
  redemptions: {
    create(v: Omit<Redemption, 'id'>, limit: Coupon['limit']): Promise<string>;
    subscribe(uid: string, cb: (v: Redemption[]) => void, onError?: OnError): Unsubscribe;
    subscribeByShop(shopId: string, cb: (v: Redemption[]) => void, onError?: OnError): Unsubscribe;
    query(uid?: string, shopIds?: string[]): Promise<Redemption[]>;
  };
  seed(): Promise<void>;
}
export async function createDataSource(): Promise<DataSource> {
  return import.meta.env.VITE_FIREBASE_API_KEY
    ? (await import('./firebase')).firebaseDataSource
    : (await import('./local')).localDataSource;
}
