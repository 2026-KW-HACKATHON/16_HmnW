import partners from '../../seed/partners.sample.json';
import events from '../../seed/events.json';
import { redemptionId } from '../lib/redemption';
import type { DataSource } from './index';
import type { AuthUser, Coupon, EventDoc, Redemption, Shop, UserDoc } from './types';
const KEY = 'wolgye-partners-v1';
type DB = {
  users: UserDoc[];
  shops: Shop[];
  coupons: Coupon[];
  events: EventDoc[];
  redemptions: Redemption[];
  auth?: AuthUser;
  studentNos?: Record<string, { uid: string; claimedAt: string }>;
};
const fresh = (): DB => ({
  users: [],
  shops: structuredClone(partners.shops) as Shop[],
  coupons: structuredClone(partners.coupons) as Coupon[],
  events: structuredClone(events) as EventDoc[],
  redemptions: [],
});
let db: DB = (() => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY)!) as DB;
    return value ? { ...fresh(), ...value } : fresh();
  } catch {
    return fresh();
  }
})();
const listeners = {
  shops: new Set<(v: Shop[]) => void>(),
  coupons: new Set<(v: Coupon[]) => void>(),
  events: new Set<(v: EventDoc[]) => void>(),
  redemptions: new Set<(v: Redemption[]) => void>(),
};
const save = () => localStorage.setItem(KEY, JSON.stringify(db));
const id = () => crypto.randomUUID();
const ensure = (u: AuthUser, role: 'customer' | 'owner') => {
  let d = db.users.find((x) => x.id === u.uid);
  if (!d) {
    d = { id: u.uid, role, createdAt: new Date().toISOString() };
    db.users.push(d);
    save();
  } else if (role === 'owner') {
    d.role = 'owner';
    save();
  }
  return d;
};
export const localDataSource: DataSource = {
  mode: 'local',
  auth: {
    async anonymous() {
      const u = db.auth || { uid: 'demo-customer' };
      db.auth = u;
      ensure(u, 'customer');
      save();
      return u;
    },
    async owner(email, _password, _create) {
      const u = { uid: db.auth?.uid || 'demo-customer', email };
      db.auth = u;
      ensure(u, 'owner');
      save();
      return u;
    },
    async signOut() {
      delete db.auth;
      save();
    },
  },
  users: {
    async get(uid) {
      return db.users.find((x) => x.id === uid) || null;
    },
    async update(uid, data) {
      const d = db.users.find((x) => x.id === uid);
      if (d) Object.assign(d, data);
      else
        db.users.push({ id: uid, role: 'customer', createdAt: new Date().toISOString(), ...data });
      save();
    },
  },
  students: {
    async claim(studentNoHash, uid) {
      db.studentNos ||= {};
      const current = db.studentNos[studentNoHash];
      if (current && current.uid !== uid) throw { code: 'already-claimed' };
      if (!current) db.studentNos[studentNoHash] = { uid, claimedAt: new Date().toISOString() };
      save();
    },
  },
  shops: {
    subscribe(cb) {
      listeners.shops.add(cb);
      cb(db.shops);
      return () => listeners.shops.delete(cb);
    },
    async create(v) {
      const x = { ...v, id: id() };
      db.shops.push(x);
      save();
      listeners.shops.forEach((f) => f(db.shops));
      return x.id;
    },
    async update(i, v) {
      Object.assign(
        db.shops.find((x) => x.id === i)!,
        v,
      );
      save();
      listeners.shops.forEach((f) => f(db.shops));
    },
  },
  coupons: {
    subscribe(cb) {
      listeners.coupons.add(cb);
      cb(db.coupons);
      return () => listeners.coupons.delete(cb);
    },
    async create(v) {
      const x = { ...v, id: id() };
      db.coupons.push(x);
      save();
      listeners.coupons.forEach((f) => f(db.coupons));
      return x.id;
    },
    async update(i, v) {
      Object.assign(
        db.coupons.find((x) => x.id === i)!,
        v,
      );
      save();
      listeners.coupons.forEach((f) => f(db.coupons));
    },
  },
  events: {
    subscribe(cb) {
      listeners.events.add(cb);
      cb(db.events);
      return () => listeners.events.delete(cb);
    },
    async addEvents(items) {
      db.events = [...db.events, ...items];
      save();
      listeners.events.forEach((f) => f(db.events));
    },
  },
  redemptions: {
    async create(v, limit) {
      const rid = redemptionId(v.uid, { id: v.couponId, limit }, v.dayKey, v.verificationAt);
      if (db.redemptions.some((x) => x.id === rid)) throw { code: 'already-redeemed' };
      const x = {
        ...Object.fromEntries(Object.entries(v).filter(([, value]) => value !== undefined)),
        id: rid,
      } as Redemption;
      db.redemptions.push(x);
      save();
      listeners.redemptions.forEach((f) => f(db.redemptions));
      return x.id;
    },
    subscribe(uid, cb) {
      const f = (v: Redemption[]) => cb(v.filter((x) => x.uid === uid));
      listeners.redemptions.add(f);
      f(db.redemptions);
      return () => listeners.redemptions.delete(f);
    },
    subscribeByShop(shopId, cb) {
      const f = (v: Redemption[]) => cb(v.filter((x) => x.shopId === shopId));
      listeners.redemptions.add(f);
      f(db.redemptions);
      return () => listeners.redemptions.delete(f);
    },
    async query(uid, shopIds) {
      return db.redemptions.filter(
        (x) => (!uid || x.uid === uid) && (!shopIds || shopIds.includes(x.shopId)),
      );
    },
  },
  async seed() {
    const auth = db.auth,
      users = db.users,
      redemptions = db.redemptions;
    db = { ...fresh(), auth, users, redemptions };
    save();
    listeners.shops.forEach((f) => f(db.shops));
    listeners.coupons.forEach((f) => f(db.coupons));
    listeners.events.forEach((f) => f(db.events));
  },
};
